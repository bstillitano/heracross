import CoreLocation
import Foundation
import Scyther

/// The Objective-C face of Scyther that the `Heracross` Turbo Module calls.
///
/// `Heracross.mm` declares a matching `@interface` by hand rather than importing
/// this target's generated `-Swift.h` header, so every selector here is spelled
/// out explicitly and must stay in sync with that declaration.
///
/// Turbo Module methods arrive on the module's own serial queue. Scyther's
/// facade is `@MainActor`, so every call is forwarded to the main queue, which
/// also preserves the order the calls were made in from JavaScript.
@objc(HeracrossScyther)
public final class HeracrossScyther: NSObject {

    // MARK: - Lifecycle

    /// Starts Scyther. Since 4.8.1, the minimum Heracross resolves, Scyther
    /// ignores every call after the one that started it.
    @objc(startAllowingProductionBuilds:)
    public static func start(allowProductionBuilds: Bool) {
        onMain { Scyther.start(allowProductionBuilds: allowProductionBuilds) }
    }

    /// Calls back with whether Scyther has started. It runs after any `start`
    /// call made before it, so it reflects that call's outcome.
    @objc(isStarted:)
    public static func isStarted(_ completion: @escaping @Sendable (Bool) -> Void) {
        onMain { completion(Scyther.isStarted) }
    }

    /// Presents the menu from the top view controller.
    @objc(showMenu)
    public static func showMenu() {
        onMain { Scyther.showMenu() }
    }

    /// Dismisses the menu if it is presented.
    @objc(hideMenu)
    public static func hideMenu() {
        onMain { Scyther.hideMenu() }
    }

    /// `"shake"` maps to ``ScytherGesture/shake``; anything else to
    /// ``ScytherGesture/custom``, which leaves opening the menu to the host.
    @objc(setInvocationGesture:)
    public static func setInvocationGesture(_ gesture: String) {
        onMain { Scyther.invocationGesture = gesture == "shake" ? .shake : .custom }
    }

    // MARK: - Feature flags

    /// Registers a flag, listed in the menu by its key, with its remote value.
    @objc(registerFeatureFlag:defaultValue:)
    public static func registerFeatureFlag(_ key: String, defaultValue: Bool) {
        onMain {
            Scyther.featureFlags.register(key, remoteValue: defaultValue)
            scheduleChangeCheck()
        }
    }

    /// Calls back with the flag's effective value.
    @objc(isFeatureFlagEnabled:completion:)
    public static func isFeatureFlagEnabled(_ key: String, completion: @escaping @Sendable (Bool) -> Void) {
        onMain { completion(Scyther.featureFlags.isEnabled(key)) }
    }

    /// The menu's "Enable overrides" switch.
    @objc(setFeatureFlagOverridesEnabled:)
    public static func setFeatureFlagOverridesEnabled(_ enabled: Bool) {
        onMain {
            Scyther.featureFlags.localOverridesEnabled = enabled
            scheduleChangeCheck()
        }
    }

    /// Sets a registered flag's local override. Scyther ignores unregistered keys.
    @objc(setFeatureFlagOverride:value:)
    public static func setFeatureFlagOverride(_ key: String, value: Bool) {
        onMain {
            Scyther.featureFlags.setLocalValue(value, for: key)
            scheduleChangeCheck()
        }
    }

    /// Clears a flag's local override.
    @objc(clearFeatureFlagOverride:)
    public static func clearFeatureFlagOverride(_ key: String) {
        onMain {
            Scyther.featureFlags.clearLocalValue(for: key)
            scheduleChangeCheck()
        }
    }

    /// Clears every registered flag's local override.
    @objc(resetFeatureFlagOverrides)
    public static func resetFeatureFlagOverrides() {
        onMain {
            Scyther.featureFlags.clearAllLocalValues()
            scheduleChangeCheck()
        }
    }

    // MARK: - Servers

