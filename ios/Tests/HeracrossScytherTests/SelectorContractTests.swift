import XCTest
@testable import HeracrossScyther

/// `Heracross.mm` declares `HeracrossScyther`'s selectors by hand. The compiler
/// trusts that declaration, so a selector that doesn't match the Swift `@objc`
/// name would build and only fail at runtime with "unrecognized selector".
/// This reads the declaration and checks every selector exists.
final class SelectorContractTests: XCTestCase {
    private func declaredSelectors() throws -> [String] {
        let source = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .appendingPathComponent("../../Sources/Heracross/Heracross.mm")
            .standardizedFileURL
        let text = try String(contentsOf: source, encoding: .utf8)
        guard let start = text.range(of: "@interface HeracrossScyther : NSObject"),
              let end = text.range(of: "@end", range: start.upperBound..<text.endIndex)
        else {
            XCTFail("No @interface HeracrossScyther block in \(source.path)")
            return []
        }
        return text[start.upperBound..<end.lowerBound]
            .split(separator: ";")
            .map(String.init)
            .filter { $0.contains("+") }
            .map(Self.selector(fromDeclaration:))
    }

    /// `+ (void)getFeatureFlagOverride:(NSString *)key completion:(void (^)(BOOL))completion`
    /// becomes `getFeatureFlagOverride:completion:`.
    static func selector(fromDeclaration declaration: String) -> String {
        var text = declaration
        // Drop parenthesised types, innermost first, since block types nest.
        while let range = text.range(of: #"\([^()]*\)"#, options: .regularExpression) {
            text.replaceSubrange(range, with: " ")
        }
        text = text.replacingOccurrences(of: "+", with: " ")
        let labels = text.matches(of: /([A-Za-z_][A-Za-z0-9_]*)\s*:/).map { "\($0.1):" }
        if labels.isEmpty {
            return text.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        return labels.joined()
    }

    func testTheParserReadsSelectors() {
        XCTAssertEqual(Self.selector(fromDeclaration: "\n+ (void)showMenu"), "showMenu")
        XCTAssertEqual(
            Self.selector(fromDeclaration: "+ (void)getFeatureFlagOverride:(NSString *)key completion:(void (^)(BOOL hasOverride, BOOL value))completion"),
            "getFeatureFlagOverride:completion:"
        )
    }

    func testEveryDeclaredSelectorExistsOnTheSwiftClass() throws {
        let selectors = try declaredSelectors()
        XCTAssertGreaterThan(selectors.count, 25, "Parsed too few selectors: \(selectors)")
        for selector in selectors {
            XCTAssertTrue(
                HeracrossScyther.responds(to: NSSelectorFromString(selector)),
                "Heracross.mm declares +\(selector), which HeracrossScyther doesn't implement"
            )
        }
    }
}
