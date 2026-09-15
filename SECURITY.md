# Security Policy

## Supported versions

Security fixes go into the latest release. Heracross is pre-1.0, so older releases aren't patched; upgrade to the latest tag.

| Version | Supported |
|---|---|
| Latest release | ✓ |
| Older releases | — |

## Reporting a vulnerability

Please email b.stillitano95@gmail.com rather than opening a public issue. Include the Heracross version, the platform, and the steps to reproduce.

A vulnerability in the toolkits Heracross wraps belongs with them: [Scyther](https://github.com/bstillitano/Scyther) for iOS and [Scizor](https://github.com/bstillitano/scizor) for Android.

## Using Heracross safely

Heracross exposes a debug menu that can show network traffic, preferences, cookies and keychain or keystore contents. Both toolkits refuse to start in store builds unless you pass `allowProductionBuilds`. See [Production Safety](README.md#production-safety) before shipping a build with the menu enabled.
