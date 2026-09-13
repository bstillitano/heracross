<a href="https://github.com/bstillitano/Scyther"><img src=".github/scyther-banner.svg" alt="Building a native iOS app? Get Scyther" width="100%" /></a>
<a href="https://github.com/bstillitano/scizor"><img src=".github/scizor-banner.svg" alt="Building a native Android app? Get Scizor" width="100%" /></a>

<p align="center">
  <img width="200" src="Heracross.png" alt="Heracross">
</p>

# Heracross

[![CI](https://github.com/bstillitano/heracross/actions/workflows/ci.yml/badge.svg)](https://github.com/bstillitano/heracross/actions/workflows/ci.yml)
![platform-badge](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue)
![react-native-badge](https://img.shields.io/badge/react--native-0.87-61DAFB)
![architecture-badge](https://img.shields.io/badge/architecture-New%20Architecture-purple)
![license-badge](https://img.shields.io/badge/license-MIT-green)

A React Native debugging toolkit that helps you cut through bugs in your React Native app. Heracross gives developers, QA testers, UI/UX teams and backend engineers an in-app debug menu on both platforms. Made with love in Sydney, Australia.

Heracross doesn't reimplement a debugging toolkit. It brings two native ones to React Native and puts one JavaScript API over them:

| Platform | Toolkit | Distribution |
|---|---|---|
| iOS | [Scyther](https://github.com/bstillitano/Scyther) | Swift Package Manager |
| Android | [Scizor](https://github.com/bstillitano/scizor) | JitPack |

Your app gets each platform's native menu, including network logs, data browsers, location spoofing and interface tools, and you configure the parts both share (feature flags, server environments, environment variables and more) once, from JavaScript.

## Table of Contents

- [Features](#features)
  - [Device & Application](#device--application)
  - [Networking](#networking)
  - [Data](#data)
  - [Security](#security)
  - [System Tools](#system-tools)
  - [Notifications](#notifications)
  - [UI/UX Tools](#uiux-tools)
  - [Development Tools](#development-tools)
- [Requirements](#requirements)
- [Installation](#installation)
  - [Android](#android)
  - [iOS](#ios)
- [Quick Start](#quick-start)
- [Usage Guide](#usage-guide)
  - [Feature Flags](#feature-flags)
  - [Server Configuration](#server-configuration)
  - [Environment Variables](#environment-variables)
  - [Custom Developer Options](#custom-developer-options)
  - [Push Tokens](#push-tokens)
  - [Network Logging](#network-logging)
  - [Crash Logging](#crash-logging)
  - [Location Spoofing](#location-spoofing)
  - [Going Native](#going-native)
- [Menu Invocation](#menu-invocation)
- [Production Safety](#production-safety)
- [Example App](#example-app)
- [How It Works](#how-it-works)
- [API Reference](#api-reference)
- [FAQ](#faq)
- [Contributing](#contributing)
- [Reporting a Vulnerability](#reporting-a-vulnerability)
- [License](#license)
- [Credits](#credits)

## Features

Everything below lives in the native debug menu. Features marked **JS** are also configured or driven from JavaScript through Heracross. A dash means that platform's toolkit doesn't have the feature. Menu paths use each toolkit's own section and row names.

### Device & Application

| Feature | iOS (Scyther) | Android (Scizor) |
|---|---|---|
| Device info | OS version, hardware, release year, UUID | OS version, API level, manufacturer, model, hardware, device ID |
| App info | Display name, bundle ID, version, build number, app ID prefix | Name, package, version, build number, last install or update time |
| Process ID | ✓ | ✓ |
| Build type | Debug, TestFlight or App Store | Debug or Release (flagged on an emulator) |
| Build date | ✓ | — |

### Networking

| Feature | What it does | iOS | Android |
|---|---|:---:|:---:|
| Network logging | Logs every HTTP request React Native sends, including `fetch` and `XMLHttpRequest` | ✓ | ✓ |
| Request details | Headers, body, status and timing, with JSON pretty-printed and GraphQL operation names and types decoded | ✓ | ✓ |
| cURL export | Copy a captured request as a `curl` command | ✓ | ✓ |
| Log export | Share captured traffic as a HAR 1.2 file, with best-effort redaction | ✓ | — |
| Traffic stats | Failure rate, median and 95th percentile duration, slowest endpoints and a request waterfall | ✓ | — |
| Request overrides | Mock responses, serve local files, rewrite headers, and add latency or failures | ✓ | — |
| Request replay | Edit a captured request and send it again | ✓ | — |
| Breakpoints | Hold a request or response, edit it, then continue or abort it | ✓ | — |
| Network conditioning | Latency, a bandwidth ceiling and a failure rate for all intercepted traffic | ✓ | — |
| Server configuration **JS** | Switch between environments, each with its own variables | ✓ | ✓ |
| Environment variables **JS** | Show key/value pairs on their own screen | ✓ | ✓ |
| IP address | The device's public IP | ✓ | ✓ |

### Data

| Feature | iOS (Scyther) | Android (Scizor) |
|---|---|---|
| Feature flags **JS** | Override registered flags at runtime | Force registered flags On, Off or Remote at runtime |
| Preferences browser | View and edit `UserDefaults` | View and edit `SharedPreferences` |
| Cookie browser | Inspect and delete cookies in `HTTPCookieStorage` | Cookies seen in captured traffic, logged by the app or captured from a WebView; hide one, or clear all |
| File browser | Browse Documents, Library, Caches and tmp | Browse the app's private and app-specific external storage; preview, share, open or delete files |
| Database browser | Browse and edit SQLite databases (including Core Data and SwiftData stores) in Application Support, Documents and Library, with a SQL editor | Browse and edit SQLite databases (including Room's) in the app's databases directory, with a raw SQL editor |

### Security

| Feature | iOS (Scyther) | Android (Scizor) |
|---|---|---|
| Keychain / Keystore | View and delete keychain items | List AndroidKeyStore entries with certificate details, and delete them |

### System Tools

| Feature | iOS (Scyther) | Android (Scizor) |
|---|---|---|
| Location spoofing | Preset cities, custom coordinates and routes. **JS** can read its state | Preset cities, custom coordinates and routes, once the app declares `ACCESS_MOCK_LOCATION` and is the device's mock location app |
| Deep link tester | Presets, history and a QR scanner | Presets and history; a QR scanner when the app adds Google's code scanner library |
| Crash logs **JS** | Uncaught Objective-C exceptions, listed after relaunch | Uncaught exceptions on any thread, listed on later launches |
| Console logs | The app's stdout and stderr | The app's own Logcat output |

### Notifications

| Feature | iOS (Scyther) | Android (Scizor) |
|---|---|---|
| Notification tester | Schedule local test notifications | Post or schedule local test notifications (needs notification permission on Android 13+) |
| Notification logger | Payloads your native code passes to `Scyther.notifications.logNotification(_:)` | Notifications posted on the device, once notification access is granted |
| Tokens **JS** | APNs and FCM tokens | FCM token |

### UI/UX Tools

| Feature | iOS | Android |
|---|:---:|:---:|
| Grid overlay, FPS counter and touch visualiser | ✓ | ✓, once "Display over other apps" is granted |
| Show view frames and view sizes | ✓ | ✓, once "Display over other apps" is granted |
| Slow animations | ✓ | ✓ |
| Fonts | ✓ | ✓ |
| Interface previews (registered natively) | ✓ | ✓ |
| Appearance: light or dark mode | ✓ | ✓ on Android 12+ |
| Appearance: text size | ✓ | Font scale, once your Activity wraps its context with `Scizor.wrapAppearance()` |
| Appearance: contrast | Increase Contrast | High contrast in Scizor's own menu only |
| Accessibility audit: missing labels, touch targets and contrast, including in React Native views | ✓ | — |
| Layout guides and layout ruler | ✓ | — |
| View hierarchy | ✓ | — |
| Language and pseudo-localisation | ✓ | — |

### Development Tools

| Feature | What it does | iOS | Android |
|---|---|:---:|:---:|
| Custom developer options **JS** | Your own value rows in the menu's Development Tools section | ✓ | ✓ |

For the full detail on any feature, see [Scyther's README](https://github.com/bstillitano/Scyther#features) or [Scizor's README](https://github.com/bstillitano/scizor#features).

## Requirements

| | Requirement |
|---|---|
| React Native | 0.87 (tested with 0.87.1). The New Architecture is the only one it supports. |
| iOS | 16.0 or later, built with React Native's Swift Package Manager integration. CocoaPods isn't supported. |
| Xcode | 16.1 or later, React Native 0.87's minimum. Tested with Xcode 26.2. |
| Android | `minSdk` 24. Builds with React Native 0.87's defaults: `compileSdk` 37, AGP 9.2.1, Kotlin 2.2.0 and JDK 17 or later. |

Scizor depends on Material 3 `1.5.0-alpha`, which ends up in your app. Read [Scizor's requirements](https://github.com/bstillitano/scizor#requirements) before adopting.

## Installation

Heracross isn't published to npm yet.

### Android

Nothing else to do. Scizor is resolved from JitPack, which the React Native Gradle plugin adds to every project by default. If you have turned that off with `includeJitpackRepository=false` or `react.includeJitpackRepository=false`, add `maven { url "https://jitpack.io" }` to your repositories.

### iOS

Heracross ships Swift Package Manager support only, so your app has to use React Native's SPM integration:

```sh
npx react-native spm
```

On a project that isn't set up for SPM yet, this runs `add`. It converts a CocoaPods app automatically only when that app is unmodified from the template, with its Xcode project and Podfile committed; otherwise run `npx react-native spm add --deintegrate`. Once the project is set up, run `npx react-native spm update` whenever you add or remove a native dependency.

Then:

1. **Tell the React Native CLI that Heracross has iOS code.** The CLI only recognises iOS code in packages that ship a podspec, and React Native's SPM autolinker skips any package without iOS code. In your app's `react-native.config.js`:

   ```js
   module.exports = {
     dependencies: {
       heracross: {
         platforms: {
           ios: {},
         },
       },
     },
   };
   ```

2. **Raise your deployment target to iOS 16**, the minimum Scyther supports.

3. **Patch React Native's SPM autolinker.** React Native 0.87 writes the package that links every library with a hardcoded minimum of iOS 15, and SwiftPM won't let it depend on a package that needs iOS 16:

   ```
   error: The package product 'Heracross' requires minimum platform version 16.0 for the iOS platform,
   but this target supports 15.0 (in target 'AutolinkedAggregate' from project 'Autolinked')
   ```

   The fix is one line in `node_modules/react-native/scripts/spm/generate-spm-autolinking.js`: the `Autolinked` package's `platforms: [.iOS(.v15)]` becomes `platforms: [.iOS(.v16)]`. Heracross ships it as a patch for React Native 0.87.1:

   - **patch-package:** copy `node_modules/heracross/patches/react-native+0.87.1.patch` into your app's `patches/` directory and run `npx patch-package`.
   - **Yarn 2+:** run `yarn patch react-native`, make the same one-line change in the directory it prints, then run `yarn patch-commit -s <that directory>`.

   Then run `npx react-native spm update`. Remove the patch once React Native stops hardcoding the version.

SwiftPM fetches Scyther from GitHub when Xcode resolves packages.

## Quick Start

Start the toolkit once, at the top of your entry file, before your app makes any network request:

```ts
import { AppRegistry } from 'react-native';
import Heracross from 'heracross';
import App from './App';

Heracross.start();

AppRegistry.registerComponent('MyApp', () => App);
```

Then open the menu from code:

```ts
Heracross.showMenu();
```

Shaking the device opens it too. In an iOS debug build a shake also opens React Native's Dev Menu, so you may prefer `Heracross.setInvocationGesture('none')` and a button of your own.

## Usage Guide

### Feature Flags

Register flags with their default values. Testers can override any of them from the menu without a rebuild.

```ts
Heracross.featureFlags.register([
  { key: 'new_checkout', title: 'New checkout', defaultValue: false },
  { key: 'dark_mode_v2', title: 'Dark mode v2', defaultValue: true },
]);

if (await Heracross.featureFlags.isEnabled('new_checkout')) {
  // ...
}
```

Overrides only take effect once they're switched on in the menu's Feature Flags screen. Until then, and for any flag without an override, `isEnabled` resolves to `defaultValue`. It resolves `false` for a key that was never registered. Android lists each flag by `title`; iOS lists it by key.

### Server Configuration

```ts
Heracross.servers.configure([
  { id: 'Staging', baseUrl: 'https://staging.example.com' },
  {
    id: 'Production',
    baseUrl: 'https://api.example.com',
    variables: { REGION: 'au' },
  },
]);
Heracross.servers.select('Staging');

const server = await Heracross.servers.getSelected();
// { id: 'Staging', baseUrl: 'https://staging.example.com', variables: {...} }
```

Scyther has no base URL field, so on iOS `baseUrl` is stored as a `baseUrl` variable. On iOS, `configure` adds or replaces servers by id; on Android it replaces the whole list.

### Environment Variables

Show key/value pairs on the menu's Environment Variables screen, under Networking:

```ts
Heracross.setEnvironmentVariables({
  API_BASE_URL: 'https://api.example.com',
  APP_ENVIRONMENT: 'development',
});
```

### Custom Developer Options

Add read-only value rows to the menu's Development Tools section. The section only appears once you've added a row.

```ts
Heracross.setDeveloperOptions([
  { name: 'Build', value: '1234' },
  { name: 'Commit', value: 'a1b2c3d' },
]);
```

### Push Tokens

Tokens show in the menu's Notifications section:

```ts
Heracross.setFcmToken(fcmToken);
Heracross.setApnsToken(apnsToken); // iOS only
```

### Network Logging

Pass nothing and React Native's requests are logged from the moment `start()` runs.

- **iOS:** Scyther adds its URL protocol to every `URLSessionConfiguration` created after it starts. React Native creates its session when it sends its first request, so that request and every one after it are logged, as long as `Heracross.start()` runs first.
- **Android:** Heracross registers Scizor's interceptor through `NetworkingModule.setCustomClientBuilder`, which React Native applies to every request it sends, so requests sent after `start()` are logged. That hook is a single slot: if your app registers its own builder there, whichever is registered last wins. Pass `captureNetwork: false` to leave it alone.

### Crash Logging

Crashes appear in the menu under System Tools → Crash Logs after the app is relaunched. To check it end to end:

```ts
Heracross.crashes.triggerTestCrash();
```

- **iOS:** Scyther records uncaught Objective-C exceptions, not Swift runtime errors or signals. The test crash raises one, and Scyther only compiles it into Debug builds, so in other configurations the call does nothing.
- **Android:** Scizor records uncaught exceptions from any thread. Scizor has no test crash of its own, so Heracross throws on the main thread.

### Location Spoofing

Spoof the device's location from the menu, under System Tools → Location Spoofer. On iOS you can read the spoofer's state from JavaScript:

```ts
const state = await Heracross.location.getSpoofingState();
// { enabled, swizzled, locationName, latitude, longitude }
```

It resolves `null` on Android, where Scizor keeps its spoofer internal.

On Android, Scizor can only spoof once your app declares `ACCESS_MOCK_LOCATION` and is selected under Developer options → Select mock location app. Declare the permission in your debug manifest, as the example app does in `example/android/app/src/debug/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission
        android:name="android.permission.ACCESS_MOCK_LOCATION"
        tools:ignore="MockLocation,ProtectedPermissions" />

</manifest>
```

### Going Native

Heracross covers what both toolkits share. Everything else, such as custom screens, interface previews, deep link presets or database adapters, is configured natively. On Android, add Scizor as a dependency of your app module to call it directly; the [example app](#example-app) does this to log cookies.

## Menu Invocation

```ts
Heracross.setInvocationGesture('shake');          // default
Heracross.setInvocationGesture('floatingButton'); // Android only; iOS uses 'none'
Heracross.setInvocationGesture('none');           // open it with Heracross.showMenu()
```

On Android the floating button is attached when an Activity resumes. When `start()` runs from JavaScript, your Activity has usually resumed already, so the button appears the next time the app comes back to the foreground. Close the menu from code with `Heracross.hideMenu()`.

## Production Safety

Both toolkits refuse to start in a store build unless you opt in:

- **iOS:** Scyther treats a build as App Store when it isn't a Debug build, isn't running on the simulator and has no sandbox receipt. `start()` then does nothing, silently. Ad hoc and enterprise builds meet that test too.
- **Android:** Scizor refuses to start when the app isn't debuggable, and logs a warning. Heracross then leaves React Native's networking untouched.

To run the menu in a signed QA build on purpose:

```ts
Heracross.start({ allowProductionBuilds: true });
```

**Warning:** anyone holding that build can see network traffic, preferences, cookies and keychain or keystore contents.

## Example App

`example/` is a React Native port of Scyther's example app, with the same Home and Location tabs and the same sections:

- **Home:** open the menu, REST and GraphQL requests, a UserDefaults (iOS) or SharedPreferences (Android) demo, sample feature flags, the deliberately broken accessibility controls for Scyther's audit, a SQLite database demo and a test crash.
- **Location:** Scyther's spoofer state, the location the platform reports, a map of it and continuous updates.
- **At launch:** it sets the same environment variables, servers and feature flags as Scyther's example, and seeds cookies, keychain items (iOS), preferences (Android) and database records.

The native half is the example's own Turbo Module, `HeracrossExampleDemo`. On iOS it's an app-local SPM module declared in `example/ios/react-native.config.js`; on Android it's a package registered in `MainApplication`. Where Scyther's example has no Android equivalent, the Android side follows Scizor's sample app.

It differs from Scyther's example where React Native can't do the same thing without third-party native libraries:

- The map is drawn from OpenStreetMap tiles instead of MapKit.
- Records are stored in SQLite instead of SwiftData.
- The copy is English only.
- The accessibility audit section is iOS only, because Scizor has no audit.

See [CONTRIBUTING.md](CONTRIBUTING.md) to run it.

## How It Works

```
heracross (JavaScript API)
└── NativeHeracross (Turbo Module spec, codegen)
    ├── iOS      Heracross (Objective-C++) → HeracrossScyther (Swift) → Scyther (SwiftPM)
    └── Android  HeracrossModule (Kotlin) → Scizor (JitPack)
```

- **One spec, two implementations.** `src/NativeHeracross.ts` is the Turbo Module spec. Codegen turns it into an Objective-C++ protocol and a Java base class, so both platforms implement the same surface.
- **iOS is split across two targets.** SwiftPM can't compile Swift and Objective-C++ in one target, so the Turbo Module is Objective-C++ and every call into Scyther goes through a small Swift target. Scyther's API runs on the main actor, so each call is forwarded to the main queue in the order JavaScript made it.
- **Android forwards to Scizor** on the main thread, and hooks Scizor's interceptor into React Native's networking.
- **The JavaScript layer normalises input.** `src/index.tsx` fills in defaults and converts server variables, environment variables and developer option values to strings before they reach native code.

## API Reference

| Symbol | iOS (Scyther) | Android (Scizor) |
|---|---|---|
| `start({ allowProductionBuilds, captureNetwork })` | `Scyther.start(allowProductionBuilds:)` | `Scizor.start(app, allowProductionBuilds)`, plus the networking hook |
| `showMenu()` / `hideMenu()` | `showMenu()` / `hideMenu()` | `show()` / `dismiss()` |
| `setInvocationGesture(gesture)` | `.shake`, or `.custom` for anything else | `SHAKE` / `FLOATING_BUTTON` / `NONE` |
| `featureFlags.register(flags)` | `featureFlags.register(_:remoteValue:)`, listed by key | `featureFlags.register(FeatureFlag)`, listed by title |
| `featureFlags.isEnabled(key)` | `featureFlags.isEnabled(_:)` | `featureFlags.isEnabled(key)` |
| `servers.configure(servers)` | `servers.register(id:variables:)`, adds or replaces by id | `servers.configure(environments)`, replaces the list |
| `servers.select(id)` | `servers.select(_:)` | `servers.select(environment)` |
| `servers.getSelected()` | `servers.current` | `servers.selected` |
| `setEnvironmentVariables(map)` | `environmentVariables` | `environmentVariables` |
| `setDeveloperOptions(rows)` | `DeveloperOption(name:value:)` | `DeveloperOption.Value` |
| `setApnsToken(token)` | `apnsToken` | no-op |
| `setFcmToken(token)` | `fcmToken` | `fcmToken` |
| `crashes.triggerTestCrash()` | `crashes.triggerTestCrash()`, Debug builds only | throws on the main thread |
| `location.getSpoofingState()` | `location.spoofingEnabled`, `spoofedLocation`, `CLLocationManager.isLocationSwizzled` | resolves `null` |

## FAQ

### Why is Heracross free?

For the same reason Scyther and Scizor are: they exist to give back to the community.

### Why doesn't it support CocoaPods?

Scyther's supported installation is Swift Package Manager, and React Native 0.87 ships its own SPM integration, so Heracross is SPM only.

### Why do I need to patch React Native?

React Native 0.87's SPM autolinker hardcodes iOS 15 on the package that links every library, and Scyther needs iOS 16. The patch changes that one value. It stops being necessary once React Native derives the version from your app.

### Does it work with Expo?

No. Expo's iOS autolinking only discovers packages that ship a podspec, and an app-level `react-native.config.js` override doesn't change that. Heracross ships only a `Package.swift`.

### Will Heracross get my app rejected?

Heracross only starts Scyther and Scizor, and both refuse to start in store builds unless you pass `allowProductionBuilds`. See [Scyther's FAQ](https://github.com/bstillitano/Scyther#faq) for iOS, and [what Scizor adds to your manifest](https://github.com/bstillitano/scizor#what-scizor-adds-to-your-manifest) for Android.

### What's the origin of the name?

Named after the [Pokémon Heracross](https://pokemondb.net/pokedex/heracross), a Bug and Fighting type that uses its horn to fling foes, which sits alongside [Scyther](https://pokemondb.net/pokedex/scyther) and [Scizor](https://pokemondb.net/pokedex/scizor).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow, how to run the example app on both platforms, the available scripts, and how to send a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make the change, with tests and documentation
4. Run `yarn typecheck` and `yarn test`, and build the example app on both platforms
5. Open a Pull Request

### Reporting Issues

- Use GitHub Issues for bug reports
- Include the platform, OS version, React Native version and Heracross version
- Provide minimal reproduction steps

---

## Reporting a Vulnerability

If you discover a security vulnerability, please email b.stillitano95@gmail.com directly. Do not open a public issue.

---

## License

Heracross is released under the MIT license. See [LICENSE](LICENSE) for details.

---

## Credits

Heracross is maintained by [Brandon Stillitano](https://github.com/bstillitano).

- iOS toolkit: [Scyther](https://github.com/bstillitano/Scyther) ([scyther.io](https://scyther.io))
- Android toolkit: [Scizor](https://github.com/bstillitano/scizor)
