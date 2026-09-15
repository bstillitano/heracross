# Changelog

Heracross is released on GitHub. Install a release by its tag: `npm install github:bstillitano/heracross#vX.Y.Z`.

## Unreleased

### Added

- `featureFlags.getAll()`, `featureFlags.getOverride(key)` and `featureFlags.getOverridesEnabled()` read every registered flag, a flag's stored override, and the "Enable overrides" switch.
- `servers.getAll()` reads every configured environment.
- `getEnvironmentVariables()` reads back the Environment Variables screen's rows.
- `isMenuOpen()` reports whether the debug menu is open.
- `isAvailable` reports whether the native module is in the build. When it isn't, every call does nothing and every read resolves an empty value, instead of the import throwing.
- The README's Debug-only builds section: React Native 0.87's autolinking can't leave Heracross out of release builds on iOS or Android.
- `supports` reports which platform-specific features work on the current platform.
- `heracross/jest`, a Jest mock of the whole API.
- The example app's Heracross tab, which calls every API.

### Fixed

- **Yarn 4:** installing from GitHub now builds `lib/` (a `prepack` script), so the package can be imported.
- **Android:** override, reset and `servers.select` calls made before `start()` were silently dropped. They are now applied once Scizor starts, and starting no longer reports Scizor's saved state as changes.
- **iOS:** `servers.configure` now selects the first environment when the saved one isn't in the list, as Android does, and `servers.getSelected()` falls back to the first environment when Scyther's saved id isn't registered.
- **iOS and Android:** a flag override made right after registering the flag, or a `servers.select` made right after `configure`, now fires a change event.
- **iOS:** change checks now run only for writes to Scyther's settings, not every `UserDefaults` write in the app.
- **Android:** a module that React has torn down no longer emits events, and change events reach every React instance in the process.
- **Android:** a server picked in Scizor's menu is reported when the menu closes, rather than when the app next resumes.
- Array parameters accept readonly arrays. Push token setters convert their argument to text. Rows, presets, cookies, flags and environments missing a required field are skipped with a development warning, and values that aren't strings, numbers or booleans are left out instead of sent as `""` or `"[object Object]"`.

### Changed

- The package is marked `private`, so it can't be published to npm by accident. Installing from GitHub is unaffected.

## v0.1.0

The first release: one React Native API over Scyther on iOS and Scizor on Android. See the [release notes](https://github.com/bstillitano/heracross/releases/tag/v0.1.0).
