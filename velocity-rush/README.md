# Velocity Rush

A modern arcade car racing game built entirely with **Phaser 3 + TypeScript + Vite**. No external art or audio files — every sprite is a vector shape rasterised at boot, and every sound (engines, tire screech, nitro, music) is synthesised live with the Web Audio API. Runs in the browser, installs as a PWA, and plays with keyboard, touch, or a gamepad.

![status](https://img.shields.io/badge/status-playable-brightgreen) ![engine](https://img.shields.io/badge/engine-Phaser%203-blueviolet) ![lang](https://img.shields.io/badge/language-TypeScript-blue)

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

See [`docs/INSTALL.md`](docs/INSTALL.md) for full setup, [`docs/BUILD.md`](docs/BUILD.md) for production builds, and [`docs/DEPLOY.md`](docs/DEPLOY.md) for hosting.

## What's here

- **20 unique cars** across 7 classes (starter → hyper), each with its own stats, unlock requirement, and synthesised engine sound profile — [`src/cars`](src/cars).
- **15 original tracks** across every requested theme (city, desert, forest, mountains, beach, snow, volcano, night city, highway, industrial, canyon, harbor, airport, stadium, countryside), procedurally generated from hand-tuned shape parameters with obstacles, jumps, and shortcut zones — [`src/tracks`](src/tracks).
- **Arcade vehicle physics** with acceleration/braking curves, a heading/velocity-separation drift model, jumps with air time, collision response, and off-track/puddle grip penalties — [`src/physics`](src/physics).
- **AI racers** that follow a computed racing line, brake for corners, avoid obstacles, overtake/defend, use nitro tactically, and recover from being stuck — [`src/ai`](src/ai).
- **11 game modes**: Career, Quick Race, Time Trial, Drift, Checkpoint, Endless Highway, Elimination, Tournament, Police Chase, Test Drive, and Multiplayer (see [Multiplayer scope](#multiplayer-scope) below) — [`src/engine/RaceTypes.ts`](src/engine/RaceTypes.ts).
- **Full progression loop**: coins, XP, levels 1–100, achievements, daily login rewards, rotating daily missions, and a weekly challenge — [`src/economy`](src/economy).
- **Garage**: 9 upgrade categories (5 tiers each) that visibly change performance, and 12 customization slots (paint, decals, wheels, spoiler, hood, body kit, window tint, neon, underglow, exhaust, plate, suspension height) — [`src/upgrades`](src/upgrades), [`src/customization`](src/customization).
- **Procedural audio**: per-car synthesised engine notes, tire screech, drift loop, crashes, nitro, a generative music/ambience system, and weather ambience — [`src/audio`](src/audio).
- **Weather & time of day** per track (clear/rain/snow/fog/sandstorm, day/dusk/night) with particle effects and — on night tracks — real dynamic 2D lighting via Phaser's Light2D pipeline.
- **Controls**: keyboard (WASD, Space, Shift, R), on-screen touch controls (steering wheel, pedals, handbrake, nitro), and gamepad support, unified by [`src/ui/InputManager.ts`](src/ui/InputManager.ts).
- **Save system**: everything (cars, coins, XP, unlocks, settings, statistics, career progress) auto-saves to `localStorage`, debounced and flushed on tab hide/unload — [`src/save`](src/save).
- **PWA**: installable, offline-capable via `vite-plugin-pwa`.

## Controls

| Action | Keyboard | Touch | Gamepad |
| --- | --- | --- | --- |
| Accelerate | `W` | Gas pedal | Right trigger |
| Brake / Reverse | `S` | Brake pedal | Left trigger |
| Steer | `A` / `D` | Steering wheel (drag) | Left stick |
| Handbrake | `Space` | E-Brake button | A / Cross |
| Nitro | `Shift` | Nitro button | B / Circle or right bumper |
| Reset to track | `R` | — | Y / Triangle |
| Pause | `Esc` | — | — |

## Architecture

```
src/
  ai/             AI racing-line following, obstacle avoidance, tactics
  assets/         Procedural texture generation (no image files)
  audio/          Web Audio synth engine, SFX, generative music
  cars/           Car data (20 cars) + stat/upgrade math
  customization/  Cosmetic slots, data, purchase/apply logic
  economy/        Coins/XP/levels, achievements, daily/weekly rewards
  engine/         Phaser game config, race config types, career ladder
  multiplayer/    Transport-agnostic network interface + local mock client
  physics/        Vehicle simulation + collision resolution
  save/           localStorage-backed save & settings persistence
  scenes/         Every Phaser scene (menus, garage, race, results, ...)
  tracks/         Track data (15 tracks), geometry queries, rendering
  ui/             Reusable UI widgets (buttons, panels, HUD, touch controls)
  upgrades/       Upgrade categories/tiers + purchase logic
  utils/          Math, RNG, event bus, storage helpers, constants
```

Each domain is a self-contained module with a clear boundary: `physics` and `tracks/TrackGeometry` have zero Phaser dependency (pure logic, easy to unit test), while `scenes` and `ui` are the only layers that touch Phaser's rendering API directly.

## Design decisions worth knowing about

Velocity Rush is a **top-down arcade racer** — Phaser 3 is a 2D engine, so rather than fake a 3D look with a shaky pseudo-perspective, the game leans fully into a clean top-down style (in the tradition of classics like Micro Machines / RC Pro-Am), which plays better and stays crisp at any resolution.

A few requested features are implemented as honest, functional approximations given that constraint:

- **"HD graphics" / assets** — there are no bundled image or audio files. Every car, obstacle, and decoration is a small vector shape rasterised once at boot (see [`src/assets/ProceduralTextures.ts`](src/assets/ProceduralTextures.ts)); every sound is synthesised live (see [`src/audio`](src/audio)). This keeps the game's install size tiny and makes re-skinning trivial, at the cost of not having hand-painted art.
- **Motion blur** — approximated with fading "ghost" afterimages of the car at high speed/nitro, since Phaser 3 has no built-in motion-blur post-effect.
- **Dynamic lighting / day-night** — each track has a fixed time of day (day/dusk/night); night tracks use Phaser's real Light2D pipeline for actual dynamic lighting (headlight-style glow following the car). There's no continuous in-race day→night cycle.

### Multiplayer scope

"Multiplayer-ready architecture" is implemented as a strict, transport-agnostic `NetworkClient` interface ([`src/multiplayer/NetworkTypes.ts`](src/multiplayer/NetworkTypes.ts)) with a fully working `MockMultiplayerClient` — real rooms, ready-up, countdown, chat, and live position snapshots, backed by local simulation instead of a server. The Multiplayer scene exercises the entire flow end-to-end today; wiring in a real backend (WebSocket/WebRTC) later means writing one new class against the same interface — nothing else in the game needs to change. When a "match" starts, it launches the same single-player race engine with bot opponents standing in for the other room members, since there's no live server in this build.

## Documentation

- [Installation guide](docs/INSTALL.md)
- [Build instructions](docs/BUILD.md)
- [Deployment guide](docs/DEPLOY.md)
- [Asset & tooling credits](docs/CREDITS.md)

## Tech stack

Phaser 3 · TypeScript · Vite · vite-plugin-pwa — no other runtime dependencies.
