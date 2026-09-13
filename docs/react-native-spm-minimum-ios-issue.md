# Upstream React Native issue

Filed as [react/react-native#58515](https://github.com/react/react-native/issues/58515). The filed version quotes the patch inline and adds the template's environment and reproducer sections; the text below is the draft it came from.

---

## SPM autolinking: the generated `Autolinked` package hardcodes iOS 15, so libraries that need iOS 16+ cannot be autolinked

### Description

`scripts/spm/generate-spm-autolinking.js` writes the top-level `Autolinked` package with a literal minimum platform:

```swift
let package = Package(
    name: "Autolinked",
    platforms: [.iOS(.v15)],
```

Its `AutolinkedAggregate` target depends on the product of every autolinked library. SwiftPM will not let a target depend on a product whose package declares a higher minimum platform. So any self-managed library whose `Package.swift` declares `.iOS(.v16)` or later fails package resolution. That happens even when the app's own deployment target is 16 or higher:

```
error: The package product 'Heracross' requires minimum platform version 16.0 for the iOS platform,
but this target supports 15.0 (in target 'AutolinkedAggregate' from project 'Autolinked')
```

The library cannot work around this by declaring iOS 15 itself when its own dependencies require iOS 16. SwiftPM applies the same check on that edge.

The same literal appears in two more places: the per-dependency packages the autolinker synthesizes for podspec-based libraries (`generate-spm-autolinking.js`, the second `platforms: [.iOS(.v15)]`) and the manifests `npx react-native spm scaffold` writes (`scaffold-package-swift.js`). A fix should cover all three.

### Steps to reproduce

1. Create a React Native 0.87.1 app and migrate it to SPM with `npx react-native spm`.
2. Add a native module that ships its own `Package.swift` with `platforms: [.iOS(.v16)]`.
3. Raise the app's `IPHONEOS_DEPLOYMENT_TARGET` to 16.0.
4. Run `npx react-native spm update` and build.

### Expected

The package resolves: the app targets iOS 16, and so does the library.

### Actual

Resolution fails with the error above.

### Suggested fix

Derive the aggregate's minimum from something other than a literal, for example (in order of preference):

1. The highest `.iOS(...)` declared by an autolinked self-managed package. SwiftPM needs the aggregate to be at least that, and the app target must already be at least that to link the library.
2. The app target's `IPHONEOS_DEPLOYMENT_TARGET`, read from the `.xcodeproj` the injector already edits.
3. An explicit `spm.minimumIosVersion` in the app's `react-native.config.js`.

### Workaround

Patch the one line to `.iOS(.v16)`: see `patches/react-native+0.87.1.patch` in the Heracross repository.

### Versions

- react-native 0.87.1
- Xcode 26.2
