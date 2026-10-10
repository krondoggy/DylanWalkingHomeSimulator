(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DWHS = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var WORLD = Object.freeze({ width: 1200, height: 360, homeX: 1130 });
  var CONTACT_RADIUS = 72;
  var WRONG_STREETS = [
    'That was the wrong house. Somehow, you are back on the same block.',
    'HOME.EXE redirected you to another identical street.',
    'You recognize this street. Unfortunately, it does not recognize you.',
    'One more corner should do it. It has been one more corner all night.'
  ];

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function finite(value) { return typeof value === 'number' && Number.isFinite(value) ? value : 0; }
  function log(state, message) {
    state.logs.push(message);
    if (state.logs.length > 8) state.logs.splice(0, state.logs.length - 8);
  }
  function hasBuff(state, id) {
    return state.buffs.some(function (buff) { return buff.id === id && buff.remaining > 0; });
  }
  function giveBuff(state, id, label, duration) {
    var buff = state.buffs.find(function (entry) { return entry.id === id; });
    if (buff) {
      buff.remaining = duration;
      buff.duration = duration;
    } else {
      state.buffs.push({ id: id, label: label, remaining: duration, duration: duration });
    }
  }
  function createGame(options) {
    var state = {
      player: { x: 120, y: 250, facing: 'right', moving: false },
      stamina: 100,
      happiness: 76,
      steps: 0,
      elapsed: 0,
      neighborhood: 1,
      homeDistance: WORLD.homeX - 120,
      paused: false,
      buffs: [],
      npcs: [
        { id: 'travis', name: 'TRAVIS', x: 320, y: 250, item: 'A quick ride', cooldown: 0, requests: 0 },
        { id: 'jon', name: 'JON', x: 600, y: 170, item: 'Cigarettes', cooldown: 0, requests: 0 },
        { id: 'blake', name: 'BLAKE', x: 880, y: 250, item: 'Whataburger french fries', cooldown: 0, requests: 0 }
      ],
      logs: [
        'Walk with the arrow keys / WASD, or the on-screen direction pad.',
        'Get close to TRAVIS, JON or BLAKE and ask for a favor.',
        'Your objective: get home. Your odds: indefinitely pending.'
      ]
    };
    Object.defineProperty(state, '_random', {
      value: options && typeof options.random === 'function' ? options.random : Math.random
    });
    Object.defineProperty(state, '_stepRemainder', { value: 0, writable: true });
    return state;
  }

  function getNearbyNPC(state) {
    var closest = null;
    var closestDistance = CONTACT_RADIUS;
    state.npcs.forEach(function (npc) {
      var distance = Math.hypot(npc.x - state.player.x, npc.y - state.player.y);
      if (distance <= closestDistance) {
        closest = npc;
        closestDistance = distance;
      }
    });
    return closest;
  }

  function requestItem(state, npcId) {
    var id = String(npcId || '').toLowerCase();
    var npc = state.npcs.find(function (entry) { return entry.id === id; });
    if (!npc || Math.hypot(npc.x - state.player.x, npc.y - state.player.y) > CONTACT_RADIUS) {
      return { ok: false, kind: 'too-far', message: 'Walk closer to your friend to ask for a favor.' };
    }
    if (state.paused) {
      return { ok: false, kind: 'cooldown', message: 'Unpause before asking for a favor.' };
    }
    if (npc.cooldown > 0) {
      return { ok: false, kind: 'cooldown', message: npc.name + ' says: Give me ' + Math.ceil(npc.cooldown) + ' seconds, man.' };
    }

    npc.requests += 1;
    npc.cooldown = 8;
    var message;
    if (npc.requests % 3 === 0) {
      var declines = {
        travis: 'TRAVIS: I literally just dropped you off. Walk this one out.',
        jon: 'JON: Again? You still owe me from the last imaginary pack.',
        blake: 'BLAKE: Those were MY fries, Dylan. Try walking with purpose.'
      };
      message = declines[id];
      state.happiness = clamp(state.happiness - 8, 0, 100);
      giveBuff(state, 'guilt', 'GUILT TRIP', 5);
      log(state, message + ' [GUILT TRIP: 5s]');
      return { ok: false, kind: 'decline', message: message };
    }

    if (id === 'travis') {
      giveBuff(state, 'ride', 'PASSENGER PRINCESS', 7);
      message = 'TRAVIS: Hop in. I can take you exactly one very unhelpful block. [RIDE: 7s]';
    } else if (id === 'jon') {
      state.happiness = clamp(state.happiness + 30, 0, 100);
      giveBuff(state, 'happiness', 'BORROWED HAPPINESS', 10);
      message = 'JON hands over cigarettes. Dylan briefly decides life is going great. [HAPPINESS: 10s]';
    } else {
      state.stamina = clamp(state.stamina + 45, 0, 100);
      giveBuff(state, 'stamina', 'FRY POWER', 10);
      message = 'BLAKE shares Whataburger french fries. Salt-powered walking has been enabled. [STAMINA: 10s]';
    }
    log(state, message);
    return { ok: true, kind: 'grant', message: message };
  }

  function update(state, dtSeconds, input) {
    if (state.paused) {
      state.player.moving = false;
      return state;
    }
    var dt = clamp(finite(dtSeconds), 0, 0.25);
    if (dt === 0) return state;
    input = input || {};
    state.elapsed += dt;

    state.buffs.forEach(function (buff) { buff.remaining = Math.max(0, buff.remaining - dt); });
    state.buffs = state.buffs.filter(function (buff) { return buff.remaining > 0; });
    state.npcs.forEach(function (npc) { npc.cooldown = Math.max(0, npc.cooldown - dt); });

    var x = clamp(finite(input.x), -1, 1);
    var y = clamp(finite(input.y), -1, 1);
    var magnitude = Math.hypot(x, y);
    if (magnitude > 1) { x /= magnitude; y /= magnitude; }
    var moving = magnitude > 0;
    var riding = hasBuff(state, 'ride');
    var sprinting = moving && !!input.sprint && state.stamina > 5 && !riding;
    var speed = 80 * (riding ? 3 : sprinting ? 1.55 : 1) * (hasBuff(state, 'guilt') ? 0.72 : 1);

    var previousX = state.player.x;
    var previousY = state.player.y;
    state.player.x = Math.max(40, state.player.x + x * speed * dt);
    state.player.y = clamp(state.player.y + y * speed * dt, 100, 305);
    var distance = Math.hypot(state.player.x - previousX, state.player.y - previousY);
    state.player.moving = distance > 0.001;
    if (moving) {
      state.player.facing = Math.abs(x) >= Math.abs(y) ? (x < 0 ? 'left' : 'right') : (y < 0 ? 'up' : 'down');
    }
    if (!riding) {
      state._stepRemainder += distance / 14;
      var steps = Math.floor(state._stepRemainder);
      state.steps += steps;
      state._stepRemainder -= steps;
    }

    if (state.player.x > WORLD.homeX) {
      state.player.x = 120;
      state.neighborhood += 1;
      var roll = clamp(finite(state._random()), 0, 0.999999);
      log(state, WRONG_STREETS[Math.floor(roll * WRONG_STREETS.length)]);
    }
    state.homeDistance = Math.max(1, WORLD.homeX - state.player.x);

    var staminaChange = hasBuff(state, 'stamina') ? 5 : riding ? 1 : sprinting ? -8 : moving ? -0.65 : 0.8;
    state.stamina = clamp(state.stamina + staminaChange * dt, 0, 100);
    state.happiness = clamp(state.happiness + (hasBuff(state, 'happiness') ? 0.8 : -0.22) * dt, 0, 100);
    return state;
  }

  return {
    WORLD: WORLD,
    CONTACT_RADIUS: CONTACT_RADIUS,
    createGame: createGame,
    update: update,
    getNearbyNPC: getNearbyNPC,
    requestItem: requestItem
  };
}));
