# Drop music files here

Put your `.mp3`, `.ogg`, `.wav`, or `.m4a` files directly in this folder.
MP3 is a convenient choice for mobile browsers.

Then, from the repository folder, run:

```sh
npm run music
```

This refreshes `library.js`, which tells the game which songs are available.
You do not need to edit that generated file by hand. Filenames become track titles;
underscores become spaces. Subfolders are not scanned.

Preview with `npm start`, then commit and push the songs and updated `library.js`
to `codex/initial-game`. GitHub Pages will update the live game.

The soundtrack starts with the game at 50% volume. The playlist loops continuously,
returning to the first song after the last one. If a browser blocks autoplay,
the first tap or keypress starts the music. The music button mutes or unmutes
playback. There is no upload or drive picker in the game.
