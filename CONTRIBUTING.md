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

`yarn test:ios` needs an iOS 16 or later simulator, the minimum in `ios/Package.swift`: it uses a booted one, or an iPhone on the newest iOS runtime. `node scripts/test-ios.js --list` prints the simulator it would pick without running the tests. It sets `HERACROSS_TESTS=1`, which lets `ios/Package.swift` resolve outside an app by leaving out the React Native packages and the Turbo Module target. `yarn test:android` needs `ANDROID_HOME` set, as any build of the example does.

The React Native patch exists twice: `.yarn/patches/` for this repository and `patches/` for apps that use patch-package. Keep the two in step when you change it, and check them with:

```sh
node scripts/check-patches.js
```

It fails if the two patches change different lines, or if either file or the Yarn resolution is not for the React Native version in `package.json`. CI runs it too.

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
- `yarn example build:android`, `yarn example build:ios` and `yarn example build:ios:release`: build the example app without running it. `yarn example build:android --mode Release` builds the Android release variant.
- `node scripts/check-patches.js`: check that the two copies of the React Native patch match.

### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that `yarn typecheck`, `yarn test`, `yarn test:ios` and `yarn test:android` pass, and that the example app builds on both platforms.
- Review the documentation to make sure it looks good.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.

## Releasing

Heracross is released on GitHub only; it is not published to npm. Apps install a release by its tag.

1. Bump `version` in `package.json`.
2. In `README.md`, update the tag in the install command (`github:bstillitano/heracross#vX.Y.Z`) and the Heracross row of the Versioning table.
3. Add an entry for the version to `CHANGELOG.md`.
4. Commit and push to `main`, then wait for CI to pass on that exact commit:

   ```sh
   gh run list --commit <sha>
   gh run watch <run-id> --exit-status
   ```

5. Tag that commit with an annotated tag and push the tag:

   ```sh
   git tag -a vX.Y.Z <sha> -m "vX.Y.Z"
   git push origin vX.Y.Z
   ```

6. Create the GitHub release from the tag, with the changelog entry as its notes:

   ```sh
   gh release create vX.Y.Z --target <sha> --verify-tag --title vX.Y.Z --notes-file <notes.md>
   ```

### Updating Scyther or Scizor

- **Scyther:** change the version in the `Scyther` package entry in `ios/Package.swift`. It is pinned with `.upToNextMinor(from:)`, so a new minor version needs the manifest changed.
- **Scizor:** change `com.github.bstillitano:scizor` in `android/build.gradle`, and the OkHttp version aligned with it there if Scizor's OkHttp changed.
- Update the Scyther and Scizor rows of the Versioning table and the Scizor dependency line in `README.md`, then run `yarn test:ios`, `yarn test:android` and both example builds.

### Updating React Native

The React Native patch is made for one React Native version, and both copies have the version in their names. On a React Native bump:

1. Change `react-native` and the `@react-native/*` packages in the root and `example/package.json`, and `@react-native-community/cli*` in `example/package.json` if the new version needs it.
2. Remove the old `react-native@npm:<old version>` entry from `resolutions` in the root `package.json`, delete the old patch in `.yarn/patches/`, and run `yarn`.
3. Regenerate the Yarn patch. `yarn patch react-native` prints a folder to edit; make the change there, then run `yarn patch-commit -s <folder>`. That writes `.yarn/patches/react-native-npm-<version>-<hash>.patch` and adds the `react-native@npm:<version>` resolution pointing at it.
4. Regenerate the patch-package copy as `patches/react-native+<version>.patch`, deleting the old one. It makes the same change with patch-package's paths: `a/node_modules/react-native/...` and `b/node_modules/react-native/...`, without the `index` line.
5. Run `node scripts/check-patches.js`, then update the patch file name and the tested React Native version in `README.md`.
