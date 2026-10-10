(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const canvas = $('head-canvas');
  const ctx = canvas.getContext('2d');
  const image = new Image();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stageDuration = 4200;
  const stages = ['Reading human source data...', 'Mapping facial geometry...', 'Converting analog memories...', 'Allocating personality sectors...', 'Transferring consciousness...', 'Rebuilding digital identity...', 'Checking existential integrity...', 'Recalibrating. Please stand by...'];
  let paused = false;
  let sound = false;
  let audio;
  let elapsed = 0;
  let lastTime = performance.now();
  let lastFrame = -1;
  let lastStage = -1;
  let lastPass = -1;
  let lastPercent = -1;
  let imageReady = false;
  let grid = true;
  let scan = true;

  function drawHead(frame) {
    if (!ctx || !imageReady) return;
    ctx.clearRect(0, 0, 160, 160);
    ctx.imageSmoothingEnabled = false;
    const width = image.naturalWidth / 4;
    const height = image.naturalHeight / 2;
    ctx.drawImage(image, (frame % 4) * width, Math.floor(frame / 4) * height, width, height, 0, 0, 160, 160);
    $('rotation-label').textContent = `ROT: ${String(frame * 45).padStart(3, '0')}°`;
  }

  function beep() {
    if (!sound) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audio ||= new Audio();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'square';
      osc.frequency.value = 500;
      gain.gain.setValueAtTime(.025, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .06);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + .06);
    } catch { /* Sound is optional. */ }
  }

  function updateDisplay() {
    const total = stages.length * stageDuration;
    const cycle = Math.floor(elapsed / total);
    const within = elapsed % total;
    const stage = Math.floor(within / stageDuration);
    const fraction = (within % stageDuration) / stageDuration;
    const percent = Math.floor(fraction * 100);
    const frame = reducedMotion.matches ? 0 : Math.floor(elapsed / 220) % 8;
    if (frame !== lastFrame) {
      lastFrame = frame;
      drawHead(frame);
    }
    if (stage !== lastStage || cycle !== lastPass) {
      lastStage = stage;
      lastPass = cycle;
      $('stage-label').textContent = `STAGE ${stage + 1} OUT OF ${stages.length}`;
      $('stage-detail').textContent = stages[stage];
      $('cycle-label').textContent = `PASS ${String(cycle + 1).padStart(3, '0')}`;
      $('announcer').textContent = `Importing D.YL.A.N. Stage ${stage + 1} out of ${stages.length}. ${stages[stage]}`;
      beep();
    }
    if (percent !== lastPercent) {
      lastPercent = percent;
      $('progress-fill').style.width = `${percent}%`;
      $('progress-percent').textContent = `${percent}%`;
      $('import-progress').setAttribute('aria-valuenow', String(percent));
      $('import-progress').setAttribute('aria-valuetext', `Stage ${stage + 1} out of 8, ${percent} percent`);
      $('bytes-label').textContent = `${Math.floor(fraction * 640)} / 640 KB`;
    }
  }

  function tick(now) {
    if (!paused) elapsed += Math.min(now - lastTime, 100);
    lastTime = now;
    updateDisplay();
    requestAnimationFrame(tick);
  }

  function closeMenus() {
    document.querySelectorAll('.menu[open]').forEach((menu) => { menu.open = false; });
  }

  function togglePause() {
    paused = !paused;
    $('pause-button').textContent = paused ? 'Resume import' : 'Pause import';
    $('pause-menu').textContent = paused ? 'Resume import' : 'Pause import';
    $('status-text').textContent = paused ? 'Import paused.' : 'Working...';
    $('preview-status').textContent = paused ? 'Preview paused.' : 'Rendering object...';
    $('object-status').textContent = paused ? 'PAUSED' : 'IMPORTING...';
    $('monitor-status').textContent = paused ? 'TRANSFER ON HOLD' : 'CONNECTION ESTABLISHED';
    $('announcer').textContent = paused ? 'Import paused.' : 'Import resumed.';
    closeMenus();
  }

  function toggleSound() {
    sound = !sound;
    $('sound-toggle').checked = sound;
    $('sound-menu').textContent = sound ? 'Turn sound off' : 'Turn sound on';
    beep();
    closeMenus();
  }

  function about() {
    closeMenus();
    $('about-dialog').showModal();
  }

  $('pause-button').addEventListener('click', togglePause);
  $('pause-menu').addEventListener('click', togglePause);
  $('sound-toggle').addEventListener('change', toggleSound);
  $('sound-menu').addEventListener('click', toggleSound);
  $('title-help').addEventListener('click', about);
  $('help-menu').addEventListener('click', about);
  $('restart-menu').addEventListener('click', () => {
    elapsed = 0;
    lastFrame = lastStage = lastPass = lastPercent = -1;
    if (paused) togglePause();
    updateDisplay();
    closeMenus();
  });
  $('grid-menu').addEventListener('click', () => {
    grid = !grid;
    $('viewport').classList.toggle('hide-grid', !grid);
    $('grid-menu').textContent = grid ? 'Hide coordinate grid' : 'Show coordinate grid';
    closeMenus();
  });
  $('scan-menu').addEventListener('click', () => {
    scan = !scan;
    $('viewport').classList.toggle('hide-scanlines', !scan);
    $('scan-menu').textContent = scan ? 'Hide scanlines' : 'Show scanlines';
    closeMenus();
  });
  document.querySelectorAll('.menu').forEach((menu) => {
    menu.addEventListener('toggle', () => {
      if (!menu.open) return;
      document.querySelectorAll('.menu').forEach((other) => { if (other !== menu) other.open = false; });
    });
  });
  document.addEventListener('click', (event) => { if (!event.target.closest('.menu')) closeMenus(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenus(); });
  image.onload = () => {
    imageReady = true;
    drawHead(lastFrame < 0 ? 0 : lastFrame);
  };
  image.onerror = () => { $('preview-status').textContent = 'Preview unavailable.'; };
  image.src = 'assets/head-turntable.png';
  updateDisplay();
  requestAnimationFrame(tick);
})();
