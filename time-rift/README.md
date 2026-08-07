# TIME RIFT

A 2D action-puzzle platformer built around a single mechanic: every time you restart a
level, your previous attempt becomes a translucent **time clone** that repeats your exact
actions, in real time, from the start. Use your past selves to hold switches, fight
enemies, or clear a path while you take a different route to the portal.

Vanilla HTML/CSS/JS and the Canvas API — no build step, no frameworks, no external art or
audio assets (sound is synthesized at runtime with the Web Audio API). Just open
`index.html` in a browser.

## Play

Open `index.html` directly, or serve the folder with any static file server:

```
npx http-server time-rift -p 8080
```

## Controls

| Action | Key |
| --- | --- |
| Move | `A` / `D` |
| Jump | `W` or `Space` |
| Attack | `J` |
| Interact | `E` |
| Restart level (spawns a clone) | `R` |
| Pause | `Esc` |

Touch controls appear automatically on phones/tablets.

## How the clone system works

Rather than recording positions, the game records the player's raw **input** every fixed
physics tick (60Hz) — a few bits for left/right/jump/attack/interact. On restart, that
input buffer becomes a `Clone`, which is stepped through the exact same physics/collision
code as the live `Player`. Because the simulation is deterministic (fixed timestep, and
every moving hazard/platform derives its position from elapsed run time), replaying the
same inputs reproduces the same movement, jumps, attacks, and switch/portal interactions —
a genuine replay, not a scripted animation. Clones are immune to damage (so they can't
desync from taking hits) but their attacks still land on enemies, and they still trip
pressure switches just by standing on them.

## Structure

```
index.html / css/style.css      shell + neon/dark UI theme
js/storage/SaveSystem.js        localStorage wrapper (falls back to memory)
js/audio/AudioManager.js        synthesized SFX + ambient music
js/game/Particles.js            pooled particle effects
js/game/Input.js                keyboard + touch input, shared by live play and recording
js/game/Physics.js              constants + AABB collision resolution
js/game/Entity.js               shared physics step for Player/Clone/Enemy
js/game/Player.js               live player: records input, attacks, takes damage
js/game/Clone.js                replays a recorded input buffer through the same physics
js/game/Enemy.js                Walker / Chaser / Guardian AI
js/game/Level.js                runtime level: platforms, hazards, switches, doors, portal
js/levels/levelData.js          10 level definitions
js/ui/UIManager.js              menu, level select, HUD, pause, game over, victory screens
js/game/Game.js                 state machine + fixed-timestep loop + camera
js/main.js                      bootstrap
```

## The 10 levels

1. **The Beginning** — movement, jumping, a gap to cross
2. **The Button** — a clone holds a pressure switch so you can walk through its door
3. **Two Doors** — two switches, two clones
4. **Laser Room** — blinking laser hazards
5. **Moving Platforms** — timed platform crossings
6. **Combat** — Walker and Chaser enemies
7. **Clone Combat** — a clone's recorded attack clears a Guardian for you
8. **Multiple Paths** — a wider level with several switches to plan across runs
9. **Time Collapse** — moving hazards and a limited number of restarts
10. **The Rift** — every mechanic combined in a final wide level

Progress (unlocked/completed levels, best times, settings) is saved to `localStorage` and
survives a refresh; if storage is unavailable the game still runs, it just won't persist.
