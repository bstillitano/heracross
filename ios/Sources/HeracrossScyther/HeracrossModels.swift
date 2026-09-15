import Foundation

/// The variable Heracross stores a server's base URL under, since Scyther's
/// `ServerConfiguration` has no field for it.
let baseUrlVariable = "baseUrl"

/// A server as sent from JavaScript. A non-empty `baseUrl` is stored as the
/// `baseUrl` variable, replacing any variable of that name.
struct ServerEntry: Equatable, Sendable {
    let id: String
    let variables: [String: String]

    /// Reads `{ id, baseUrl, variables }`. Fails without a non-empty string id;
    /// variables that aren't strings are skipped.
    init?(_ dictionary: [String: Any]) {
        guard let id = dictionary["id"] as? String, !id.isEmpty else { return nil }
        var variables = (dictionary["variables"] as? [String: Any] ?? [:]).compactMapValues { $0 as? String }
        variables.removeValue(forKey: baseUrlVariable)
        if let baseUrl = dictionary["baseUrl"] as? String, !baseUrl.isEmpty {
            variables[baseUrlVariable] = baseUrl
        }
        self.id = id
        self.variables = variables
    }

    /// Splits variables stored in Scyther back into the base URL (`""` when
    /// there is none) and the remaining variables.
    static func split(_ variables: [String: String]) -> (baseUrl: String, variables: [String: String]) {
        var variables = variables
        let baseUrl = variables.removeValue(forKey: baseUrlVariable) ?? ""
        return (baseUrl, variables)
    }
}

/// Which server counts as selected. Scyther stores any id it is asked to
/// select and never removes a registered server, so its saved id can name a
/// server that isn't registered, or one that is no longer configured.
enum ServerSelection {
    /// The saved id when it names a registered server, otherwise the first
    /// registered server, as on Android. `nil` only when none is registered.
    static func resolvedId(currentId: String?, registeredIds: [String]) -> String? {
        if let currentId, registeredIds.contains(currentId) {
            return currentId
        }
        return registeredIds.first
    }

    /// The server to select after configuring `configuredIds`: the first of
    /// them when the saved id isn't one of them, otherwise `nil` to keep it.
    static func fallbackId(currentId: String?, configuredIds: [String]) -> String? {
        guard let first = configuredIds.first else { return nil }
        if let currentId, configuredIds.contains(currentId) {
            return nil
        }
        return first
    }
}

/// A name and value from JavaScript: a developer option row or a deep link.
struct NameValue: Equatable, Sendable {
    let name: String
    let value: String
}

/// Reads the menu content JavaScript sends. Anything that isn't a string is
/// skipped rather than shown.
enum MenuContent {
    static func environmentVariables(_ variables: [String: Any]) -> [String: String] {
        variables.compactMapValues { $0 as? String }
    }

    /// `{ name, value }` rows. Rows without a string name are skipped; a
    /// missing value is shown as empty.
    static func developerOptions(_ options: [[String: Any]]) -> [NameValue] {
        options.compactMap { option in
            guard let name = option["name"] as? String else { return nil }
            return NameValue(name: name, value: option["value"] as? String ?? "")
        }
    }

    /// `{ name, url }` presets. Presets without a string name and url are skipped.
    static func deepLinkPresets(_ presets: [[String: Any]]) -> [NameValue] {
        presets.compactMap { preset in
            guard let name = preset["name"] as? String, let url = preset["url"] as? String else {
                return nil
            }
            return NameValue(name: name, value: url)
        }
    }

    /// Scyther's only gestures are shake and custom, so everything but
    /// `"shake"` leaves opening the menu to the host.
    static func isShakeGesture(_ gesture: String) -> Bool {
        gesture == "shake"
    }
}

/// A stored flag override crossing to Objective-C, which has no optional
/// `BOOL`: `-1` for none, `0` for off and `1` for on.
enum OverrideState {
    static let none = -1

    static func encode(_ value: Bool?) -> Int {
        guard let value else { return none }
        return value ? 1 : 0
    }
}

/// A registered flag whose effective value changed.
struct FlagChange: Equatable, Sendable {
    let key: String
    let enabled: Bool
}

/// Works out which flags changed between successive snapshots of every
/// registered flag's effective value.
struct FlagChangeTracker: Sendable {
    private var last: [String: Bool] = [:]

    /// Records `current` and returns the flags in both it and the previous
    /// snapshot whose value differs, sorted by key. A flag that first appears
    /// in `current` is recorded without being reported.
    mutating func update(_ current: [String: Bool]) -> [FlagChange] {
        let changes = current
            .filter { key, value in last[key].map { $0 != value } ?? false }
            .map { FlagChange(key: $0.key, enabled: $0.value) }
            .sorted { $0.key < $1.key }
        last = current
        return changes
    }

    /// Records a flag's value when it hasn't been seen, so the next snapshot
    /// compares with it. A change made straight after registering a flag is
    /// then reported instead of becoming the flag's first value.
    mutating func recordIfUnseen(_ key: String, enabled: Bool) {
        if last[key] == nil {
            last[key] = enabled
        }
    }
}

/// Works out when the selected server changes between successive snapshots.
struct SelectionTracker: Sendable {
    private var last: String?

    /// Records `current` and returns it when it differs from the last non-`nil`
    /// selection. A first selection, or none at all, isn't a change.
    mutating func update(_ current: String?) -> String? {
        guard let current else { return nil }
        defer { last = current }
        guard let last, last != current else { return nil }
        return current
    }

    /// Records `current` when nothing has been recorded yet, so a `select`
    /// made straight after it is reported instead of becoming the first value.
    mutating func recordIfUnseen(_ current: String?) {
        if last == nil {
            last = current
        }
    }
}
