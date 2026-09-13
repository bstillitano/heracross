# Heracross Example

The Heracross example app: a React Native port of Scyther's example app that exercises Heracross on iOS and Android. The root [README](../README.md#example-app) describes what it shows, and [CONTRIBUTING](../CONTRIBUTING.md) covers the development workflow.

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

## Where the code is

- `src/Root.tsx`, `src/screens/` and `src/ui/`: the app's screens and components.
- `src/setup.ts`: the launch-time Heracross configuration.
- `src/native/NativeHeracrossExampleDemo.ts`: the spec for the example's own native module, implemented in `ios/HeracrossExampleDemo/` and `android/app/src/main/java/heracross/example/demo/`.
