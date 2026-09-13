<a href="https://github.com/bstillitano/Scyther"><img src=".github/scyther-banner.svg" alt="Building a native iOS app? Get Scyther" width="100%" /></a>
<a href="https://github.com/bstillitano/scizor"><img src=".github/scizor-banner.svg" alt="Building a native Android app? Get Scizor" width="100%" /></a>

<p align="center">
  <img width="200" src="Heracross.png" alt="Heracross">
</p>

# Heracross

[![CI](https://github.com/bstillitano/heracross/actions/workflows/ci.yml/badge.svg)](https://github.com/bstillitano/heracross/actions/workflows/ci.yml)
![platform-badge](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue)
![react-native-badge](https://img.shields.io/badge/react--native-0.87%2B-61DAFB)
![architecture-badge](https://img.shields.io/badge/architecture-New%20Architecture-purple)
![license-badge](https://img.shields.io/badge/license-MIT-green)

A comprehensive React Native debugging toolkit that helps you cut through bugs in your React Native app. Heracross gives developers, QA testers, UI/UX teams and backend engineers an in-app debug menu, one shake away, on both platforms. Made with love in Sydney, Australia.

Heracross doesn't reimplement a debugging toolkit. It brings two proven native ones to React Native and puts one JavaScript API over them:

| Platform | Toolkit | Distribution |
|---|---|---|
| iOS | [Scyther](https://github.com/bstillitano/Scyther) | Swift Package Manager |
| Android | [Scizor](https://github.com/bstillitano/scizor) | JitPack |

Your app gets each platform's full native menu, including network logs, data browsers, location spoofing and interface tools, while you configure the parts you share (feature flags, server environments, environment variables and more) once, from JavaScript.

## Table of Contents

- [Features](#features)
  - [Device & Application](#device--application)
  - [Networking](#networking)
  - [Data](#data)
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
- [Security](#security)
- [License](#license)
- [Credits](#credits)

## Features

Everything below lives in the native debug menu, and most of it needs no setup at all. Features marked **JS** are also configured or driven from JavaScript through Heracross. A dash means the platform's toolkit doesn't have that feature.

### Device & Application

| Feature | What it does | iOS | Android |
|---|---|:---:|:---:|
| Device info | Model, OS version and hardware details | ✓ | ✓ |
| App info | Bundle identifier or package, version and build number | ✓ | ✓ |
| Build details | Release type (Debug, TestFlight, App Store), build date and process ID | ✓ | — |

### Networking

| Feature | What it does | iOS | Android |
|---|---|:---:|:---:|
| Network logging | Captures every HTTP request and response your app makes, including React Native's own `fetch` | ✓ | ✓ |
| Request details | Headers, body, status and timing, with JSON pretty-printed and GraphQL operations decoded | ✓ | ✓ |
| cURL export | Copy any captured request as a runnable `curl` command | ✓ | ✓ |
| Log export | Share captured traffic as a HAR 1.2 file, with best-effort redaction | ✓ | — |
| Traffic stats | Failure rate, median and 95th percentile duration, slowest endpoints and a request waterfall | ✓ | — |
| Request overrides | Mock responses, serve local files, rewrite headers, and add latency or failures | ✓ | — |
| Request replay | Edit any captured request and send it again | ✓ | — |
| Breakpoints | Hold a request or response, edit it, then continue or fail it | ✓ | — |
| Network conditioning | Latency, a bandwidth ceiling and a failure rate for all traffic | ✓ | — |
| Server configuration **JS** | Switch between development, staging and production environments | ✓ | ✓ |
| IP address | The device's public IP | ✓ | ✓ |

### Data

| Feature | What it does | iOS | Android |
|---|---|:---:|:---:|
| Feature flags **JS** | Register flags in code and override them at runtime | ✓ | ✓ |
| Preferences browser | View and edit `UserDefaults` or `SharedPreferences` | ✓ | ✓ |
| Cookie browser | Inspect and delete HTTP cookies | ✓ | ✓ |
| Keychain / Keystore browser | Inspect keychain items or AndroidKeyStore entries | ✓ | ✓ |
| File browser | Browse and preview the app sandbox | ✓ | ✓ |
| Database browser | Browse and edit SQLite databases (plus Core Data and SwiftData on iOS, Room on Android) | ✓ | ✓ |

### System Tools

| Feature | What it does | iOS | Android |
|---|---|:---:|:---:|
| Location spoofing **JS** | Fake GPS with preset cities, custom coordinates or a moving route | ✓ | ✓ |
| Deep link tester | Fire URLs and schemes from presets, history or a QR scan | ✓ | ✓ |
| Crash logs **JS** | Captured crashes with their stack traces, shown on the next launch | ✓ | ✓ |
| Console logger | Live native console output (stdout and stderr, or Logcat) | ✓ | ✓ |

### Notifications

| Feature | What it does | iOS | Android |
|---|---|:---:|:---:|
| Notification tester | Schedule local test notifications | ✓ | ✓ |
| Notification logger | View received notification payloads | ✓ | ✓ |
| Token display **JS** | Show the APNs and FCM device tokens | ✓ | FCM only |

### UI/UX Tools

| Feature | What it does | iOS | Android |
|---|---|:---:|:---:|
| Grid overlay | An alignment grid over your UI | ✓ | ✓ |
| FPS counter | Real-time frame rate, colour-coded | ✓ | ✓ |
| Touch visualiser | Show touches for demos and recordings | ✓ | ✓ |
| Appearance overrides | Force light or dark mode, high contrast and text size | ✓ | ✓ |
| Font browser | Browse the available fonts | ✓ | ✓ |
| Accessibility audit | Flags missing labels, small touch targets and low-contrast text, including in React Native views | ✓ | — |
| Layout guides and ruler | Draw safe areas and margins, and measure between points | ✓ | — |
| View frames, sizes and hierarchy | Highlight view bounds and browse a snapshot of the view tree | ✓ | — |
| Slow animations | Slow every animation down | ✓ | — |
| Language and pseudo-localisation | Force the app's language, or stress-test layouts before translation | ✓ | — |

### Development Tools

| Feature | What it does | iOS | Android |
|---|---|:---:|:---:|
| Custom developer options **JS** | Add your own rows to the menu | ✓ | ✓ |
| Environment variables **JS** | Surface any key/value pairs you want visible | ✓ | ✓ |

For the full detail on any feature, see [Scyther's README](https://github.com/bstillitano/Scyther#features) or [Scizor's README](https://github.com/bstillitano/scizor#features).

## Requirements

| | Requirement |
|---|---|
| React Native | 0.87+, with the New Architecture |
| iOS | 16.0+, built with React Native's Swift Package Manager integration (CocoaPods is not supported) |
| Xcode | 16+ |
| Android | `minSdk` 24 at runtime; `compileSdk` 37, AGP 9.1+, Kotlin 2.2+ and JDK 17 to build, which are React Native 0.87's defaults |

Scizor pulls Material 3 `1.5.0-alpha` into your debug build. Read [Scizor's requirements](https://github.com/bstillitano/scizor#requirements) before adopting.

## Installation

```sh
npm install heracross
```

### Android

Nothing else to do. Scizor is resolved from JitPack, which the React Native Gradle plugin adds to every project. If you have turned that off with `includeJitpackRepository=false`, add `maven { url "https://jitpack.io" }` to your repositories.

### iOS

Heracross is Swift Package Manager only. Your app has to use React Native's SPM integration instead of CocoaPods:

```sh
npx react-native spm
```

On a freshly created CocoaPods app, this migrates the project for you (`add --deintegrate`). After that, rerun it whenever you add or remove a native dependency.

Three more steps:

1. **Tell the React Native CLI that Heracross has iOS code.** The CLI only recognises iOS native modules that ship a podspec, so without this override the SPM autolinker skips Heracross entirely. In your app's `react-native.config.js`:

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

3. **Patch React Native's SPM autolinker.** React Native 0.87 generates the package that links every library with a hardcoded minimum of iOS 15, and SwiftPM will not let it depend on a package that needs iOS 16:

   ```
   error: The package product 'Heracross' requires minimum platform version 16.0 for the iOS platform,
   but this target supports 15.0 (in target 'AutolinkedAggregate' from project 'Autolinked')
   ```

   The fix is one line in `node_modules/react-native/scripts/spm/generate-spm-autolinking.js`: the `Autolinked` package's `platforms: [.iOS(.v15)]` becomes `platforms: [.iOS(.v16)]`. Heracross ships it as a patch for React Native 0.87.1:

   - **patch-package:** copy `node_modules/heracross/patches/react-native+0.87.1.patch` into your app's `patches/` directory and run `npx patch-package`.
   - **Yarn 2+:** run `yarn patch react-native`, make the same one-line change in the directory it prints, then run `yarn patch-commit -s <that directory>`.

   Then run `npx react-native spm update`. Remove the patch once React Native stops hardcoding the version.

SwiftPM fetches Scyther itself from GitHub when Xcode resolves packages.

## Quick Start

Start the toolkit once, as early as possible: at the top of your entry file, before your app makes any network request.

```ts
import { AppRegistry } from 'react-native';
import Heracross from 'heracross';
import App from './App';

Heracross.start();

AppRegistry.registerComponent('MyApp', () => App);
```

Now **shake the device**, or press `Cmd + Ctrl + Z` in the iOS Simulator, to open the menu. You can also open it from code:

```ts
Heracross.showMenu();
```

## Usage Guide

### Feature Flags

Register flags with their default (remote) values. Testers can override any of them from the menu without a rebuild.

```ts
Heracross.featureFlags.register([
  { key: 'new_checkout', title: 'New checkout', defaultValue: false },
  { key: 'dark_mode_v2', title: 'Dark mode v2', defaultValue: true },
]);

if (await Heracross.featureFlags.isEnabled('new_checkout')) {
  // ...
}
```

`isEnabled` resolves to the local override set in the menu, or to `defaultValue` when there is none. Android shows `title` in the menu; iOS shows the key.

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

Scyther has no base URL field, so on iOS `baseUrl` is stored, and shown in the menu, as a `baseUrl` variable. On iOS, `configure` adds or replaces servers by id; on Android it replaces the whole list.

### Environment Variables

Surface any key/value pairs your team needs to see at a glance:

```ts
Heracross.setEnvironmentVariables({
  API_BASE_URL: 'https://api.example.com',
  APP_ENVIRONMENT: 'development',
});
```

### Custom Developer Options

Add read-only rows to the menu's Developer section:

```ts
Heracross.setDeveloperOptions([
  { name: 'Build', value: '1234' },
  { name: 'Commit', value: 'a1b2c3d' },
]);
```

### Push Tokens

```ts
Heracross.setFcmToken(fcmToken);
Heracross.setApnsToken(apnsToken); // iOS only
```

### Network Logging

- **iOS:** Scyther intercepts `URLSession` traffic by itself, so React Native's `fetch` shows up without any setup.
- **Android:** `start()` installs an `OkHttpClientProvider` factory that adds Scizor's interceptor to React Native's OkHttp client. That factory replaces any your app installed. If you install your own, pass `captureNetwork: false` and add `Scizor.network.interceptor()` to your builder yourself. React Native builds its client the first time the networking module is used, so traffic is only captured when `start()` runs before your first request.

### Crash Logging

Crashes are captured automatically and shown in the menu's Crash Logs on the next launch. To check the pipeline end to end:

```ts
Heracross.crashes.triggerTestCrash();
```

On iOS this calls Scyther's test crash. Scizor has no equivalent, so on Android Heracross throws on the main thread, which Scizor records.

### Location Spoofing

Spoof the device's location from the menu's Location Spoofer. On iOS you can read the spoofer's state from JavaScript:

```ts
const state = await Heracross.location.getSpoofingState();
// { enabled: true, swizzled: true, locationName: 'Sydney', latitude: -33.86, longitude: 151.21 }
```

It resolves `null` on Android, where Scizor keeps its spoofer internal. A spoofed location still reaches `LocationManager`; set your app as the device's mock-location app first.

### Going Native

Heracross covers what both toolkits share. For everything else, such as custom screens, interface previews, deep link presets or database adapters, configure the toolkit natively. On Android, add Scizor as a dependency of your app module and call it from your `Application`; the [example app](#example-app) does this to log cookies.

## Menu Invocation

```ts
Heracross.setInvocationGesture('shake');          // default
Heracross.setInvocationGesture('floatingButton'); // Android only; iOS uses 'none'
Heracross.setInvocationGesture('none');           // open it with Heracross.showMenu()
```

A floating button is the easiest trigger on an Android emulator, where shaking is awkward. Close the menu from code with `Heracross.hideMenu()`.

## Production Safety

Both toolkits refuse to start in a store build. Scyther checks for an App Store receipt, and Scizor checks that the build is debuggable. When they refuse, `start()` does nothing, and on Android React Native's networking is left untouched.

To ship the menu in a signed QA build on purpose:

```ts
Heracross.start({ allowProductionBuilds: true });
```

**Warning:** this can expose sensitive debugging information, such as network traffic, preferences and keychain contents, to anyone holding the build.

## Example App

`example/` is a React Native port of Scyther's own example app, with the same Home and Location tabs and the same sections:

- **Home:** open the menu, REST and GraphQL requests, a UserDefaults (iOS) or SharedPreferences (Android) demo, sample feature flags, the deliberately broken accessibility controls for Scyther's audit, a SQLite database demo and a test crash.
- **Location:** Scyther's spoofer state, the location the platform reports, a map of it and continuous updates.
- **At launch:** it seeds the same environment variables, servers, feature flags, cookies, keychain items (iOS), preferences (Android) and database records, so every browser in the menu has data.

The native half lives in the example's own Turbo Module, `HeracrossExampleDemo`. On iOS it's an app-local SPM module declared in `example/ios/react-native.config.js`, and on Android a package registered in `MainApplication`. Where ScytherExample has no Android equivalent, the Android side follows Scizor's sample app.

The port differs from ScytherExample where React Native can't do the same thing without third-party native libraries:

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

- **One spec, two implementations.** `src/NativeHeracross.ts` is the Turbo Module spec. Codegen turns it into an Objective-C++ protocol and a Java base class, so both platforms implement exactly the same surface.
- **iOS is split in two targets.** SwiftPM cannot compile Swift and Objective-C++ in one target, so the Turbo Module is Objective-C++ and every call into Scyther goes through a small Swift target. Scyther's facade is `@MainActor`, so each call is forwarded to the main queue in the order JavaScript made it.
- **Android forwards to Scizor** on the main thread, and hooks Scizor's interceptor into React Native's OkHttp client.
- **The JavaScript layer does the shaping.** `src/index.tsx` validates input and turns every value into a string before it crosses the bridge, so native code on both sides stays simple.

## API Reference

| Symbol | iOS (Scyther) | Android (Scizor) |
|---|---|---|
| `start({ allowProductionBuilds, captureNetwork })` | `Scyther.start(allowProductionBuilds:)` | `Scizor.start(app, allowProductionBuilds)` + OkHttp interceptor |
| `showMenu()` / `hideMenu()` | `showMenu()` / `hideMenu()` | `show()` / `dismiss()` |
| `setInvocationGesture(gesture)` | `.shake` / `.custom` | `SHAKE` / `FLOATING_BUTTON` / `NONE` |
| `featureFlags.register(flags)` | `register(_:remoteValue:)`, labelled by key | `register(FeatureFlag)` |
| `featureFlags.isEnabled(key)` | `isEnabled(_:)` | `isEnabled(key)` |
| `servers.configure(servers)` | `register(id:variables:)`, adds or replaces by id | `configure(environments)`, replaces the list |
| `servers.select(id)` | `select(_:)` | `select(environment)` |
| `servers.getSelected()` | `current` | `selected` |
| `setEnvironmentVariables(map)` | `environmentVariables` | `environmentVariables` |
| `setDeveloperOptions(rows)` | `DeveloperOption(name:value:)` | `DeveloperOption.Value` |
| `setApnsToken(token)` | `apnsToken` | no-op |
| `setFcmToken(token)` | `fcmToken` | `fcmToken` |
| `crashes.triggerTestCrash()` | `crashes.triggerTestCrash()` | throws on the main thread |
| `location.getSpoofingState()` | `location.spoofingEnabled`, `spoofedLocation` | resolves `null` (Scizor keeps its spoofer internal) |

## FAQ

### Why is Heracross free?

For the same reason Scyther and Scizor are: open source is what makes the world go round, and these tools exist to give back to the community.

### Why doesn't it support CocoaPods?

Scyther is distributed through Swift Package Manager, and React Native is moving to it too. Supporting both would mean maintaining a podspec for a dependency that doesn't ship one.

### Why do I need to patch React Native?

React Native 0.87's SPM autolinker hardcodes iOS 15 on the package that links every library, and Scyther needs iOS 16. The patch changes that one number. It stops being necessary once React Native derives the version from your app.

### Does it work with Expo?

Not yet. It hasn't been tested with Expo, and Expo's iOS autolinking expects a podspec, which Heracross doesn't ship.

### Will Heracross get my app rejected?

Heracross adds no debugging behaviour of its own; it starts Scyther and Scizor, and both refuse to run in store builds by default. See [Scyther's FAQ](https://github.com/bstillitano/Scyther#faq) for iOS, and [what Scizor adds to your manifest](https://github.com/bstillitano/scizor#what-scizor-adds-to-your-manifest) for Android.

### What's the origin of the name?

Named after the [Pokémon Heracross](https://pokemondb.net/pokedex/heracross), a Bug and Fighting type that stands alongside [Scyther](https://pokemondb.net/pokedex/scyther) and [Scizor](https://pokemondb.net/pokedex/scizor), with a horn made for flipping bugs out of your app.

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

## Security

If you discover a security vulnerability, please email b.stillitano95@gmail.com directly. Do not open a public issue.

---

## License

Heracross is released under the MIT license. See [LICENSE](LICENSE) for details.

---

## Credits

Heracross is maintained by [Brandon Stillitano](https://github.com/bstillitano).

- iOS toolkit: [Scyther](https://github.com/bstillitano/Scyther) ([scyther.io](https://scyther.io))
- Android toolkit: [Scizor](https://github.com/bstillitano/scizor)
