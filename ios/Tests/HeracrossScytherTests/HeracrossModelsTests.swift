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

final class ServerSelectionTests: XCTestCase {
    func testTheSavedIdWinsWhenItIsRegistered() {
        XCTAssertEqual(ServerSelection.resolvedId(currentId: "Staging", registeredIds: ["Dev", "Staging"]), "Staging")
    }

    func testAnUnregisteredOrMissingSavedIdFallsBackToTheFirst() {
        XCTAssertEqual(ServerSelection.resolvedId(currentId: "Gone", registeredIds: ["Dev", "Staging"]), "Dev")
        XCTAssertEqual(ServerSelection.resolvedId(currentId: "", registeredIds: ["Dev"]), "Dev")
        XCTAssertEqual(ServerSelection.resolvedId(currentId: nil, registeredIds: ["Dev"]), "Dev")
        XCTAssertNil(ServerSelection.resolvedId(currentId: "Dev", registeredIds: []))
    }

    func testConfigureKeepsASavedIdThatIsConfigured() {
        XCTAssertNil(ServerSelection.fallbackId(currentId: "Staging", configuredIds: ["Dev", "Staging"]))
    }

    func testConfigureSelectsTheFirstWhenTheSavedIdIsNotConfigured() {
        XCTAssertEqual(ServerSelection.fallbackId(currentId: "Legacy", configuredIds: ["Dev", "Staging"]), "Dev")
        XCTAssertEqual(ServerSelection.fallbackId(currentId: "", configuredIds: ["Dev"]), "Dev")
        XCTAssertEqual(ServerSelection.fallbackId(currentId: nil, configuredIds: ["Dev"]), "Dev")
    }

    func testConfiguringNothingSelectsNothing() {
        XCTAssertNil(ServerSelection.fallbackId(currentId: "Dev", configuredIds: []))
    }
}

final class MenuContentTests: XCTestCase {
    func testEnvironmentVariablesKeepOnlyStrings() {
        XCTAssertEqual(
            MenuContent.environmentVariables(["API": "https://api", "RETRIES": 3, "NESTED": ["a": "b"]]),
            ["API": "https://api"]
        )
    }

    func testDeveloperOptionsNeedANameAndDefaultTheValue() {
        XCTAssertEqual(
            MenuContent.developerOptions([
                ["name": "Build", "value": "42"],
                ["name": "Empty"],
                ["value": "orphan"],
                ["name": 7, "value": "number name"],
            ]),
            [NameValue(name: "Build", value: "42"), NameValue(name: "Empty", value: "")]
        )
    }

    func testDeepLinkPresetsNeedANameAndAUrl() {
        XCTAssertEqual(
            MenuContent.deepLinkPresets([
                ["name": "Home", "url": "myapp://home"],
                ["name": "No URL"],
                ["url": "myapp://nameless"],
            ]),
            [NameValue(name: "Home", value: "myapp://home")]
        )
    }

    func testOnlyShakeIsTheShakeGesture() {
        XCTAssertTrue(MenuContent.isShakeGesture("shake"))
        XCTAssertFalse(MenuContent.isShakeGesture("floatingButton"))
        XCTAssertFalse(MenuContent.isShakeGesture("none"))
        XCTAssertFalse(MenuContent.isShakeGesture("Shake"))
    }
}

final class OverrideStateTests: XCTestCase {
    func testEncodesTheThreeStates() {
        XCTAssertEqual(OverrideState.encode(nil), OverrideState.none)
        XCTAssertEqual(OverrideState.encode(false), 0)
        XCTAssertEqual(OverrideState.encode(true), 1)
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

    func testAChangeRightAfterRegisteringIsReported() {
        var tracker = FlagChangeTracker()
        tracker.recordIfUnseen("a", enabled: false)
        XCTAssertEqual(tracker.update(["a": true]), [FlagChange(key: "a", enabled: true)])
    }

    func testRecordingDoesNotOverwriteASeenValue() {
        var tracker = FlagChangeTracker()
        _ = tracker.update(["a": true])
        tracker.recordIfUnseen("a", enabled: false)
        XCTAssertEqual(tracker.update(["a": true]), [])
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

    func testASelectRightAfterTheFirstReadIsReported() {
        var tracker = SelectionTracker()
        tracker.recordIfUnseen("Development")
        XCTAssertEqual(tracker.update("Staging"), "Staging")
    }

    func testRecordingDoesNotOverwriteASeenSelection() {
        var tracker = SelectionTracker()
        _ = tracker.update("Development")
        tracker.recordIfUnseen("Staging")
        XCTAssertNil(tracker.update("Development"))
    }
}
