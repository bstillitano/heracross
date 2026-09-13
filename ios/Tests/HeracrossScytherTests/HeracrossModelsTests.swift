import XCTest
@testable import HeracrossScyther

final class ServerEntryTests: XCTestCase {
    func testRequiresANonEmptyStringId() {
        XCTAssertNil(ServerEntry([:]))
        XCTAssertNil(ServerEntry(["id": ""]))
        XCTAssertNil(ServerEntry(["id": 7]))
    }

    func testStoresTheBaseUrlAsTheReservedVariable() {
        let entry = ServerEntry([
            "id": "Dev",
            "baseUrl": "https://dev",
            "variables": ["REGION": "au", "baseUrl": "https://ignored", "RETRIES": 3],
        ])
        XCTAssertEqual(entry?.id, "Dev")
        XCTAssertEqual(entry?.variables, ["REGION": "au", "baseUrl": "https://dev"])
    }

    func testAnEmptyBaseUrlDropsTheReservedVariable() {
        let entry = ServerEntry(["id": "Dev", "baseUrl": "", "variables": ["baseUrl": "https://stale"]])
        XCTAssertEqual(entry?.variables, [:])
    }

    func testSplitSeparatesTheBaseUrl() {
        let split = ServerEntry.split(["baseUrl": "https://dev", "REGION": "au"])
        XCTAssertEqual(split.baseUrl, "https://dev")
        XCTAssertEqual(split.variables, ["REGION": "au"])
        XCTAssertEqual(ServerEntry.split(["REGION": "au"]).baseUrl, "")
    }
}

final class FlagChangeTrackerTests: XCTestCase {
    func testTheFirstSnapshotReportsNothing() {
        var tracker = FlagChangeTracker()
        XCTAssertEqual(tracker.update(["a": true, "b": false]), [])
    }

    func testChangedFlagsAreReportedInKeyOrder() {
        var tracker = FlagChangeTracker()
        _ = tracker.update(["b": false, "a": true, "c": true])
        XCTAssertEqual(
            tracker.update(["b": true, "a": false, "c": true]),
            [FlagChange(key: "a", enabled: false), FlagChange(key: "b", enabled: true)]
        )
    }

    func testANewlyRegisteredFlagIsRecordedButNotReported() {
        var tracker = FlagChangeTracker()
        _ = tracker.update(["a": true])
        XCTAssertEqual(tracker.update(["a": true, "b": true]), [])
        XCTAssertEqual(tracker.update(["a": true, "b": false]), [FlagChange(key: "b", enabled: false)])
    }

    func testAnUnchangedSnapshotReportsNothing() {
        var tracker = FlagChangeTracker()
        _ = tracker.update(["a": true])
        _ = tracker.update(["a": false])
        XCTAssertEqual(tracker.update(["a": false]), [])
    }
}

final class SelectionTrackerTests: XCTestCase {
    func testTheFirstSelectionIsNotAChange() {
        var tracker = SelectionTracker()
        XCTAssertNil(tracker.update(nil))
        XCTAssertNil(tracker.update("Development"))
        XCTAssertNil(tracker.update("Development"))
    }

    func testADifferentSelectionIsReported() {
        var tracker = SelectionTracker()
        _ = tracker.update("Development")
        XCTAssertEqual(tracker.update("Staging"), "Staging")
        XCTAssertNil(tracker.update("Staging"))
    }

    func testNoSelectionKeepsTheLastOne() {
        var tracker = SelectionTracker()
        _ = tracker.update("Development")
        XCTAssertNil(tracker.update(nil))
        XCTAssertNil(tracker.update("Development"))
        XCTAssertEqual(tracker.update("Production"), "Production")
    }
}
