# Store Manager

A point-of-sale / store management **Android app**, built with [Tauri 2](https://tauri.app) (Rust) + React + TypeScript, compiled to a native Android app via Tauri's mobile support.

## Features

- 📶 **Sync across devices on the same WiFi** — run it on multiple registers/tablets in-store and they stay in sync automatically, no internet or cloud account needed (see [LAN Sync](#lan-sync))
- 🖨️ **Receipt printing** via connected thermal printers
- 🔍 **Barcode scanning** for fast product lookup and checkout
- 🌍 **Multi-language UI** (i18next)
- 📱 **Native Android app** — small install size, fast startup, works offline
- 🔄 **In-app update checks** — the app can notify (or self-update) when a new version is out (see [Updates](#updates))
- 🔐 **License-gated access** — access can be paused for accounts that are past due (see [Licensing](#licensing--payment-lock))

## Tech stack

| Layer | Tech |
|---|---|
| App shell | Tauri 2 (Rust) — Android target |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Bundler | Vite |
| i18n | i18next / react-i18next |
| Hardware | `tauri-plugin-barcode-scanner`, `tauri-plugin-thermal-printer` |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) (stable toolchain) + Android target: `rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android`
- Android Studio (SDK + NDK) — see the [Tauri Android prerequisites guide](https://v2.tauri.app/start/prerequisites/#android)
- `ANDROID_HOME` / `NDK_HOME` environment variables set (Android Studio sets these up for you)

### Install & run (on a device/emulator)

```bash
npm install
npm run tauri android dev
```

### Build a release APK/AAB locally

```bash
npm run tauri android build
```

Output lands in `src-tauri/gen/android/app/build/outputs/`.

## Project structure

```
store-manager/
├── src/                   # React frontend
├── src-tauri/              # Rust backend / Tauri config
│   ├── src/
│   ├── gen/android/          # generated Android project (after first `android init`)
│   └── tauri.conf.json
├── public/                  # Static assets
├── docs/                    # Project docs
└── .github/workflows/       # CI: release builds
```

## LAN sync

Multiple devices on the same WiFi discover each other automatically and sync data with no internet connection or server required — see [`docs/LAN_SYNC.md`](docs/LAN_SYNC.md) for how discovery/sync works and, importantly, how sales/stock data is synced safely so two registers selling concurrently can't lose a sale.

## Distribution

This app ships as a **directly-distributed APK** (installed on client devices outside the Play Store), not through Google Play — that's what makes the license-lock feature (below) meaningful, and avoids Play Store review delays for a business tool with a small, known set of installs. See [`docs/RELEASING.md`](docs/RELEASING.md) for how a release build is produced and signed.

> If you'd rather distribute via Google Play instead, Play handles auto-updates for you and you can drop the custom updater described below — see the note at the bottom of `docs/RELEASING.md`.

## Updates

Because there's no Play Store here, the app checks a small JSON manifest on your GitHub Releases for a newer version, and if found, prompts the user to download and install the new APK. Full details in [`docs/ANDROID_UPDATES.md`](docs/ANDROID_UPDATES.md).

## Licensing / payment lock

Each install checks in with a license endpoint. If a client's subscription is inactive (unpaid, cancelled, revoked), the app shows a lock screen instead of the normal UI until access is restored — no need to touch the client's device. See [`docs/LICENSING.md`](docs/LICENSING.md) for how it works and how to mark an account as paid/unpaid.

## License

Proprietary — © bizkda. All rights reserved unless stated otherwise.