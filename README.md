<a href="https://github.com/bstillitano/Scyther"><img src=".github/scyther-banner.svg" alt="Building a native iOS app? Get Scyther" width="100%" /></a>
<a href="https://github.com/bstillitano/scizor"><img src=".github/scizor-banner.svg" alt="Building a native Android app? Get Scizor" width="100%" /></a>

<p align="center">
  <img width="200" src="Heracross.png" alt="Heracross">
</p>

# Heracross

A React Native debugging toolkit that gives your app an in-app debug menu, one shake away, on both platforms. Heracross doesn't reimplement anything. It's a bridge to two native toolkits:

| Platform | Toolkit | Distribution |
|---|---|---|
| iOS | [Scyther](https://github.com/bstillitano/Scyther) | Swift Package Manager |
| Android | [Scizor](https://github.com/bstillitano/scizor) | JitPack |

From JavaScript you get one API for what both toolkits share: starting the toolkit, opening the menu, feature flags, server environments, environment variables, developer rows and push tokens. Everything else is native and needs no JavaScript at all: network logging, the console, crash logs, the file, database and preferences browsers, location spoofing and the interface tools. See each toolkit's README for the full feature list.

## Requirements

- React Native **0.87+** with the New Architecture.
- **iOS:** iOS 16+, and your app built with React Native's Swift Package Manager integration. Heracross ships no podspec and does not support CocoaPods.
- **Android:** `compileSdk` 37, AGP 9.1+ and Kotlin 2.2+, which are React Native 0.87's defaults. Scizor pulls in Material 3 `1.5.0-alpha`; see [Scizor's requirements](https://github.com/bstillitano/scizor#requirements) before adopting.

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

On a freshly created CocoaPods app this migrates the project for you (`add --deintegrate`). After that, rerun it whenever you add or remove a native dependency.

Two more steps:

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

Scyther itself is fetched by SwiftPM from GitHub when Xcode resolves packages.

## Quick start

Start the toolkit once, as early as possible: at the top of your entry file, before your app makes any network request.

```ts
import Heracross from 'heracross';

Heracross.start();
```

Then **shake the device** to open the menu, or open it from code:

```ts
Heracross.showMenu();
```

## Usage

### Feature flags

```ts
Heracross.featureFlags.register([
  { key: 'new_checkout', title: 'New checkout', defaultValue: false },
]);

const enabled = await Heracross.featureFlags.isEnabled('new_checkout');
```

`isEnabled` resolves to the local override set in the menu, or to `defaultValue` when there is none.

### Server environments

```ts
Heracross.servers.configure([
  { id: 'Staging', baseUrl: 'https://staging.example.com' },
  { id: 'Production', baseUrl: 'https://api.example.com', variables: { REGION: 'au' } },
]);
Heracross.servers.select('Staging');

const server = await Heracross.servers.getSelected();
// { id: 'Staging', baseUrl: 'https://staging.example.com', variables: {...} }
```

Scyther has no base URL field, so on iOS `baseUrl` is stored, and shown in the menu, as a `baseUrl` variable.

### Menu content

```ts
Heracross.setEnvironmentVariables({ API_URL: 'https://api.example.com' });
Heracross.setDeveloperOptions([{ name: 'Build', value: '1234' }]);
Heracross.setFcmToken(fcmToken);
Heracross.setApnsToken(apnsToken); // iOS only
```

### Invocation gesture

```ts
Heracross.setInvocationGesture('shake');          // default
Heracross.setInvocationGesture('floatingButton'); // Android only; iOS uses 'none'
Heracross.setInvocationGesture('none');           // open it with Heracross.showMenu()
```

### Network logging

- **iOS:** Scyther intercepts `URLSession` traffic by itself, so React Native's `fetch` shows up without any setup.
- **Android:** `start()` installs an `OkHttpClientProvider` factory that adds Scizor's interceptor to React Native's OkHttp client. That factory replaces any your app installed. If you install your own, pass `captureNetwork: false` and add `Scizor.network.interceptor()` to your builder yourself. React Native builds its client the first time the networking module is used, so traffic is only captured when `start()` runs before your first request.

## Production safety

Both toolkits refuse to start in a store build: Scyther checks for an App Store receipt, and Scizor checks that the build is debuggable. When they refuse, `start()` does nothing, and on Android React Native's networking is left untouched. To ship the menu in a signed QA build on purpose:

```ts
Heracross.start({ allowProductionBuilds: true });
```

## API reference

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

Anything beyond this surface, such as custom screens, database adapters or location spoofing, is configured natively. Call Scyther or Scizor directly from your `AppDelegate` or `Application`.

## Example app

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

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT
