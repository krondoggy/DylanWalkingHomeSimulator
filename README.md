# D.W.H.S. — Dylan Walking Home Simulator

A tiny, deliberately unwinnable walking game inside a late-80s / 90s computer interface. Import D.Y.L.A.N., open the simulator, and start the journey home. Home keeps finding somewhere else to be.

## Play online

[Launch D.W.H.S. on GitHub Pages](https://krondoggy.github.io/DylanWalkingHomeSimulator/).

GitHub Pages publishes the repository root from `codex/initial-game`. Pushes to that branch automatically update the site. The `.nojekyll` file keeps the static HTML, CSS, JavaScript, and character assets intact without a build step.

## Play locally

Requires Node.js for the preview server and automated checks. The game itself is plain HTML, CSS, and JavaScript with no build step or dependencies.

```sh
npm start
```

Open <http://127.0.0.1:4174/>. `index.html` is the import utility; `game.html` opens the game directly.

Use the on-screen direction pad on mobile, or WASD / arrow keys on desktop. Hold Jog / Shift to move faster. Approach an NPC and press Talk / Request, E, or Space. Travis offers a brief car ride, Jon offers a brief happiness boost, and Blake offers a brief stamina boost. Repeated requests can be declined, causing a short guilt slowdown. The road loops forever; the joke is the journey.

## Character artwork and music

`assets/characters.js` exposes `window.DWHS_ASSETS`. All paths are relative to the HTML files at the project root.

| Asset | Current state | Expected format |
| --- | --- | --- |
| Dylan | `assets/head-turntable.png` | 4-column × 2-row head-turn atlas, 1774 × 887 pixels |
| Travis | `null` — photo pending | 4-column × 2-row head-turn atlas matching Dylan |
| Jon | `null` — photo pending | 4-column × 2-row head-turn atlas matching Dylan |
| Blake | `null` — photo pending | 4-column × 2-row head-turn atlas matching Dylan |
| Song | `null` — audio pending | Browser-supported audio, such as MP3, WAV, or OGG |

The NPC photos will be adapted into the same faceted, dithered character style as Dylan. Their final artwork has not been created yet. Until then, their entries stay `null` and the game uses its fallback presentation.

To add completed assets, place them in `assets/` and replace their `null` values with paths, for example `travis: 'assets/travis-turntable.png'` and `song: 'assets/song.mp3'`. Keep the eight frames in left-to-right, top-to-bottom order. The game also has a **Load song…** control to choose audio from your device for that session. Music starts when you press **Play music**.

## Project files

- `index.html` — original import-screen entry point and simulator launch button.
- `game.html` — mobile-friendly game interface.
- `game-engine.js` — classic JavaScript game rules exposed through `window.DWHS` in the browser.
- `game.js` — game rendering, controls, and interface.
- `assets/characters.js` — replaceable character and music paths.
- `preview.mjs` — local static server, bound to this machine only.
- `tests/` — focused game-rule checks.

Run the checks with `npm test`. No package installation is needed.

This repository is a standalone copy. The earlier mainframe page in the PulserDAW repository remains separate.