    /// Each element is `{ id, baseUrl, variables }`. Afterwards, if Scyther's
    /// saved selection isn't a configured server, the first one is selected, so
    /// iOS falls back the way Android does.
    @objc(configureServers:)
    public static func configureServers(_ servers: [[String: Any]]) {
        let entries = servers.compactMap(ServerEntry.init)
        enqueueServerWork {
            for entry in entries {
                await Scyther.servers.register(id: entry.id, variables: entry.variables)
            }
            if await Scyther.servers.current == nil, let first = entries.first {
                await Scyther.servers.select(first.id)
            }
            scheduleChangeCheck()
        }
    }

    /// Selects a configured server. Unknown ids are ignored, as on Android;
    /// Scyther itself would store them and leave no server selected.
    @objc(selectServer:)
    public static func selectServer(_ id: String) {
        enqueueServerWork {
            guard await Scyther.servers.all.contains(where: { $0.id == id }) else { return }
            await Scyther.servers.select(id)
            scheduleChangeCheck()
        }
    }

    /// Calls back with the selected server's id, base URL and variables (without
    /// the stored `baseUrl` entry), or a `nil` id when none is configured.
    @objc(getSelectedServer:)
    public static func getSelectedServer(
        _ completion: @escaping @Sendable (String?, String, [String: String]) -> Void
    ) {
        enqueueServerWork {
            guard let current = await Scyther.servers.current else {
                completion(nil, "", [:])
                return
            }
            let split = ServerEntry.split(current.variables)
            completion(current.id, split.baseUrl, split.variables)
        }
    }

    // MARK: - Change events

    /// Receives each registered flag whose effective value changes.
    @MainActor private static var featureFlagChanged: (@Sendable (String, Bool) -> Void)?

    /// Receives the newly selected server's id, base URL and variables.
    @MainActor private static var serverChanged: (@Sendable (String, String, [String: String]) -> Void)?

    @MainActor private static var flagTracker = FlagChangeTracker()
    @MainActor private static var selectionTracker = SelectionTracker()
    @MainActor private static var defaultsObserver: (any NSObjectProtocol)?
    @MainActor private static var changeCheckScheduled = false

    /// Sets the callbacks for flag and server changes, replacing any earlier
    /// ones, and starts watching for changes.
    ///
    /// Scyther posts no change notifications, but it saves flag overrides, the
    /// overrides switch and the selected server in `UserDefaults`. So Heracross
    /// re-reads them whenever defaults change anywhere in the process, and after
    /// each call here that could change them, and reports what differs from the
    /// last read.
    @objc(setFeatureFlagChangeHandler:serverChangeHandler:)
    public static func setChangeHandlers(
        featureFlag: @escaping @Sendable (String, Bool) -> Void,
        server: @escaping @Sendable (String, String, [String: String]) -> Void
    ) {
        onMain {
            featureFlagChanged = featureFlag
            serverChanged = server
            if defaultsObserver == nil {
                defaultsObserver = NotificationCenter.default.addObserver(
                    forName: UserDefaults.didChangeNotification,
                    object: nil,
                    queue: nil
                ) { _ in
                    scheduleChangeCheck()
                }
            }
            scheduleChangeCheck()
        }
    }

    /// Queues one check behind the work already on the main queue, so a burst of
    /// defaults writes is read once.
    private static func scheduleChangeCheck() {
        onMain {
            guard !changeCheckScheduled else { return }
            changeCheckScheduled = true
            onMain {
                changeCheckScheduled = false
                checkForChanges()
            }
        }
    }

    @MainActor private static func checkForChanges() {
        guard featureFlagChanged != nil || serverChanged != nil else { return }
        var flags: [String: Bool] = [:]
        for flag in Scyther.featureFlags.all {
            flags[flag.name] = Scyther.featureFlags.isEnabled(flag.name)
        }
        for change in flagTracker.update(flags) {
            featureFlagChanged?(change.key, change.enabled)
        }
        // Read the selection behind any queued server work, so a `select` made
        // before this check is already visible to it.
        enqueueServerWork {
            let current = await Scyther.servers.current
            let id = current?.id
            let variables = current?.variables ?? [:]
            await MainActor.run {
                guard let changed = selectionTracker.update(id) else { return }
                let split = ServerEntry.split(variables)
                serverChanged?(changed, split.baseUrl, split.variables)
            }
        }
    }

