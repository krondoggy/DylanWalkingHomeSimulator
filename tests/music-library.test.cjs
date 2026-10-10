const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

test('music library finds supported audio, escapes filenames, and ignores folders', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'dwhs-music-'));
  try {
    const { buildMusicLibrary } = await import('../scripts/build-music-library.mjs');
    const filenames = ['Z_last.WAV', 'A song #1.mp3', 'B & friends.ogg', 'Café.m4a', 'README.md', 'not-a-song.js'];
    await Promise.all(filenames.map(filename => fs.writeFile(path.join(directory, filename), '')));
    await fs.mkdir(path.join(directory, 'nested.mp3'));

    const tracks = await buildMusicLibrary(directory);
    assert.deepEqual(tracks, [
      { title: 'A song #1', src: 'assets/music/A%20song%20%231.mp3' },
      { title: 'B & friends', src: 'assets/music/B%20%26%20friends.ogg' },
      { title: 'Café', src: 'assets/music/Caf%C3%A9.m4a' },
      { title: 'Z last', src: 'assets/music/Z_last.WAV' }
    ]);

    const context = { window: {} };
    vm.runInNewContext(await fs.readFile(path.join(directory, 'library.js'), 'utf8'), context);
    assert.deepEqual(JSON.parse(JSON.stringify(context.window.DWHS_MUSIC)), tracks);

    await Promise.all(filenames.map(filename => fs.unlink(path.join(directory, filename))));
    assert.deepEqual(await buildMusicLibrary(directory), []);
    assert.match(await fs.readFile(path.join(directory, 'library.js'), 'utf8'), /window\.DWHS_MUSIC = \[\];/);
  } finally {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('dwhs-music-'));
    await fs.rm(directory, { recursive: true, force: true });
  }
});
