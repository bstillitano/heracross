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

    @objc(startAllowingProductionBuilds:)
    public static func start(allowProductionBuilds: Bool) {
        onMain { Scyther.start(allowProductionBuilds: allowProductionBuilds) }
    }

    @objc(showMenu)
    public static func showMenu() {
        onMain { Scyther.showMenu() }
    }

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

    @objc(registerFeatureFlag:defaultValue:)
    public static func registerFeatureFlag(_ key: String, defaultValue: Bool) {
        onMain { Scyther.featureFlags.register(key, remoteValue: defaultValue) }
    }

    @objc(isFeatureFlagEnabled:completion:)
    public static func isFeatureFlagEnabled(_ key: String, completion: @escaping @Sendable (Bool) -> Void) {
        onMain { completion(Scyther.featureFlags.isEnabled(key)) }
    }

    // MARK: - Servers

    /// Each element is `{ id, baseUrl, variables }`. A non-empty `baseUrl` is
    /// registered as a `baseUrl` variable, since Scyther has no field for it.
    @objc(configureServers:)
    public static func configureServers(_ servers: [[String: Any]]) {
        let entries = servers.compactMap(ServerEntry.init)
        enqueueServerWork {
            for entry in entries {
                await Scyther.servers.register(id: entry.id, variables: entry.variables)
            }
        }
    }

    @objc(selectServer:)
    public static func selectServer(_ id: String) {
        enqueueServerWork { await Scyther.servers.select(id) }
    }

    /// Calls back with the selected server's id and variables, or a `nil` id
    /// when nothing is selected.
    @objc(getSelectedServer:)
    public static func getSelectedServer(_ completion: @escaping @Sendable (String?, [String: String]) -> Void) {
        enqueueServerWork {
            if let current = await Scyther.servers.current {
                completion(current.id, current.variables)
            } else {
                completion(nil, [:])
            }
        }
    }

    // MARK: - Menu content

    @objc(setEnvironmentVariables:)
    public static func setEnvironmentVariables(_ variables: [String: String]) {
        onMain { Scyther.environmentVariables = variables }
    }

    /// Each element is `{ name, value }`, shown as a read-only value row.
    @objc(setDeveloperOptions:)
    public static func setDeveloperOptions(_ options: [[String: Any]]) {
        let rows: [DeveloperValue] = options.compactMap { option in
            guard let name = option["name"] as? String else { return nil }
            return DeveloperValue(name: name, value: option["value"] as? String ?? "")
        }
        onMain {
            Scyther.developerOptions = rows.map { DeveloperOption(name: $0.name, value: $0.value) }
        }
    }

    @objc(setApnsToken:)
    public static func setApnsToken(_ token: String?) {
        onMain { Scyther.apnsToken = token }
    }

    @objc(setFcmToken:)
    public static func setFcmToken(_ token: String?) {
        onMain { Scyther.fcmToken = token }
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

private struct ServerEntry: Sendable {
    let id: String
    let variables: [String: String]

    init?(_ dictionary: [String: Any]) {
        guard let id = dictionary["id"] as? String else { return nil }
        var variables = dictionary["variables"] as? [String: String] ?? [:]
        if let baseUrl = dictionary["baseUrl"] as? String, !baseUrl.isEmpty, variables["baseUrl"] == nil {
            variables["baseUrl"] = baseUrl
        }
        self.id = id
        self.variables = variables
    }
}

private struct DeveloperValue: Sendable {
    let name: String
    let value: String
}