    // MARK: - Menu content

    /// Replaces the Environment Variables screen's rows. Values that aren't
    /// strings are skipped.
    @objc(setEnvironmentVariables:)
    public static func setEnvironmentVariables(_ variables: [String: Any]) {
        let values = variables.compactMapValues { $0 as? String }
        onMain { Scyther.environmentVariables = values }
    }

    /// Each element is `{ name, value }`, shown as a read-only value row.
    @objc(setDeveloperOptions:)
    public static func setDeveloperOptions(_ options: [[String: Any]]) {
        let rows: [NameValue] = options.compactMap { option in
            guard let name = option["name"] as? String else { return nil }
            return NameValue(name: name, value: option["value"] as? String ?? "")
        }
        onMain {
            Scyther.developerOptions = rows.map { DeveloperOption(name: $0.name, value: $0.value) }
        }
    }

    /// Each element is `{ name, url }`, shown in the Deep Link Tester.
    @objc(setDeepLinkPresets:)
    public static func setDeepLinkPresets(_ presets: [[String: Any]]) {
        let links: [NameValue] = presets.compactMap { preset in
            guard let name = preset["name"] as? String, let url = preset["url"] as? String else {
                return nil
            }
            return NameValue(name: name, value: url)
        }
        onMain {
            Scyther.deepLinks.presets = links.map { DeepLinkPreset(name: $0.name, url: $0.value) }
        }
    }

    /// Sets the APNs token shown in the Notifications section.
    @objc(setApnsToken:)
    public static func setApnsToken(_ token: String?) {
        onMain { Scyther.apnsToken = token }
    }

    /// Sets the FCM token shown in the Notifications section.
    @objc(setFcmToken:)
    public static func setFcmToken(_ token: String?) {
        onMain { Scyther.fcmToken = token }
    }

    /// Adds a JSON-compatible payload to the Notification Logger. It crosses to
    /// the main actor as JSON data, since a dictionary of `Any` isn't `Sendable`.
    @objc(logNotification:)
    public static func logNotification(_ payload: [String: Any]) {
        guard JSONSerialization.isValidJSONObject(payload),
              let data = try? JSONSerialization.data(withJSONObject: payload)
        else { return }
        onMain {
            guard let userInfo = (try? JSONSerialization.jsonObject(with: data)) as? [AnyHashable: Any] else {
                return
            }
            Scyther.notifications.logNotification(userInfo)
        }
    }

    // MARK: - Crashes

    /// Scyther compiles its test crash into DEBUG builds only, so in any other
    /// configuration this does nothing.
    @objc(triggerTestCrash)
    public static func triggerTestCrash() {
        #if DEBUG
        onMain { Scyther.crashes.triggerTestCrash() }
        #endif
    }

    // MARK: - Location

    /// Calls back with whether spoofing is on, whether Scyther's
    /// `CLLocationManager` hooks are installed, and the spoofed location.
    @objc(getLocationSpoofingState:)
    public static func getLocationSpoofingState(
        _ completion: @escaping @Sendable (Bool, Bool, String, Double, Double) -> Void
    ) {
        onMain {
            let location = Scyther.location.spoofedLocation
            completion(
                Scyther.location.spoofingEnabled,
                CLLocationManager.isLocationSwizzled,
                location.name,
                location.latitude,
                location.longitude
            )
        }
    }

    // MARK: - Scheduling

    private static func onMain(_ work: @escaping @MainActor @Sendable () -> Void) {
        DispatchQueue.main.async { MainActor.assumeIsolated { work() } }
    }

    /// The tail of the chain of work against the `Servers` actor. Each call
    /// awaits the previous one, so `configure` then `select` never race.
    @MainActor private static var serverWork: Task<Void, Never>?

    private static func enqueueServerWork(_ work: @escaping @Sendable () async -> Void) {
        onMain {
            let previous = serverWork
            serverWork = Task {
                await previous?.value
                await work()
            }
        }
    }
}

private struct NameValue: Sendable {
    let name: String
    let value: String
}
