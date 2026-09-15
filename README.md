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

Your app gets each platform's native menu, including network logs, data browsers, location spoofing and interface tools, and you configure what both share (feature flags, server environments, environment variables and more) once, from JavaScript.

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
  - [Reading State](#reading-state)
  - [Listening in React Components](#listening-in-react-components)
  - [Environment Variables](#environment-variables)
  - [Custom Developer Options](#custom-developer-options)
  - [Deep Link Presets](#deep-link-presets)
  - [Push Notifications](#push-notifications)
  - [Network Logging](#network-logging)
  - [Cookies](#cookies)
  - [Crash Logging](#crash-logging)
  - [Location Spoofing](#location-spoofing)
  - [Going Native](#going-native)
- [Permissions & Platform Setup](#permissions--platform-setup)
- [Menu Invocation](#menu-invocation)
- [Production Safety](#production-safety)
  - [Hiding tools](#hiding-tools)
  - [What ships in a release build](#what-ships-in-a-release-build)
  - [Debug-only builds](#debug-only-builds)
- [Where Settings Live](#where-settings-live)
- [Testing with Jest](#testing-with-jest)
- [Continuous Integration](#continuous-integration)
- [Example App](#example-app)
- [How It Works](#how-it-works)
- [API Reference](#api-reference)
  - [Types](#types)
- [Troubleshooting](#troubleshooting)
- [Versioning](#versioning)
- [Uninstalling](#uninstalling)
- [FAQ](#faq)
- [Contributing](#contributing)
- [Reporting a Vulnerability](#reporting-a-vulnerability)
- [License](#license)
- [Credits](#credits)

## Features

Everything below lives in the native debug menu. Features marked **JS** are also configured or driven from JavaScript through Heracross. A dash means that platform's toolkit doesn't have the feature. Feature names describe what each tool does and aren't always the toolkit's exact menu label; the menu paths in the [Usage Guide](#usage-guide) are exact.

### Device & Application

| Feature | iOS (Scyther) | Android (Scizor) |
|---|---|---|
| Device info | OS version, hardware, release year, UUID | OS version, API level, manufacturer, model, hardware, device ID |
| App info | Display name, bundle ID, version, build number, app ID prefix | Name, package, version, build number, last install or update time |
| Process ID | ✓ | ✓ |
| Build type | Debug, TestFlight or App Store | Debug or Release, noting an emulator |
| Build date | ✓ | — |

### Networking

| Feature | iOS (Scyther) | Android (Scizor) |
|---|---|---|
| Network logging **JS** | `URLSession` requests whose configuration is created after Scyther starts, including React Native's `fetch` | React Native's `fetch` and `XMLHttpRequest` |
| Request details | Headers, body, status and timing; JSON pretty-printed; GraphQL operation names and types | Headers, body, status and timing; JSON and XML pretty-printed; GraphQL operation names and types |
| cURL export | ✓ | ✓ |
| Log export | A HAR 1.2 file, with optional best-effort redaction | — |
| Traffic stats | Failure rate, median and 95th percentile duration, slowest endpoints and a request waterfall | — |
| Request overrides | Mock responses, serve local files, rewrite headers, add latency or failures | — |
| Request replay | Edit a captured request and send it again | — |
| Breakpoints | Hold a request or response, edit it, then continue or abort it | — |
| Network conditioning | Latency, a bandwidth ceiling and a failure rate for all intercepted traffic | — |
| Server configuration **JS** | ✓ | ✓ |
| Environment variables **JS** | ✓ | ✓ |
| IP address | ✓ | ✓ |

### Data

| Feature | iOS (Scyther) | Android (Scizor) |
|---|---|---|
| Feature flags **JS** | Override registered flags at runtime | Set registered flags to True, False or Remote at runtime |
| Preferences browser | View and edit `UserDefaults` | View and edit `SharedPreferences` |
| Cookie browser **JS** | Inspect and delete cookies in `HTTPCookieStorage`, where React Native's networking keeps its cookies | Cookies seen in captured traffic, logged by the app or captured from a WebView. Deleting one hides it; Clear all also wipes the WebView cookie store |
| File browser | Browse Documents, Library, Caches and tmp | Browse the app's private and app-specific external storage; preview, share, open or delete files |
| Database browser | Browse and edit SQLite databases, including Core Data and SwiftData stores, in Application Support, Documents and Library, with a SQL editor | Browse and edit SQLite databases, including Room's, in the app's databases directory, with a raw SQL editor |

### Security

| Feature | iOS (Scyther) | Android (Scizor) |
|---|---|---|
| Keychain / Keystore | View and delete keychain items | List AndroidKeyStore entries with certificate details, and delete them |

### System Tools

| Feature | iOS (Scyther) | Android (Scizor) |
|---|---|---|
| Location spoofing | 23 preset cities, a preset driving route and custom coordinates. **JS** can read its state | Preset cities, routes and custom coordinates, once the app declares `ACCESS_MOCK_LOCATION` and is the device's mock location app |
| Deep link tester **JS** | Presets, history and a QR scanner | Presets and history; a QR scanner when the app adds Google's code scanner library |
| Crash logs **JS** | Uncaught Objective-C exceptions, listed after relaunch | Uncaught exceptions on any thread, listed in Crash Logs |
| Console logs | The app's stdout and stderr. React Native logs JavaScript `console` calls through `os_log`, so they don't appear | The app's own Logcat output |

### Notifications

| Feature | iOS (Scyther) | Android (Scizor) |
|---|---|---|
| Notification tester | Schedule local test notifications | Post or schedule local test notifications |
| Notification logger **JS** | Payloads your app passes in | Notifications posted on the device, once notification access is granted |
| Tokens **JS** | APNs and FCM token rows, showing "Not set" until set | An FCM token row, once a token is set |

### UI/UX Tools

| Feature | iOS | Android |
|---|:---:|:---:|
| Grid overlay, FPS counter and touch visualiser | ✓ | ✓, once "Display over other apps" is granted |
| Show view frames and view sizes | ✓ | ✓, once "Display over other apps" is granted |
| Slow animations | ✓ | ✓ (Android `ValueAnimator` durations) |
| Fonts | ✓ | ✓ |
| Interface previews, registered natively | ✓ | ✓ |
| Appearance: light or dark mode | ✓ | ✓ on Android 12+ |
| Appearance: text size | ✓ | A font scale, once your Activity wraps its context with `Scizor.wrapAppearance()` |
| Appearance: contrast | Increase Contrast | High contrast in Scizor's own menu only |
| Accessibility audit: missing labels, touch targets and contrast, including React Native views | ✓ | — |
| Layout guides and layout ruler | ✓ | — |
| View hierarchy | ✓ | — |
| Language and pseudo-localisation | ✓ | — |

### Development Tools

| Feature | iOS | Android |
|---|:---:|:---:|
| Custom developer options **JS** | ✓ | ✓ |

For the full detail on any feature, see [Scyther's README](https://github.com/bstillitano/Scyther#features) or [Scizor's README](https://github.com/bstillitano/scizor#features).

## Requirements

| | Requirement |
|---|---|
| React Native | 0.87, with the New Architecture, the only architecture it supports. Tested with 0.87.1. |
| iOS | 16.0 or later, built with React Native's Swift Package Manager integration. CocoaPods isn't supported. |
| Xcode | 16.1 or later, React Native 0.87's stated minimum. Tested with Xcode 26.2 locally and 26.6 in CI. |
| Android | `minSdk` 24 and `compileSdk` 37, which Scizor requires, and JDK 17 or later. Tested with React Native 0.87's defaults: AGP 9.2.1 and Kotlin 2.2.0. |

Two dependency notes for Android:

- Scizor depends on Material 3 `1.5.0-alpha`, which ends up in your app. Read [Scizor's requirements](https://github.com/bstillitano/scizor#requirements) before adopting.
- Scizor depends on OkHttp 5.4.0, which Gradle picks over React Native's OkHttp 4.9.2. React Native's cookie handling comes from `okhttp-urlconnection`, so Heracross aligns that to 5.4.0 as well; without it, any request that carries a cookie crashes.

## Installation

Heracross isn't published to npm yet. Install it from GitHub, which builds the package on install:

```sh
npm install github:bstillitano/heracross#v0.1.0
```

`#v0.1.0` pins the release. Leave it off to track unreleased changes on `main`. Releases and what changed in each are listed in the [changelog](CHANGELOG.md).

npm records the dependency with a `git+ssh` URL in `package-lock.json`, but installs fetch the repository over HTTPS, so machines that run `npm ci`, such as CI, don't need SSH access to GitHub.

Installing from GitHub builds the package in a clone of the repository, which installs its development dependencies first, so the first install takes a while.

Heracross is tested with npm and with Yarn 4 using the `node-modules` linker. Yarn Plug'n'Play and pnpm aren't tested.

### Android

Nothing else to do. Scizor is resolved from JitPack, which the React Native Gradle plugin adds to every project by default. If you have turned that off with `includeJitpackRepository=false` or `react.includeJitpackRepository=false`, add `maven { url "https://jitpack.io" }` to your repositories.

### iOS

Heracross ships Swift Package Manager support only, so your app has to use React Native's SPM integration. In order:

1. **Tell the React Native CLI that Heracross has iOS code.** The CLI only recognises iOS code in packages that ship a podspec, and React Native's SPM autolinker skips any package without iOS code. Create `react-native.config.js` next to your app's `package.json`, or add to the one you have:

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

2. **Patch React Native's SPM autolinker.** React Native 0.87 writes the package that links every library with a hardcoded minimum of iOS 15, and SwiftPM won't let it depend on a package that needs iOS 16. Xcode reports:

   ```
   The package product 'Heracross' requires minimum platform version 16.0 for the iOS platform,
   but this target supports 15.0 (in target 'AutolinkedAggregate' from project 'Autolinked')
   ```

   The fix is one line in `node_modules/react-native/scripts/spm/generate-spm-autolinking.js`: the `Autolinked` package's `platforms: [.iOS(.v15)]` becomes `platforms: [.iOS(.v16)]`. Heracross ships it as a patch for React Native 0.87.1. Apply it so it survives reinstalls:

   - **npm, with patch-package:**

     ```sh
     npm install --save-dev patch-package
     mkdir -p patches
     cp node_modules/heracross/patches/react-native+0.87.1.patch patches/
     npx patch-package
     ```

     Then add `"postinstall": "patch-package"` to your `scripts`. The file name has to match your installed React Native version.
   - **Yarn 4:** run `yarn patch react-native`, make the same one-line change in the directory it prints, then run `yarn patch-commit -s <that directory>`.

3. **Switch the app to Swift Package Manager.** Commit your work, including `patches/`, `react-native.config.js` and `package.json`, then run:

   ```sh
   npx react-native spm
   ```

   On a project that isn't set up for SPM yet, this runs `add`. It converts a CocoaPods app by itself only when the Podfile lists no third-party pods and the Xcode project and Podfile are committed with no local changes. Otherwise run `npx react-native spm add --deintegrate`. Either way, converting runs `pod deintegrate`, so CocoaPods has to be installed. Afterwards, don't run `pod install` again: React Native warns that it breaks the SPM setup.

   Every native library in the app needs a `Package.swift`, and some don't ship one yet, including `react-native-safe-area-context` from React Native's app template. The command stops and names the library:

   ```
   error: Package.swift is missing for library "react-native-safe-area-context" — it ships no Swift Package Manager support.
   ```

   Generate a manifest for it and keep it as a patch, then commit and run `npx react-native spm` again:

   ```sh
   npx react-native spm scaffold
   npx patch-package react-native-safe-area-context
   ```

   Two kinds of library can't be scaffolded, and React Native says which:

   - **No podspec either:** "Package.swift is missing for library … and it ships no podspec so it cannot be scaffolded automatically." The library needs SPM support from its maintainer.
   - **Swift mixed with Objective-C:** SwiftPM can't compile both in one target. Opt the library out of SPM autolinking in `react-native.config.js` with `platforms: { ios: null }`, or use a prebuilt XCFramework of it.

4. **Raise the deployment target to iOS 16**, the minimum Scyther supports: in Xcode, select your app target and set Minimum Deployments to 16.0 for every configuration. That's the target's `IPHONEOS_DEPLOYMENT_TARGET` build setting, if you'd rather edit `project.pbxproj`.

5. **Update the injected packages**, and do the same whenever you add or remove a native dependency:

   ```sh
   npx react-native spm update
   ```

6. **Build and run from Xcode**, using `ios/<YourApp>.xcodeproj`. Xcode fetches Scyther from GitHub when it resolves packages.

SPM links each library into `ios/build/generated/autolinking/libs` with symlinks, which `tsc` follows. If it then reports errors from there, add `"ios/build"` to the `exclude` list in your `tsconfig.json`.

## Quick Start

Add two lines to the top of your entry file, `index.js`, and keep your existing `registerComponent` call:

```ts
import Heracross from 'heracross';

Heracross.start();
```

Then open the menu from code, for example from a button in a debug screen:

```ts
Heracross.showMenu();
```

Where the toolkit has started outside a debug build, such as a TestFlight build or one started with `allowProductionBuilds` (see [Production Safety](#production-safety)), shaking opens the menu too. In a debug build, React Native's Dev Menu also listens for shakes:

- **iOS:** the Dev Menu opens instead of Heracross's menu, so use `showMenu()` in development.
- **Android:** Scizor's menu opens and the Dev Menu doesn't. Scizor opens a copy for every half second of shaking, so a long shake stacks several. Open the Dev Menu with `adb shell input keyevent 82` instead, or set the gesture to something other than `shake` to give shakes back to it.

## Usage Guide

### Feature Flags

Register your flags with their default values on every launch, before reading them. Registrations aren't saved.

```ts
Heracross.featureFlags.register([
  { key: 'new_checkout', title: 'New checkout', defaultValue: remoteConfig.newCheckout },
  { key: 'dark_mode_v2', title: 'Dark mode v2', defaultValue: true },
]);

if (await Heracross.featureFlags.isEnabled('new_checkout')) {
  // ...
}
```

`isEnabled` resolves to a flag's local override when overrides are switched on, in the Feature Flags screen's "Enable overrides" switch or from JavaScript, and the flag has one. Otherwise it resolves to `defaultValue`, and to `false` for a key that was never registered. Pass your real remote value as `defaultValue`, so "no override" means production behaviour. Android lists each flag by `title`; iOS lists it by key.

Overrides and the "Enable overrides" switch are saved across launches. You can set them from JavaScript too, for example to prepare a QA build or an end-to-end test:

```ts
Heracross.featureFlags.setOverridesEnabled(true);
Heracross.featureFlags.setOverride('new_checkout', true);
Heracross.featureFlags.clearOverride('new_checkout'); // back to its default
Heracross.featureFlags.resetOverrides();              // every flag back to its default
```

On iOS a flag must be registered before you override it. On Android, Scizor only saves overrides once it has started: override calls made before `start()` are applied when it starts, and reads made before then resolve each flag's default. When Scizor's production gate refuses to start, overrides never apply.

To react when a flag's value changes, whether a tester flips it in the menu or your code overrides it, add a listener:

```ts
const subscription = Heracross.featureFlags.addListener(({ key, enabled }) => {
  if (key === 'new_checkout') setNewCheckout(enabled);
});

subscription.remove(); // when you're done
```

The listener gets a flag's new effective value, the same value `isEnabled` would resolve, whenever it changes: from an override, from the "Enable overrides" switch, or from registering the flag again with a different default. A change made straight after registering is reported too. A flag's first registration isn't a change, so read the value with `isEnabled` first and listen for changes after that. See [Listening in React Components](#listening-in-react-components) for a hook.

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
Heracross.servers.select('Production');

const server = await Heracross.servers.getSelected();
// { id: 'Production', baseUrl: 'https://api.example.com', variables: { REGION: 'au' } }
```

- **Configure first.** `select` ignores ids that aren't configured.
- **The selection is saved** across launches, and selecting a server in the menu changes what the next `getSelected()` resolves.
- **When nothing is selected**, or the saved server isn't one you configured, `configure` selects the first server, and `getSelected()` resolves it. It resolves `null` only when no servers are configured.
- **`configure` differs by platform:** on Android it replaces the list. On iOS it adds or replaces servers by id; Scyther can't remove a server, so one you leave out stays in the menu until the app restarts.
- **`baseUrl` on iOS:** Scyther has no base URL field, so a non-empty `baseUrl` is stored, and shown in the menu, as a `baseUrl` variable. That makes `baseUrl` a reserved variable name on iOS.
- **Before `start()` on Android:** a `select` is applied once Scizor starts, and `getSelected()` ignores the saved selection until then. When Scizor's production gate refuses to start, `select` does nothing and `getSelected()` always resolves the first server.

To rebuild your API client when the environment changes, add a listener:

```ts
const subscription = Heracross.servers.addListener((server) => {
  api.setBaseUrl(server.baseUrl);
});
```

The listener gets the newly selected server, in the same shape as `getSelected()`, whenever the selection moves to a different id: from the menu, from `select`, or from `configure` when the selected server isn't in the new list. A `select` made straight after `configure` is reported too. The first selection isn't a change. On iOS a server picked in the menu is reported straight away. Scizor doesn't report selections, so on Android Heracross reads the selection when the menu closes.

### Reading State

Read back what the menu shows, for example to build your own debug screen:

```ts
const flags = await Heracross.featureFlags.getAll();
// [{ key: 'new_checkout', title: 'New checkout', defaultValue: false, enabled: true, override: true }, ...]

const override = await Heracross.featureFlags.getOverride('new_checkout'); // true, false or null
const overridesOn = await Heracross.featureFlags.getOverridesEnabled();

const servers = await Heracross.servers.getAll(); // every configured server, as getSelected() shapes them
const variables = await Heracross.getEnvironmentVariables();
const menuOpen = await Heracross.isMenuOpen();
```

`override` is the stored override whether or not overrides are switched on, and `null` when the flag has none or isn't registered. On Android, reads made before `start()` don't see Scizor's saved overrides or selection yet.

Two synchronous values describe the build:

- **`Heracross.isAvailable`** is `false` when the native module isn't in the app binary, for example before the app has been rebuilt after installing Heracross. Every call then does nothing and every read resolves an empty value, and in development Heracross logs a warning once.
- **`Heracross.supports`** says which platform-specific features work here: `floatingButton`, `disabledFeatures` and `cookies` on Android; `apnsToken`, `notificationLog` and `locationSpoofingState` on iOS. Calls for an unsupported feature do nothing.

### Listening in React Components

Subscribe in an effect and remove the subscription in its cleanup:

```tsx
import { useEffect, useState } from 'react';
import Heracross from 'heracross';

export function useFeatureFlag(key: string): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let current = true;
    Heracross.featureFlags.isEnabled(key).then((value) => {
      if (current) setEnabled(value);
    });
    const subscription = Heracross.featureFlags.addListener((change) => {
      if (change.key === key) setEnabled(change.enabled);
    });
    return () => {
      current = false;
      subscription.remove();
    };
  }, [key]);

  return enabled;
}
```

The example app's Heracross tab, in `example/src/screens/HeracrossScreen.tsx`, subscribes to both listeners the same way.

### Environment Variables

Show key/value pairs on the menu's Environment Variables screen, under Networking:

```ts
Heracross.setEnvironmentVariables({
  API_BASE_URL: 'https://api.example.com',
  APP_ENVIRONMENT: 'development',
});
```

### Custom Developer Options

Add read-only value rows to the menu's Development Tools section, which appears once it has a row:

```ts
Heracross.setDeveloperOptions([
  { name: 'Build', value: '1234' },
  { name: 'Commit', value: 'a1b2c3d' },
]);
```

### Deep Link Presets

Add one-tap links to the menu's Deep Link Tester:

```ts
Heracross.deepLinks.setPresets([
  { name: 'Home', url: 'myapp://home' },
  { name: 'Profile', url: 'myapp://user/42' },
]);
```

### Push Notifications

Tokens show in the menu's Notifications section; pass `null` to clear one:

```ts
Heracross.setFcmToken(fcmToken);
Heracross.setApnsToken(apnsToken); // iOS only
```

On iOS, Scyther's Notification Logger lists the payloads your app gives it. Pass them from your push library's handler:

```ts
Heracross.notifications.log(remoteMessage.data); // iOS only; must be JSON-compatible
```

On Android, Scizor's Notification Logger reads notifications posted on the device itself, once notification access is granted, so `notifications.log` does nothing.

### Network Logging

Pass nothing and React Native's requests are logged:

- **iOS:** Scyther adds its URL protocol to the `URLSessionConfiguration`s created after it starts. That covers React Native's session, which it creates when it sends its first request, and any session created later; sessions configured earlier, for example by native SDKs at launch, aren't logged. `start()` hands off to the main queue, so Scyther starts a moment after the call returns; call it at the top of your entry file, before anything can send a request.
- **Android:** Heracross registers Scizor's interceptor through `NetworkingModule.setCustomClientBuilder`, which React Native applies to every request it sends, so `fetch` and `XMLHttpRequest` requests sent after `start()` are logged. That hook is a single slot: whichever of Heracross or your app registers last wins. Your own OkHttp clients aren't logged unless you add `Scizor.network.interceptor()` to them. Pass `captureNetwork: false` to leave React Native's networking alone.

On Android, Scizor reads up to 1 MB of each response body before handing the response on, so streaming responses, such as server-sent events or download progress, arrive late while capture is on.

### Cookies

On iOS, Scyther's Cookie Browser lists `HTTPCookieStorage.shared`, which is where React Native's networking stores cookies, so there's nothing to do.

On Android, Scizor's Cookie Browser lists cookies from the traffic it captures. Add others yourself, such as cookies your app sets by hand or a WebView's:

```ts
Heracross.cookies.log({
  name: 'session',
  value: token,
  domain: 'example.com',
  path: '/',
  secure: true,
  httpOnly: true,
});

Heracross.cookies.captureWebView('https://example.com'); // every WebView cookie for that URL
Heracross.cookies.clear();                                // forget the ones you added
```

All three do nothing on iOS.

### Crash Logging

Crashes are saved and listed in the menu under System Tools → Crash Logs; a crash that kills the app shows once it's relaunched. To check it end to end:

```ts
Heracross.crashes.triggerTestCrash();
```

- **iOS:** Scyther records uncaught Objective-C exceptions, not Swift runtime errors or signals. The test crash raises one, and Scyther only compiles it into Debug builds, so in other configurations the call does nothing.
- **Android:** Scizor records uncaught exceptions from any thread. Scizor has no public test-crash API, so Heracross throws on the main thread, and only in a debuggable build.

### Location Spoofing

Spoof the device's location from the menu, under System Tools → Location Spoofer. On iOS you can read the spoofer's state from JavaScript:

```ts
const state = await Heracross.location.getSpoofingState();
// { enabled, swizzled, locationName, latitude, longitude }
```

It resolves `null` on Android, where Scizor keeps its spoofer internal. On Android, Scizor can only spoof once your app declares `ACCESS_MOCK_LOCATION` and is selected under Developer options → Select mock location app. Declare the permission in your debug manifest, as the example app does in `example/android/app/src/debug/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission
        android:name="android.permission.ACCESS_MOCK_LOCATION"
        tools:ignore="MockLocation,ProtectedPermissions" />

</manifest>
```

A spoofed location reaches the app through `LocationManager`.

### Going Native

Heracross covers what both toolkits share. Everything else, such as custom screens, interface previews, database adapters, Scyther's network rules or Scizor's action and toggle developer options, is configured natively.

- **iOS:** React Native's SPM integration already links Scyther into your app, so Swift code in your app target can `import Scyther` and call it, as the example's `example/ios/HeracrossExample/AppDelegate.swift` does.
- **Android:** add Scizor to your app module, at the version Heracross uses, to call it directly:

  ```groovy
  implementation "com.github.bstillitano:scizor:v0.2.3"
  ```

## Permissions & Platform Setup

Some toolkit features need setup in your app before they work:

| Feature | iOS | Android |
|---|---|---|
| Deep Link Tester QR scanner | Add `NSCameraUsageDescription` to `Info.plist` | Add `com.google.android.gms:play-services-code-scanner` to your app |
| Location spoofing | Add `NSLocationWhenInUseUsageDescription` for your app's own location requests | Declare `ACCESS_MOCK_LOCATION` and select the app as the mock location app ([details](#location-spoofing)) |
| Notification tester | — | On Android 13+, declare `android.permission.POST_NOTIFICATIONS` so Scizor can ask for it |
| Notification logger | Pass payloads to `Heracross.notifications.log` | Grant the app notification access when Scizor asks |
| Grid, FPS, touch, view frame and view size overlays | — | Grant "Display over other apps" |
| Appearance font scale | — | Add Scizor to your app ([Going Native](#going-native)) and wrap your Activity's context |

The font scale only reaches your app's views if your `MainActivity` wraps its context:

```kotlin
override fun attachBaseContext(newBase: Context) {
  super.attachBaseContext(Scizor.wrapAppearance(newBase))
}
```

## Menu Invocation

```ts
Heracross.setInvocationGesture('shake');          // default
Heracross.setInvocationGesture('floatingButton'); // Android only; iOS uses 'none'
Heracross.setInvocationGesture('none');           // open it with Heracross.showMenu()

Heracross.hideMenu();
```

- **Floating button:** on Android it's attached when one of your Activities resumes. When you call `start()` from JavaScript, your Activity has usually resumed already, so the button appears the next time the app comes back to the foreground or the Scizor menu closes.
- **`showMenu()`** does nothing until `start()` has run. On iOS it also does nothing while the menu is open; on Android it opens a second copy.
- **Android menu:** Scizor's menu is its own Activity, so your app is paused while it's open. React Native pauses JavaScript timers then, so a `setTimeout` waits until the menu closes; events such as flag changes still reach your listeners.
- **Shaking** in a debug build competes with React Native's Dev Menu differently on each platform; see [Quick Start](#quick-start).

## Production Safety

Both toolkits refuse to start in a store build unless you opt in:

- **iOS:** Scyther treats a build as App Store when it isn't a Debug build, isn't running on the simulator and has no sandbox receipt. `start()` then does nothing, silently. Ad hoc and enterprise builds meet that test too.
- **Android:** Scizor refuses to start when the app isn't debuggable, and logs a warning. Heracross then leaves React Native's networking untouched, flag overrides don't apply, and `servers.select` does nothing.

To run the menu in a signed QA build on purpose:

```ts
Heracross.start({ allowProductionBuilds: true });
```

**Warning:** anyone holding that build can see network traffic, preferences, cookies and keychain or keystore contents.

To check at runtime whether the toolkit started, for example to hide a "Debug menu" button:

```ts
const started = await Heracross.isStarted();
```

### Hiding tools

On Android you can hide Scizor's riskier tools from a build that leaves your team:

```ts
Heracross.setDisabledFeatures(['keystore', 'console', 'preferences']);
```

Each call replaces the previous list, and `[]` shows every tool again. The ids are `network`, `servers`, `environment_variables`, `feature_flags`, `preferences`, `cookies`, `file_browser`, `database_browser`, `keystore`, `location`, `console`, `deep_link`, `crash_logs`, `notification_logger`, `notification_tester`, `fonts`, `interface_previews`, `grid_overlay`, `fps_counter`, `touch_visualiser` and `appearance`. Scyther can't hide its tools, so iOS ignores the call.

### What ships in a release build

Refusing to start doesn't remove the toolkits from your app:

- **iOS:** Scyther is compiled into every build configuration.
- **Android:** Scizor is a dependency of every build variant, and its library manifest merges into your app: the `SYSTEM_ALERT_WINDOW`, `INTERNET` and `ACCESS_NETWORK_STATE` permissions, a notification listener service, a FileProvider and the menu's activity. [Scizor's README](https://github.com/bstillitano/scizor#what-scizor-adds-to-your-manifest) shows how to remove the user-visible entries from release builds.

### Debug-only builds

React Native 0.87's autolinking can't leave Heracross out of release builds on either platform:

- **iOS:** React Native's SPM autolinking has no per-configuration option, so Heracross and Scyther are linked into every configuration.
- **Android:** `platforms.android.buildTypes` in `react-native.config.js` limits Heracross's Gradle dependency to those build types, but the `PackageList` React Native generates still registers `HeracrossPackage` in every variant. A release build then fails with `error: package com.heracross does not exist`.

Keep Heracross in every build and rely on the production gate above. If the native module isn't linked into a build by some other means, the JavaScript still loads: `Heracross.isAvailable` is `false`, every call does nothing, and every read resolves an empty value.

## Where Settings Live

- **Saved across launches:** flag overrides, the "Enable overrides" switch and the selected server, plus each toolkit's own settings. Scyther keeps them in the `com.scyther.settings` `UserDefaults` suite; Scizor keeps them in device-protected storage. Clearing your app's own `UserDefaults` or `SharedPreferences` leaves them alone; deleting the app's data doesn't.
- **Not saved:** registered flags and servers, environment variables and developer options. Set them on every launch.

## Testing with Jest

Heracross's JavaScript talks to a native module that doesn't exist in Jest. Heracross ships a mock of its whole API:

```ts
jest.mock('heracross', () => require('heracross/jest'));
```

Every method is a `jest.fn()`. Reads resolve empty values, listeners return a subscription whose `remove` is a `jest.fn()`, and `supports` reports every feature. Override what a test needs:

```ts
import Heracross from 'heracross';

jest.mocked(Heracross.featureFlags.isEnabled).mockResolvedValue(true);
```

`require('heracross/jest').createHeracrossMock()` returns a fresh copy, and the default and named `Heracross` exports are the same mock.

## Continuous Integration

An app that uses Heracross builds in CI like any React Native SPM app:

- **iOS:** run `npx react-native spm update` before `xcodebuild`; `ios/build/generated` isn't committed. Xcode fetches Scyther from GitHub, so the build needs network access to it. Heracross allows any Scyther 4.8.x from 4.8.1, so commit your Xcode project's `Package.resolved` to keep CI on the version you tested.
- **Android:** Gradle fetches Scizor from JitPack.
- **Both:** installing Heracross fetches it from GitHub, and the React Native patch has to apply during install.

## Example App

`example/` is a React Native port of Scyther's example app, with the same Home and Location tabs and the same sections, plus a Heracross tab:

- **Home:** open the menu; REST and GraphQL requests; a UserDefaults (iOS) or SharedPreferences (Android) demo; sample feature flags; the deliberately broken accessibility controls for Scyther's audit (iOS); a SQLite database demo; and, in development builds, a test crash.
- **Location:** Scyther's spoofer state (iOS) or a note about Scizor's spoofer (Android), the location the platform reports, a map once a fix arrives, and continuous updates.
- **Heracross:** calls every Heracross API and shows what the reads return, with live logs of flag and server changes. Features a platform doesn't support explain why instead of showing controls.
- **At launch:** the same environment variables, servers and feature flags as Scyther's example, and the same cookies, keychain items (iOS) and database records. On Android, where Scyther's example has nothing to port, it also sets what Scizor's sample app does: an FCM token, deep link presets, a developer option and seeded SharedPreferences.

The native half is the example's own Turbo Module, `HeracrossExampleDemo`. On iOS it's an app-local SPM module declared in `example/ios/react-native.config.js`; on Android it's a package registered in `MainApplication`.

It differs from Scyther's example where React Native can't do the same thing without third-party native libraries, or where Heracross adds something:

- The map is a static view of OpenStreetMap tiles instead of an interactive MapKit map.
- Records are stored in SQLite instead of SwiftData.
- The copy is English only.
- The tab icons are text glyphs instead of SF Symbols, and the app is named HeracrossExample.
- The accessibility audit section is iOS only, because Scizor has no audit.
- The seeded API key is an obvious placeholder, so secret scanners don't mistake it for a real key.
- In an iOS debug build, the Home tab's shake hint points to the Open Scyther Menu button, since React Native's Dev Menu takes the shake.
- The Heracross tab.

See [CONTRIBUTING.md](CONTRIBUTING.md) to run it.

## How It Works

```
heracross (JavaScript API)
└── NativeHeracross (Turbo Module spec, codegen)
    ├── iOS      Heracross (Objective-C++) → HeracrossScyther (Swift) → Scyther (SwiftPM)
    └── Android  HeracrossModule (Kotlin) → Scizor (JitPack)
```

- **One spec, two implementations.** `src/NativeHeracross.ts` is the Turbo Module spec. Codegen turns it into an Objective-C++ protocol and a Java base class, so both platforms implement the same surface.
- **iOS is split across two targets.** SwiftPM can't compile Swift and Objective-C++ in one target, so the Turbo Module is Objective-C++ and every call into Scyther goes through a small Swift target. Scyther's API runs on the main actor, so each call is forwarded to the main queue in the order JavaScript made it, and server calls also go through a serial chain against Scyther's `Servers` actor.
- **Android forwards to Scizor.** Scizor calls are posted to the main thread in order; the networking hook is installed directly in `start()`.
- **Change events come from re-reading.** Neither toolkit reports every change, so Heracross keeps the last value of each registered flag and the selected server's id, reads them again when something may have changed, and emits the differences. On iOS that's after its own calls and whenever Scyther's `UserDefaults` suite changes, which is where Scyther saves overrides and the selected server. On Android it's after its own calls, from Scizor's override callback, when Scizor's menu closes and when the app returns to the foreground. Scizor's callback is a single slot: Heracross installs its own once and still calls the one that was there before, but code that sets it later replaces Heracross's, and flag changes made in the menu are then only noticed when the menu closes.
- **Android queues writes until Scizor starts.** Scizor only opens its store in `start`, and drops override and selection writes made before then. Heracross holds those writes and applies them once Scizor starts, after recording Scizor's saved state, so the saved state isn't reported as a change.
- **The JavaScript layer normalises input.** `src/index.tsx` fills in defaults and converts ids, names and values to strings before they reach native code.

## API Reference

| Symbol | iOS (Scyther) | Android (Scizor) |
|---|---|---|
| `isAvailable` | whether the native module is in the binary | whether the native module is in the binary |
| `supports` | `apnsToken`, `notificationLog`, `locationSpoofingState` | `floatingButton`, `disabledFeatures`, `cookies` |
| `start({ allowProductionBuilds, captureNetwork })` | `Scyther.start(allowProductionBuilds:)`, which ignores later calls; `captureNetwork` is ignored | `Scizor.start(app, allowProductionBuilds)`, plus the networking hook, then the queued writes |
| `isStarted()` → `Promise<boolean>` | `Scyther.isStarted` | whether a `start()` made through Heracross passed Scizor's production gate |
| `showMenu()` / `hideMenu()` | `showMenu()` / `hideMenu()` | `show()` / `dismiss()` |
| `isMenuOpen()` → `Promise<boolean>` | `Scyther.isPresented` | whether a Scizor menu Activity exists |
| `setInvocationGesture(gesture)` | `.shake`, or `.custom` for anything else | `SHAKE` / `FLOATING_BUTTON` / `NONE` |
| `setDisabledFeatures(ids)` | no-op | `disabledFeatures` |
| `featureFlags.register(flags)` | `featureFlags.register(_:remoteValue:)`, listed by key | `featureFlags.register(FeatureFlag)`, listed by title |
| `featureFlags.isEnabled(key)` → `Promise<boolean>` | `featureFlags.isEnabled(_:)` | `featureFlags.isEnabled(key)` |
| `featureFlags.getAll()` → `Promise<FeatureFlagState[]>` | `featureFlags.all`, `isEnabled(_:)`, `FeatureToggle.hasLocalOverride` / `localValue` | `featureFlags.all()`, `isEnabled(key)`, `overrideState(key)` |
| `featureFlags.getOverride(key)` → `Promise<boolean \| null>` | `FeatureToggle.hasLocalOverride` / `localValue` | `overrideState(key)`, `null` when unregistered |
| `featureFlags.getOverridesEnabled()` → `Promise<boolean>` | `localOverridesEnabled` | `overridesEnabled` |
| `featureFlags.setOverridesEnabled(enabled)` | `localOverridesEnabled` | `overridesEnabled`, queued until `start` |
| `featureFlags.setOverride(key, value)` / `clearOverride(key)` | `setLocalValue(_:for:)` / `clearLocalValue(for:)` | `setOverride(key, ON \| OFF \| REMOTE)`, queued until `start` |
| `featureFlags.resetOverrides()` | `clearAllLocalValues()` | `resetAllToRemote()`, queued until `start` |
| `featureFlags.addListener(listener)` → `EventSubscription` | re-reads flags when Scyther's `UserDefaults` suite changes | `featureFlags.onOverrideChanged`, and a re-read when the menu closes or the app resumes |
| `servers.configure(servers)` | `servers.register(id:variables:)`, adds or replaces by id, then selects the first when the saved one isn't in the list | `servers.configure(environments)`, replaces the list |
| `servers.select(id)` | `servers.select(_:)`, for a configured id | `servers.select(environment)`, for a configured id, queued until `start` |
| `servers.getSelected()` → `Promise<SelectedServer \| null>` | `servers.current`, or the first registered server when Scyther's saved id isn't registered | `servers.selected` |
| `servers.getAll()` → `Promise<SelectedServer[]>` | `servers.all` | `servers.all()` |
| `servers.addListener(listener)` → `EventSubscription` | re-reads the selection when Scyther's `UserDefaults` suite changes | re-reads `servers.selected` when the menu closes or the app resumes |
| `setEnvironmentVariables(map)` | `environmentVariables` | `environmentVariables` |
| `getEnvironmentVariables()` → `Promise<Record<string, string>>` | `environmentVariables` | `environmentVariables` |
| `setDeveloperOptions(rows)` | `DeveloperOption(name:value:)` | `DeveloperOption.Value` |
| `deepLinks.setPresets(presets)` | `deepLinks.presets` | `deepLinkPresets` |
| `setApnsToken(token)` | `apnsToken` | no-op |
| `setFcmToken(token)` | `fcmToken` | `fcmToken` |
| `notifications.log(payload)` | `notifications.logNotification(_:)` | no-op |
| `cookies.log(cookie)` | no-op | `cookies.log(...)` |
| `cookies.captureWebView(url)` / `cookies.clear()` | no-op | `cookies.captureWebView(url)` / `cookies.clear()` |
| `crashes.triggerTestCrash()` | `crashes.triggerTestCrash()`, Debug builds only | throws on the main thread, debuggable builds only |
| `location.getSpoofingState()` → `Promise<LocationSpoofingState \| null>` | `location.spoofingEnabled`, `spoofedLocation`, `CLLocationManager.isLocationSwizzled` | resolves `null` |

`Heracross` is both the default export and a named export: `import Heracross from 'heracross'` and `import { Heracross } from 'heracross'` are the same object.

### Types

All of these are exported from `heracross`:

| Type | Shape |
|---|---|
| `InvocationGesture` | `'shake' \| 'floatingButton' \| 'none'` |
| `StartOptions` | `{ allowProductionBuilds?: boolean; captureNetwork?: boolean }` |
| `FeatureFlag` | `{ key: string; title?: string; defaultValue: boolean }` |
| `Server` | `{ id: string; baseUrl?: string; variables?: Record<string, string> }` |
| `SelectedServer` | `{ id: string; baseUrl: string; variables: Record<string, string> }` |
| `DeveloperOption` | `{ name: string; value: string }` |
| `DeepLinkPreset` | `{ name: string; url: string }` |
| `LocationSpoofingState` | `{ enabled: boolean; swizzled: boolean; locationName: string; latitude: number; longitude: number }` |
| `FeatureFlagChange` | `{ key: string; enabled: boolean }` |
| `FeatureFlagState` | `{ key: string; title: string; defaultValue: boolean; enabled: boolean; override: boolean \| null }` |
| `HeracrossSupport` | `{ floatingButton; disabledFeatures; cookies; apnsToken; notificationLog; locationSpoofingState }`, all `boolean` |
| `Cookie` | `{ name: string; value: string; domain: string; path?: string; secure?: boolean; httpOnly?: boolean; sameSite?: string; expires?: string }` |
| `ScizorFeature` | One of the ids in [Hiding tools](#hiding-tools), or any other string |
| `EventSubscription` | React Native's `{ remove(): void }`, re-exported |

## Troubleshooting

**"Heracross: the native module isn't in this build, so every call does nothing."** The native module isn't in the app binary, so `Heracross.isAvailable` is `false`. On iOS, check the `react-native.config.js` override from [step 1](#ios) and run `npx react-native spm update`; on either platform, rebuild the app after installing Heracross.

**`The package product 'Heracross' requires minimum platform version 16.0`.** The React Native patch from [step 2](#ios) isn't applied. Apply it, then run `npx react-native spm update`.

**Android crashes with `NoClassDefFoundError: Failed resolution of: Lokhttp3/internal/Util;`.** Something in your build forces `okhttp-urlconnection` back to OkHttp 4 while Scizor brings OkHttp 5. Keep `okhttp-urlconnection` at 5.4.0, as Heracross declares.

**Shaking opens React Native's Dev Menu on iOS.** That's a debug build; use `Heracross.showMenu()`. See [Quick Start](#quick-start).

**Shaking on Android opens Scizor's menu several times, or never opens React Native's Dev Menu.** Scizor takes the shake; see [Quick Start](#quick-start).

**The floating button doesn't appear.** It attaches when an Activity resumes; background the app and return to it. See [Menu Invocation](#menu-invocation).

**Nothing happens in a TestFlight, App Store, Play Store or release build.** The production gate refused to start; see [Production Safety](#production-safety).

**Scizor's Location Spoofer shows "Failed — set Scizor as the mock location app".** Declare `ACCESS_MOCK_LOCATION` and select your app as the mock location app; see [Location Spoofing](#location-spoofing).

**Grid, FPS or touch overlays don't show on Android.** Grant "Display over other apps".

## Versioning

| Component | Version |
|---|---|
| Heracross | 0.1.0, installed from GitHub; not published to npm |
| Scyther (iOS) | 4.8.1 or a later 4.8.x, resolved by Swift Package Manager |
| Scizor (Android) | v0.2.3, from JitPack |
| OkHttp `okhttp-urlconnection` (Android) | 5.4.0, aligned with Scizor |
| React Native (peer dependency) | 0.87.x |

## Uninstalling

1. Remove every `Heracross` call from your code.
2. Uninstall the package: `npm uninstall heracross`.
3. Remove the `heracross` entry from `react-native.config.js`.
4. Remove the React Native patch: delete `patches/react-native+0.87.1.patch` and reinstall, or remove the Yarn patch resolution.
5. Run `npx react-native spm update`.
6. Remove anything you added only for the toolkits: `ACCESS_MOCK_LOCATION`, `POST_NOTIFICATIONS`, usage strings, a Scizor dependency or `Scizor.wrapAppearance`.
7. If you raised the deployment target to iOS 16 only for Heracross, lower it again; keep any scaffolded `Package.swift` patches your other libraries still need, and the `ios/build` entry in `tsconfig.json` while the app uses SPM.

## FAQ

### Why is Heracross free?

For the same reason Scyther and Scizor are: they exist to give back to the community.

### Why doesn't it support CocoaPods?

Scyther's README documents only Swift Package Manager installation, and React Native 0.87 ships its own SPM integration, so Heracross is SPM only.

### Why do I need to patch React Native?

React Native 0.87's SPM autolinker hardcodes iOS 15 on the package that links every library, and Scyther needs iOS 16. The patch changes that one value. It stops being necessary once React Native derives the version from your app, which [react/react-native#58515](https://github.com/react/react-native/issues/58515) asks for.

### Does it work with Expo?

It isn't supported. Heracross is built and tested only in bare React Native apps using React Native's own SPM integration, and it ships a `Package.swift` rather than the podspec Expo projects use for iOS native code.

### Will Heracross get my app rejected?

Heracross starts Scyther and Scizor, which both refuse to start in store builds unless you pass `allowProductionBuilds`, and on Android it adds Scizor's interceptor to React Native's networking only when Scizor may start. Both toolkits are still compiled into release builds; see [What ships in a release build](#what-ships-in-a-release-build), [Scyther's FAQ](https://github.com/bstillitano/Scyther#faq) for iOS, and [what Scizor adds to your manifest](https://github.com/bstillitano/scizor#what-scizor-adds-to-your-manifest) for Android.

### What's the origin of the name?

Named after the [Pokémon Heracross](https://pokemondb.net/pokedex/heracross), a Bug and Fighting type that uses its horn to fling foes, which sits alongside [Scyther](https://pokemondb.net/pokedex/scyther) and [Scizor](https://pokemondb.net/pokedex/scizor).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow, how to run the example app on both platforms, the available scripts, and how to send a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make the change, with tests and documentation
4. Run `yarn typecheck`, `yarn test`, `yarn test:ios` and `yarn test:android`, and build the example app on both platforms
5. Open a Pull Request

### Reporting Issues

- Use GitHub Issues for bug reports
- Include the platform, OS version, React Native version and Heracross version
- Provide minimal reproduction steps

---

## Reporting a Vulnerability

If you discover a security vulnerability, please email b.stillitano95@gmail.com directly. Do not open a public issue. See [SECURITY.md](SECURITY.md) for supported versions.

---

## License

Heracross is released under the MIT license. See [LICENSE](LICENSE) for details.

---

## Credits

Heracross is maintained by [Brandon Stillitano](https://github.com/bstillitano).

- iOS toolkit: [Scyther](https://github.com/bstillitano/Scyther) ([scyther.io](https://scyther.io))
- Android toolkit: [Scizor](https://github.com/bstillitano/scizor)
