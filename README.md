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

## Add music

**Drop your music files into `assets/music/`.** This folder is beside the character artwork in the repository. It accepts `.mp3`, `.ogg`, `.wav`, and `.m4a`; MP3 is a convenient choice for phones.

From the repository folder, run:

```sh
npm run music
```

The command updates `assets/music/library.js` with every supported song in that folder. Filenames become track titles, with underscores changed to spaces. No manual manifest editing or package installation is needed. Run it again whenever you add, rename, or remove songs. Subfolders are not scanned.

Preview with `npm start`, then commit and push the audio files and `library.js` to `codex/initial-game`. GitHub Pages updates the live game automatically.

The soundtrack starts with the game at 50% volume and plays the playlist continuously, returning to the first song after the last one. If a browser blocks autoplay, the first tap or keypress starts the music. The music button mutes or unmutes playback; the game has no drive picker or upload control.

## Character artwork

`assets/characters.js` exposes `window.DWHS_ASSETS`. All paths are relative to the HTML files at the project root.

| Asset | Current state | Expected format |
| --- | --- | --- |
| Dylan | `assets/head-turntable.png` | 4-column × 2-row head-turn atlas, 1774 × 887 pixels |
| Travis | `assets/travis-turntable.png` | 4-column × 2-row head-turn atlas matching Dylan |
| Jon | `assets/jon-turntable.png` | 4-column × 2-row head-turn atlas matching Dylan |
| Blake | `assets/blake-turntable.png` | 4-column × 2-row head-turn atlas matching Dylan |

The NPC portraits use the supplied photos in the same faceted, dithered style as Dylan. To replace an atlas later, update its path in `assets/characters.js`. Keep eight equal-sized frames in left-to-right, top-to-bottom order, with a transparent background.

## Project files

- `index.html` — original import-screen entry point and simulator launch button.
- `game.html` — mobile-friendly game interface.
- `game-engine.js` — classic JavaScript game rules exposed through `window.DWHS` in the browser.
- `game.js` — game rendering, controls, and interface.
- `assets/characters.js` — replaceable character artwork paths.
- `assets/music/` — drop soundtrack files here.
- `assets/music/library.js` — generated playlist used by the game.
- `scripts/build-music-library.mjs` — scans the music folder when you run `npm run music`.
- `preview.mjs` — local static server, bound to this machine only.
- `tests/` — focused game-rule checks.

Run the checks with `npm test`. No package installation is needed.

This repository is a standalone copy. The earlier mainframe page in the PulserDAW repository remains separate.
