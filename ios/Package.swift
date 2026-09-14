// swift-tools-version: 6.0
//
// Heracross ships Swift Package Manager support only — there is no podspec.
//
// React Native's SPM autolinker (`npx react-native spm`) picks this manifest up
// as a self-managed package and references it through a symlink at
// `<app>/ios/build/generated/autolinking/libs/Heracross`. SwiftPM resolves the
// relative `.package(path:)` entries below against that symlink, which is why
// they reach into `build/` rather than into this repository. This manifest is
// therefore only resolvable from inside an app that has run the autolinker.
//
// The exception is `HERACROSS_TESTS=1` (`yarn test:ios`), which evaluates it on
// its own for the unit tests: without the React Native packages, and so without
// the Turbo Module target that needs them.

import PackageDescription

let testing = Context.environment["HERACROSS_TESTS"] == "1"

// Swift: the only code that touches Scyther. SwiftPM cannot compile Swift and
// Objective-C++ in one target, so it is split from the module.
let scytherTarget = Target.target(
    name: "HeracrossScyther",
    dependencies: [
        .product(name: "Scyther", package: "Scyther"),
    ],
    path: "Sources/HeracrossScyther"
)

// Objective-C++: the Turbo Module, conforming to the codegen'd spec.
let moduleTarget = Target.target(
    name: "Heracross",
    dependencies: [
        "HeracrossScyther",
        .product(name: "ReactHeaders", package: "ReactNative"),
        .product(name: "ReactNativeHeaders", package: "ReactNative"),
        .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
        .product(name: "ReactAppHeaders", package: "React-GeneratedCode"),
    ],
    path: "Sources/Heracross",
    // The sources contain no headers: the module is only reached through codegen.
    publicHeadersPath: ".",
    cxxSettings: [
        // Match the prebuilt React.framework's NDEBUG-gated C++ ABI.
        .define("DEBUG", .when(configuration: .debug)),
        .define("NDEBUG", .when(configuration: .release)),
    ],
    linkerSettings: [
        .linkedFramework("Foundation"),
        .linkedFramework("UIKit"),
    ]
)

let testTarget = Target.testTarget(
    name: "HeracrossScytherTests",
    dependencies: ["HeracrossScyther"],
    path: "Tests/HeracrossScytherTests"
)

let package = Package(
    name: "Heracross",
    platforms: [.iOS(.v16)],
    products: testing
        ? [.library(name: "HeracrossScyther", targets: ["HeracrossScyther"])]
        : [.library(name: "Heracross", targets: ["Heracross"])],
    dependencies: [
        // 4.8.x only: Heracross uses Scyther API whose isolation a minor release could change.
        // 4.8.1 or later, where a second `Scyther.start` call is ignored.
        .package(url: "https://github.com/bstillitano/Scyther.git", .upToNextMinor(from: "4.8.1")),
    ] + (testing ? [] : [
        .package(name: "ReactNative", path: "../../../../xcframeworks"),
        .package(name: "React-GeneratedCode", path: "../../../ios"),
    ]),
    targets: testing ? [scytherTarget, testTarget] : [scytherTarget, moduleTarget],
    cxxLanguageStandard: .cxx20
)
