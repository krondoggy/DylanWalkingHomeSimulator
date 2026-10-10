(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const engine = window.DWHS;
  if (!engine) { $('message-text').textContent = 'WALK.EXE could not start. Please keep game-engine.js beside this page.'; return; }
  const canvas = $('game-canvas'), ctx = canvas.getContext('2d');
  const portrait = $('portrait-canvas').getContext('2d'), contactPortrait = $('npc-portrait').getContext('2d');
  const manifest = window.DWHS_ASSETS || {};
  const assets = {}, keys = new Set(), directions = new Map();
  let state = engine.createGame(), last = performance.now(), lastPaint = 0, lastHUD = 0, oldNeighborhood = state.neighborhood;
  let audio = null, musicPlaying = false, songURL = null, touchJog = false, helpPaused = false;
  let lastContact = '', lastLogs = '', messageUntil = 0;
  const names = { travis: ['TRAVIS', 'A ride. Technically in a car.', 'Request a ride', '#728c9e'], jon: ['JON', 'Cigarettes. + temporary happiness.', 'Request cigarettes', '#7a8063'], blake: ['BLAKE', 'Whataburger fries. + stamina.', 'Request fries', '#b3794f'] };
  for (const id of ['dylan', 'travis', 'jon', 'blake']) {
    if (!manifest[id]) continue;
    const img = new Image(); img.onload = () => { assets[id] = img; lastContact = ''; drawPortraits(engine.getNearbyNPC(state)); }; img.src = manifest[id];
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const text = (s, x, y, color = '#fff', size = 8, align = 'left') => { ctx.fillStyle = color; ctx.font = `${size}px "Courier New", monospace`; ctx.textAlign = align; ctx.fillText(s, Math.round(x), Math.round(y)); ctx.textAlign = 'left'; };
  const rect = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  function polygon(points, color) { ctx.fillStyle = color; ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill(); }
  function drawHead(target, id, x, y, width, height, frame = 0) {
    target.imageSmoothingEnabled = false;
    const img = assets[id];
    if (img) {
      const atlas = img.naturalWidth / img.naturalHeight > 1.7;
      if (atlas) target.drawImage(img, frame % 4 * img.naturalWidth / 4, Math.floor(frame / 4) * img.naturalHeight / 2, img.naturalWidth / 4, img.naturalHeight / 2, x, y, width, height);
      else target.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, x, y, width, height);
    } else {
      target.fillStyle = '#343642'; target.fillRect(x + width * .2, y + height * .15, width * .62, height * .68);
      target.fillStyle = '#858995'; target.fillRect(x + width * .26, y + height * .27, width * .48, height * .46);
      target.fillStyle = '#c9cbd0'; target.font = `bold ${Math.floor(width * .37)}px "Courier New"`; target.textAlign = 'center'; target.fillText(id === 'dylan' ? 'D' : '?', x + width / 2, y + height * .65); target.textAlign = 'left';
    }
  }
  function frameFor(facing) { return ({ down: 0, right: 2, up: 4, left: 6 })[facing] || 0; }
  function character(entity, camera, player = false) {
    const x = Math.round(entity.x - camera), y = Math.round(entity.y), id = player ? 'dylan' : entity.id;
    const motion = player && entity.moving ? Math.sin(state.elapsed * 15) * 2 : 0;
    const shirt = player ? '#9c8db6' : (names[id] || ['', '', '', '#777'])[3];
    rect(x - 12, y - 3, 25, 5, '#252a2c'); rect(x - 6, y - 18, 6, 15 + motion, '#303039'); rect(x + 2, y - 18, 6, 15 - motion, '#24242b');
    rect(x - 8, y - 3 + motion, 8, 3, '#deded3'); rect(x + 2, y - 3 - motion, 8, 3, '#bdbdb3');
    rect(x - 10, y - 34, 20, 21, shirt); rect(x - 13, y - 31, 4, 17 - motion, shirt); rect(x + 9, y - 31, 4, 17 + motion, shirt); rect(x - 7, y - 20, 14, 4, player ? '#807296' : '#555c67');
    if (player) { rect(x + 5, y - 13, 1, 8, '#b9b8b8'); rect(x + 3, y - 6, 3, 1, '#b9b8b8'); }
    drawHead(ctx, id, x - 16, y - 61 + Math.round(motion / 2), 33, 34, frameFor(entity.facing || 'down'));
    if (!player) {
      rect(x - 23, y - 78, 46, 12, '#141720'); rect(x - 23, y - 79, 46, 1, '#8c9190'); text(entity.name || names[id][0], x, y - 70, '#eee9ba', 8, 'center');
      if (Math.hypot(entity.x - state.player.x, entity.y - state.player.y) <= 72) { text('[E]', x, y - 86, '#fff493', 9, 'center'); }
    }
  }
  function house(x, y, width, wall, roof, number, camera) {
    x -= camera;
    rect(x + 4, y + 27, width, 48, '#25262e'); rect(x, y + 23, width, 48, wall);
    polygon([[x - 7, y + 24], [x + width / 2, y - 5], [x + width + 7, y + 24]], roof);
    polygon([[x + width / 2, y - 5], [x + width + 7, y + 24], [x + width + 7, y + 28], [x + width / 2, y]], '#282832');
    rect(x + width - 23, y, 8, 16, '#6c6061'); rect(x + 9, y + 36, 17, 16, '#d3ba70'); rect(x + 11, y + 38, 13, 12, '#bcac65'); rect(x + 17, y + 37, 2, 15, '#6f6551'); rect(x + 10, y + 44, 15, 2, '#6f6551');
    rect(x + width - 28, y + 36, 17, 16, '#c4b16c'); rect(x + width - 20, y + 36, 2, 16, '#786b54'); rect(x + width - 28, y + 43, 17, 2, '#786b54');
    rect(x + width / 2 - 7, y + 44, 15, 27, '#404248'); rect(x + width / 2 + 4, y + 57, 2, 2, '#cdc3a0'); text(number, x + width / 2, y + 40, '#d8d3bd', 6, 'center');
    rect(x + width / 2 - 10, y + 71, 21, 5, '#a1a19b'); rect(x + width / 2 - 12, y + 76, 25, 3, '#727775');
  }
  function tree(x, y, camera) { x -= camera; rect(x - 3, y - 33, 7, 34, '#53483e'); polygon([[x - 22, y - 25], [x - 17, y - 54], [x + 5, y - 66], [x + 24, y - 43], [x + 18, y - 22]], '#344d4c'); polygon([[x - 22, y - 25], [x - 17, y - 54], [x + 5, y - 66], [x - 3, y - 33]], '#49625a'); }
  function car(x, y, color, camera, occupied = false) {
    x -= camera; rect(x - 24, y + 5, 51, 6, '#24272d'); rect(x - 17, y + 2, 9, 12, '#171820'); rect(x + 12, y + 2, 9, 12, '#171820'); rect(x - 26, y - 11, 54, 17, color);
    polygon([[x - 17, y - 12], [x - 10, y - 25], [x + 13, y - 25], [x + 22, y - 11]], color); polygon([[x - 12, y - 12], [x - 7, y - 22], [x + 2, y - 22], [x + 2, y - 12]], '#627b87'); polygon([[x + 5, y - 12], [x + 5, y - 22], [x + 11, y - 22], [x + 18, y - 12]], '#496374');
    rect(x - 25, y, 5, 4, '#a85143'); rect(x + 23, y - 2, 5, 4, '#dbd5a0'); rect(x - 26, y + 5, 54, 2, '#a1a5a6'); if (occupied) drawHead(ctx, 'dylan', x - 1, y - 25, 14, 15, 2);
  }
  function drawWorld() {
    const camera = clamp(state.player.x - 250, 0, 560);
    ctx.imageSmoothingEnabled = false;
    rect(0, 0, 640, 360, '#383c54'); rect(0, 22, 640, 22, '#6b5260'); rect(0, 44, 640, 22, '#a4716e'); rect(0, 66, 640, 31, '#c69b82');
    for (let i = 0; i < 22; i++) { const x = (i * 89 - camera * .18) % 700 - 25, h = 14 + (i * 31 % 37); rect(x, 103 - h, 35 + i % 3 * 9, h, i % 2 ? '#55545f' : '#5b5863'); }
    rect(0, 97, 640, 263, '#65736a'); rect(0, 169, 640, 13, '#788476'); rect(0, 183, 640, 25, '#a4a399'); rect(0, 205, 640, 4, '#d2c9b3'); rect(0, 209, 640, 83, '#484c52'); rect(0, 291, 640, 4, '#777b79'); rect(0, 295, 640, 25, '#a7a59b'); rect(0, 320, 640, 40, '#64766a');
    for (let i = -1; i < 19; i++) { const x = i * 80 - camera % 80; rect(x, 250, 33, 3, '#b9b18a'); rect(x + 24, 185, 1, 20, '#7e847e'); rect(x + 57, 297, 1, 22, '#858981'); }
    for (let i = 0; i < 9; i++) house(18 + i * 148, 93 + i % 2 * 6, 98, ['#9a8f80', '#7f8b89', '#a09483'][i % 3], ['#56505b', '#695951'][i % 2], 104 + i * 2, camera);
    for (const x of [135, 470, 763, 1097]) tree(x, 180, camera);
    for (const x of [207, 514, 836, 1160]) { rect(x - camera, 141, 3, 61, '#414a4b'); rect(x - camera - 9, 139, 14, 4, '#44484b'); rect(x - camera - 8, 143, 6, 3, '#edcf85'); polygon([[x - camera - 8, 147], [x - camera - 32, 201], [x - camera + 20, 201]], '#ead89b16'); }
    car(363, 285, '#5b7383', camera); car(690, 229, '#8a6259', camera);
    rect(853 - camera, 104, 54, 20, '#bd8a50'); rect(875 - camera, 124, 4, 20, '#55534b'); text('FRIES', 880 - camera, 117, '#fff4c1', 10, 'center');
    rect(1080 - camera, 174, 92, 20, '#315452'); rect(1124 - camera, 194, 3, 15, '#6c6b62'); text('HOME →', 1126 - camera, 187, '#ede7c5', 11, 'center');
    const entities = state.npcs.map(n => ({ entity: n, player: false })).concat([{ entity: state.player, player: true }]).sort((a, b) => a.entity.y - b.entity.y);
    const riding = state.buffs.some(b => b.id === 'ride');
    for (const entry of entities) { if (entry.player && riding) car(state.player.x, state.player.y - 3, '#74879a', camera, true); else character(entry.entity, camera, entry.player); }
    for (let i = 0; i < 21; i++) { const x = (i * 71 - camera + 1200) % 1200; rect(x, 336 + i % 3 * 8, 2, 3, '#85917a'); }
    rect(7, 7, 165, 26, '#111926'); text('D.W.H.S. / NEIGHBORHOOD', 14, 18, '#b8c4bc', 8); text(`BLOCK ${String(state.neighborhood).padStart(3, '0')}  ·  HOME IS THIS WAY →`, 14, 28, '#e6d8a1', 7);
    rect(491, 7, 142, 17, '#111926'); text('HOME: 1.2 KM (PROBABLY)', 498, 18, '#eee0ac', 8);
    if (state.buffs.some(b => b.id === 'guilt')) { text('GUILT TRIP IN PROGRESS', 320, 346, '#f0c0bd', 9, 'center'); }
  }
  function drawPortraits(npc) {
    portrait.clearRect(0, 0, 64, 64); portrait.fillStyle = '#1c2824'; portrait.fillRect(0, 0, 64, 64); drawHead(portrait, 'dylan', 2, 2, 60, 60, 0);
    contactPortrait.clearRect(0, 0, 42, 42); contactPortrait.fillStyle = '#5d6267'; contactPortrait.fillRect(0, 0, 42, 42); drawHead(contactPortrait, npc ? npc.id : 'nobody', 2, 2, 38, 38, 0);
  }
  function message(title, body, kind = '') { $('message-title').textContent = title; $('message-text').textContent = body; document.querySelector('.message-window').className = `message-window ${kind}`; $('announcer').textContent = body; messageUntil = state.elapsed + 9; }
  function hud() {
    const npc = engine.getNearbyNPC(state), cooldown = npc ? Math.ceil(npc.cooldown || 0) : 0;
    $('stamina').value = state.stamina; $('happiness').value = state.happiness; $('stamina-value').textContent = `${Math.round(state.stamina)}%`; $('happiness-value').textContent = `${Math.round(state.happiness)}%`;
    $('steps').textContent = Math.floor(state.steps).toLocaleString(); const seconds = Math.floor(state.elapsed); $('walk-time').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    $('block-label').textContent = `BLOCK ${String(state.neighborhood).padStart(3, '0')}`; $('lap-label').textContent = `WALK ${String(state.neighborhood).padStart(3, '0')}`;
    $('activity').textContent = state.paused ? 'PAUSED' : state.buffs.some(b => b.id === 'ride') ? 'PASSENGER' : state.player.moving ? 'WALKING' : 'LOITERING';
    $('home-distance').textContent = `${(state.homeDistance / 1000).toFixed(1)} KM (PROBABLY)`;
    const contactKey = npc ? `${npc.id}:${cooldown}` : 'none';
    if (contactKey !== lastContact) {
      lastContact = contactKey; drawPortraits(npc); const entry = npc && names[npc.id];
      $('npc-name').textContent = npc ? npc.name : 'NO ONE IN RANGE'; $('npc-detail').textContent = entry ? entry[1] : 'Walk over to a nameplate.';
      $('request').textContent = npc ? cooldown ? `Try again in ${cooldown}s` : entry ? entry[2] : 'Request item' : 'Find a friend first';
      $('request').disabled = !npc || cooldown > 0 || state.paused; $('talk-mobile').disabled = state.paused;
      $('npc-status').textContent = npc ? cooldown ? `${npc.name} needs a moment. Personal space is a system requirement.` : 'Press E / Space or request below. Favors are temporary.' : 'TRAVIS: ride · JON: cigarettes\nBLAKE: Whataburger fries';
    }
    $('buffs').replaceChildren();
    if (!state.buffs.length) { const li = document.createElement('li'); li.className = 'empty-buff'; li.textContent = 'No active favors. Try asking somebody for something.'; $('buffs').append(li); }
    state.buffs.forEach(buff => { const li = document.createElement('li'), label = document.createElement('span'), time = document.createElement('time'); li.className = buff.id; label.textContent = buff.label; time.textContent = `${Math.ceil(buff.remaining)}s`; li.append(label, time); $('buffs').append(li); });
    const logs = state.logs.join('|'); if (logs !== lastLogs) { lastLogs = logs; $('log').replaceChildren(); [...state.logs].reverse().forEach(log => { const li = document.createElement('li'); li.textContent = log; $('log').append(li); }); }
    if (state.neighborhood !== oldNeighborhood) { oldNeighborhood = state.neighborhood; message('ERROR 404 — HOME NOT FOUND', 'That was definitely the wrong street. Your house is now just one more neighborhood away.', 'rejection'); $('feed-status').textContent = 'Route recalculated. Again.'; }
    if (state.elapsed > messageUntil) { $('status-text').textContent = npc ? `In range: ${npc.name}. Friendship services available.` : 'Destination unresolved. Keep walking.'; }
  }
  function request() {
    if (state.paused) return;
    const npc = engine.getNearbyNPC(state);
    if (!npc) { message('FRIENDSHIP SERVICE — OUT OF RANGE', 'Walk up to TRAVIS, JON, or BLAKE first. They cannot hear requests from across the neighborhood.'); return; }
    const result = engine.requestItem(state, npc.id);
    message(result.ok ? `FAVOR RECEIVED — ${npc.name}` : `REQUEST DECLINED — ${npc.name}`, result.message, result.ok ? 'success' : 'rejection');
    $('feed-status').textContent = result.ok ? `${npc.name} has temporarily improved the situation.` : 'Friendship bandwidth exceeded.'; lastContact = ''; hud();
  }
  function clearInput() { keys.clear(); directions.clear(); touchJog = false; document.querySelectorAll('.held').forEach(el => el.classList.remove('held')); }
  function setPaused(value) { state.paused = value; clearInput(); $('pause-overlay').hidden = !value; $('pause').textContent = value ? 'Resume' : 'Pause'; lastContact = ''; hud(); }
  function reset() { state = engine.createGame(); oldNeighborhood = state.neighborhood; lastContact = ''; lastLogs = ''; messageUntil = 9; $('pause-overlay').hidden = true; $('pause').textContent = 'Pause'; clearInput(); message('HOME.EXE — FRESH OPTIMISM', 'A brand-new walk. This time you are definitely going to make it home.'); $('feed-status').textContent = 'New walk initialized. Confidence restored.'; hud(); canvas.focus({ preventScroll: true }); }
  function openHelp() { helpPaused = state.paused; setPaused(true); $('help-dialog').showModal(); }
  $('help-dialog').addEventListener('close', () => setPaused(helpPaused));
  $('help').addEventListener('click', openHelp); $('help-title').addEventListener('click', openHelp); $('pause').addEventListener('click', () => setPaused(!state.paused)); $('resume').addEventListener('click', () => setPaused(false)); $('new-walk').addEventListener('click', reset); $('request').addEventListener('click', request); $('talk-mobile').addEventListener('click', request);
  window.addEventListener('keydown', event => {
    if (event.target.matches('input, textarea, select') || $('help-dialog').open) return;
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'shift'].includes(key)) { event.preventDefault(); keys.add(key); }
    if (event.repeat) return;
    if (key === 'e' || (key === ' ' && !event.target.closest('button, a, summary'))) { event.preventDefault(); request(); }
    if (key === 'p' || key === 'escape') { event.preventDefault(); setPaused(!state.paused); }
  });
  window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase())); window.addEventListener('blur', clearInput);
  for (const button of document.querySelectorAll('[data-direction], #jog')) {
    button.addEventListener('pointerdown', event => { event.preventDefault(); if (state.paused) return; button.setPointerCapture(event.pointerId); button.classList.add('held'); if (button.id === 'jog') touchJog = true; else directions.set(event.pointerId, button.dataset.direction); });
    const release = event => { directions.delete(event.pointerId); if (button.id === 'jog') touchJog = false; button.classList.remove('held'); };
    button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release); button.addEventListener('contextmenu', e => e.preventDefault());
  }
  function loadSong(source, label) { if (audio) audio.pause(); audio = new Audio(source); audio.loop = true; musicPlaying = false; $('music').disabled = false; $('music').textContent = 'Play music'; $('song-name').textContent = label; audio.addEventListener('error', () => { musicPlaying = false; $('music').textContent = 'Track unavailable'; $('song-name').textContent = 'Choose another audio file.'; }); }
  $('music').addEventListener('click', async () => { if (!audio) return; if (musicPlaying) { audio.pause(); musicPlaying = false; } else { try { await audio.play(); musicPlaying = true; } catch { $('song-name').textContent = 'Audio could not play. Try another file.'; } } $('music').textContent = musicPlaying ? 'Pause music' : 'Play music'; });
  $('load-song').addEventListener('click', () => $('song-file').click());
  $('song-file').addEventListener('change', event => { const file = event.target.files[0]; if (!file) return; if (songURL) URL.revokeObjectURL(songURL); songURL = URL.createObjectURL(file); loadSong(songURL, file.name); });
  if (manifest.song) loadSong(manifest.song, 'Neighborhood soundtrack loaded.');
  document.addEventListener('visibilitychange', () => { last = performance.now(); clearInput(); if (document.hidden && !state.paused) setPaused(true); });
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!document.hidden) {
      const held = new Set(directions.values());
      const x = Number(keys.has('d') || keys.has('arrowright') || held.has('right')) - Number(keys.has('a') || keys.has('arrowleft') || held.has('left'));
      const y = Number(keys.has('s') || keys.has('arrowdown') || held.has('down')) - Number(keys.has('w') || keys.has('arrowup') || held.has('up'));
      engine.update(state, dt, { x, y, sprint: keys.has('shift') || touchJog });
      if (now - lastPaint >= 1000 / 60 - .5) { drawWorld(); lastPaint = now; }
      if (now - lastHUD > 130) { hud(); lastHUD = now; }
    }
    requestAnimationFrame(frame);
  }
  window.DWHS_UI = { getState: () => state, request, setPaused, reset };
  drawPortraits(null); hud(); drawWorld(); requestAnimationFrame(frame);
})();
