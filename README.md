# Petanque Stats

An app for tracking petanque match statistics live during the game: points, shots, carreaux, shots at the jack (tir au but), throw distance — plus a detailed breakdown per player and per end after the match.

Built for our own team's use, and open to anyone who wants an easier way to track stats than pen and paper.

## Features

- Log throws as the match happens: team → player → throw type (point/shot) → result
- Dedicated tracking for shots at the jack, with a check for whether the jack got knocked out of bounds
- Throw distance split into three zones (short/medium/long)
- Full per-player stats: shot %, carreau %, point %, first-point %
- A visual throw grid broken down by end
- Match history with full stats available for any past game
- Backups: a full backup of everything, or a single match as its own file — which you can share with another player without losing your own saved matches
- Interface languages: русский, français, English

## How it's built

The app is written in React and packaged into a native Android app via [Capacitor](https://capacitorjs.com/). Data is stored locally on the device — no server, no account required.

```
src/
  constants.js       — colors, game formats, distance zones
  i18n/               — interface translations (ru/fr/en)
  utils/              — pure stats math and match setup helpers
  services/           — storage, export/import, share text
  components/         — reusable UI blocks
  screens/            — the logging screen and the match setup screen
```

`services/storage.js` is the only file that talks to storage. That's intentional: when stats move to a server for shared team analysis, only this file needs to change.

## Build

The APK is built automatically via GitHub Actions on every push — see `.github/workflows/`. Builds are available under [Releases](../../releases) / [Actions](../../actions).

## Status

The project is in beta 1.1. Feedback and issues are welcome.
