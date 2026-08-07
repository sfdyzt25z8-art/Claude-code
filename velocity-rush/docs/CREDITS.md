# Credits & Attributions

## Engine & tooling

- [Phaser 3](https://phaser.io/) — MIT License. The 2D game framework powering rendering, scenes, input, physics (Arcade), particles, and the Light2D pipeline.
- [Vite](https://vitejs.dev/) — MIT License. Build tool and dev server.
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) — MIT License. Generates the PWA manifest and service worker.
- [TypeScript](https://www.typescriptlang.org/) — Apache 2.0 License.

## Art assets

**None.** Every visual in Velocity Rush — car bodies, wheels, decorations (trees, buildings, cacti, rocks, ...), obstacles (cones, barriers, crates, barrels, puddles, signposts), particles, UI chrome, and icons — is generated procedurally at runtime from vector shapes (`src/assets/ProceduralTextures.ts`) using Phaser's `Graphics` API and the Canvas 2D API (for the one radial-gradient vignette). Nothing was imported, downloaded, or traced from an external source.

## Audio assets

**None.** Every sound — engine notes (per car, driven by a profile of waveform/frequency/growl/turbo-whine), tire screech, drift loop, crash impacts, nitro whoosh, UI chimes, the achievement fanfare, the generative background music, and weather ambience — is synthesised in real time with the Web Audio API (`src/audio/`). No audio files were recorded, licensed, or downloaded.

## Fonts

System UI font stack (`'Segoe UI', Roboto, system-ui, -apple-system, sans-serif`) — no web fonts are downloaded, keeping load times minimal and avoiding any font-licensing questions.

## Car and track names

All 20 car names/manufacturers (e.g. "Nomad Runner", "Celestia Omega") and all 15 track names (e.g. "Downtown Circuit", "Redrock Canyon") are original names invented for this game. Any resemblance to real vehicles, manufacturers, or locations is coincidental — none are modeled on or intended to represent real-world trademarks.

## Emoji

A small number of standard Unicode emoji are used as lightweight icons in menus (🏁 🚗 🏆 ⚙ etc.), rendered by the operating system/browser's built-in emoji font — no emoji image assets are bundled.
