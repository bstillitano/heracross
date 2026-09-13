# Contributing

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project. Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

## Development workflow

This project is a monorepo managed using [Yarn workspaces](https://yarnpkg.com/features/workspaces). It contains the following packages:

- The library package in the root directory.
- An example app in the `example/` directory.

To get started with the project, make sure you have the correct version of [Node.js](https://nodejs.org/) installed. See the [`.nvmrc`](./.nvmrc) file for the version used in this project.

Run `yarn` in the root directory to install the required dependencies for each package:

```sh
yarn
```

> Since the project relies on Yarn workspaces, you cannot use [`npm`](https://github.com/npm/cli) for development without manually migrating.

The [example app](/example/) demonstrates usage of the library. You need to run it to test any changes you make.

It is configured to use the local version of the library, so any changes you make to the library's source code will be reflected in the example app. Changes to the library's JavaScript code will be reflected in the example app without a rebuild, but native code changes will require a rebuild of the example app.

To edit the native code:

- **iOS:** run `yarn example spm` once, then open `example/ios/HeracrossExample.xcodeproj` in Xcode and find the library's Swift and Objective-C++ sources under `Package Dependencies` → `Heracross`. There is no Podfile: the library ships Swift Package Manager support only.
- **Android:** open `example/android` in Android Studio and find the library's Kotlin sources under `heracross` → `java/com/heracross`.

You can use various commands from the root directory to work with the project.

To start the packager:

```sh
yarn example start
```

To run the example app on Android:

```sh
yarn example android
```

To run the example app on iOS, inject the Swift packages, open the project in Xcode, and run the `HeracrossExample` scheme:

```sh
yarn example spm
yarn example ios
```

To confirm that the app is running with the new architecture, you can check the Metro logs for a message like this:

```sh
Running "HeracrossExample" with {"fabric":true,"initialProps":{"concurrentRoot":true},"rootTag":1}
```

Note the `"fabric":true` and `"concurrentRoot":true` properties.

Make sure your code passes TypeScript:

```sh
yarn typecheck
```

Remember to add tests for your change if possible. Run the JavaScript unit tests by:

```sh
yarn test
```

The native code keeps its logic, such as reading what JavaScript sends and working out change events, in small units with their own tests: `ios/Tests` in Swift and `android/src/test` in Kotlin. Run them by:

```sh
yarn test:ios
yarn test:android
```

`yarn test:ios` uses the booted simulator, or an iPhone on the newest iOS runtime. It sets `HERACROSS_TESTS=1`, which lets `ios/Package.swift` resolve outside an app by leaving out the React Native packages and the Turbo Module target. `yarn test:android` needs `ANDROID_HOME` set, as any build of the example does.

The React Native patch exists twice: `.yarn/patches/` for this repository and `patches/` for apps that use patch-package. Keep the two in step when you change it.

### Scripts

The root `package.json` contains scripts for common tasks:

- `yarn`: set up the project by installing dependencies.
- `yarn typecheck`: type-check the library and the example with TypeScript.
- `yarn test`: run the unit tests with [Jest](https://jestjs.io/).
- `yarn test:ios` and `yarn test:android`: run the Swift and Kotlin unit tests.
- `yarn prepare`: build the library into `lib/` with react-native-builder-bob.
- `yarn clean`: delete build output.
- `yarn example start`: start the Metro server for the example app.
- `yarn example android`: build and run the example app on Android.
- `yarn example spm`: inject React Native's Swift packages into the example's Xcode project.
- `yarn example ios`: open the example's Xcode project.
- `yarn example build:android`, `yarn example build:ios` and `yarn example build:ios:release`: build the example app without running it.

### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that `yarn typecheck`, `yarn test`, `yarn test:ios` and `yarn test:android` pass, and that the example app builds on both platforms.
- Review the documentation to make sure it looks good.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.
