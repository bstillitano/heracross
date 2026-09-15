# Heracross Example

The Heracross example app: a React Native port of Scyther's example app (ScytherExample) that exercises Heracross on iOS and Android, plus a tab of its own that calls every Heracross API. The root [README](../README.md#example-app) describes what it shows, and [CONTRIBUTING](../CONTRIBUTING.md) covers the development workflow.

> **Note**: Make sure you have completed React Native's [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding. This project uses Yarn workspaces; run these commands with `yarn` from this directory, or with `yarn example <command>` from the repository root.

## Start Metro

```sh
yarn start
```

## Run on Android

With Metro running:

```sh
yarn android
```

## Run on iOS

Heracross ships Swift Package Manager support only, so this example has no Podfile. The first time you clone, and every time you change native dependencies, inject React Native's Swift packages into the Xcode project:

```sh
yarn spm
```

`react-native run-ios` locates the iOS project through a Podfile, so it can't drive this project. Open it in Xcode instead and run the `HeracrossExample` scheme:

```sh
yarn ios
```

## The tabs

- **Home** and **Location** port ScytherExample's two tabs, section for section. On Android, where ScytherExample has nothing to port, they follow Scizor's sample app: the menu opens from a floating button, the Location tab describes Scizor's spoofer instead of reading its state, and screen paths name Scizor's screens (`src/toolkit.ts`).
- **Heracross** has no counterpart in ScytherExample. It calls each Heracross API and shows what the reads return: `isAvailable`, `isStarted()`, `isMenuOpen()` and `supports`; opening and closing the menu; the invocation gesture; feature flags with their overrides, and a log fed by `featureFlags.addListener`; servers, and a log fed by `servers.addListener`; environment variables; developer options and deep link presets; a sample notification (iOS); APNs (iOS) and FCM tokens; cookies (Android); hiding tools (Android); and the location spoofer state (iOS). It re-reads everything each time the tab appears.

At launch, `src/setup.ts` sets the same environment variables, servers and feature flags as ScytherExample, and the demo module seeds the same cookies, keychain items (iOS) and database records. On Android it also sets what Scizor's sample sets: an FCM token, four deep link presets, the sample's one value row of developer options, and the `user_prefs` and `app_settings` SharedPreferences.

## Differences from ScytherExample

Some differences remain on purpose, where React Native can't do the same thing without third-party native libraries, or where ScytherExample's copy doesn't fit:

- The copy is English only; ScytherExample ships a string catalog with twelve more languages.
- The map is a static view of OpenStreetMap tiles instead of an interactive MapKit map.
- Records are stored in SQLite (`Application Support/demo.sqlite` on iOS, `demo.db` on Android) instead of SwiftData.
- The accessibility audit section is iOS only, because Scizor has no audit.
- The seeded keychain API key is an obvious placeholder (`demo_api_key_1234567890abcdef`), so secret scanners don't mistake it for a real key.
- The tab icons are text glyphs instead of SF Symbols.
- The app's display name is HeracrossExample rather than Scyther Example.
- The Heracross tab is added.
- In an iOS debug build, React Native's Dev Menu takes the shake gesture, so the Home tab's disabled hint row points to the Open Scyther Menu button. Release builds keep ScytherExample's "Shake device to open menu".

## Where the code is

- `src/Root.tsx`, `src/screens/` and `src/ui/`: the app's screens and components.
- `src/setup.ts`: the launch-time Heracross configuration.
- `src/toolkit.ts`: the copy that differs between Scyther and Scizor.
- `src/native/NativeHeracrossExampleDemo.ts`: the spec for the example's own native module, implemented in `ios/HeracrossExampleDemo/` and `android/app/src/main/java/heracross/example/demo/`.
