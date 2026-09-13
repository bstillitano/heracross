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
}
