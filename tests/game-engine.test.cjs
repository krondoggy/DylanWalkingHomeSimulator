'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../game-engine.js');

function advance(state, seconds, input = {}) {
  for (let remaining = seconds; remaining > 0.000001; remaining -= 0.1) {
    game.update(state, Math.min(0.1, remaining), input);
  }
}
function visit(state, id) {
  const npc = state.npcs.find(npc => npc.id === id);
  state.player.x = npc.x;
  state.player.y = npc.y;
  return npc;
}

test('each friend grants their distinct first favor', () => {
  const state = game.createGame();
  visit(state, 'travis');
  assert.equal(game.requestItem(state, 'TRAVIS').kind, 'grant');
  const initialX = state.player.x;
  game.update(state, 0.1, { x: 1 });
  assert.ok(Math.abs(state.player.x - initialX - 24) < 0.001, 'ride triples walking speed');

  visit(state, 'jon');
  state.happiness = 20;
  assert.equal(game.requestItem(state, 'jon').ok, true);
  assert.equal(state.happiness, 50);
  assert.ok(state.buffs.some(buff => buff.id === 'happiness'));

  visit(state, 'blake');
  state.stamina = 10;
  assert.equal(game.requestItem(state, 'blake').kind, 'grant');
  assert.equal(state.stamina, 55);
  assert.ok(state.buffs.some(buff => buff.id === 'stamina'));
});

test('proximity and cooldown prevent remote favors and repeated penalties', () => {
  const state = game.createGame();
  assert.equal(game.getNearbyNPC(state), null);
  assert.equal(game.requestItem(state, 'travis').kind, 'too-far');
  assert.equal(state.npcs[0].requests, 0);
  visit(state, 'travis');
  assert.equal(game.getNearbyNPC(state).id, 'travis');
  game.requestItem(state, 'travis');
  const snapshot = { happiness: state.happiness, requests: state.npcs[0].requests, logs: state.logs.length };
  assert.equal(game.requestItem(state, 'travis').kind, 'cooldown');
  assert.deepEqual({ happiness: state.happiness, requests: state.npcs[0].requests, logs: state.logs.length }, snapshot);
});

test('every third eligible request declines, briefly slows Dylan, then recovers', () => {
  const state = game.createGame();
  visit(state, 'blake');
  game.requestItem(state, 'blake');
  advance(state, 8.1);
  game.requestItem(state, 'blake');
  advance(state, 8.1);
  const before = state.happiness;
  assert.equal(game.requestItem(state, 'blake').kind, 'decline');
  assert.equal(state.happiness, before - 8);
  assert.ok(state.buffs.some(buff => buff.id === 'guilt'));
  let x = state.player.x;
  game.update(state, 0.1, { x: 1 });
  assert.ok(Math.abs(state.player.x - x - 5.76) < 0.001);
  advance(state, 5.1);
  assert.ok(!state.buffs.some(buff => buff.id === 'guilt'));
  x = state.player.x;
  game.update(state, 0.1, { x: 1 });
  assert.ok(Math.abs(state.player.x - x - 8) < 0.001);
  advance(state, 3.1);
  visit(state, 'blake');
  assert.equal(game.requestItem(state, 'blake').kind, 'grant');
});

test('buffs refresh without stacking and expire', () => {
  const state = game.createGame();
  visit(state, 'jon');
  game.requestItem(state, 'jon');
  advance(state, 8.1);
  game.requestItem(state, 'jon');
  const buffs = state.buffs.filter(buff => buff.id === 'happiness');
  assert.equal(buffs.length, 1);
  assert.equal(buffs[0].remaining, 10);
  advance(state, 10.1);
  assert.equal(state.buffs.length, 0);
});

test('home can never be reached after repeated neighborhood loops', () => {
  const state = game.createGame({ random: () => 0.5 });
  for (let frame = 0; frame < 15000; frame++) {
    game.update(state, 0.1, { x: 1, sprint: true });
    assert.ok(state.homeDistance > 0);
    assert.ok(state.player.x <= game.WORLD.homeX);
  }
  assert.ok(state.neighborhood > 100);
  assert.ok(state.steps > 0);
  assert.equal(state.logs.length, 8);
  assert.ok(!('won' in state) && !('gameOver' in state));
});

test('pause freezes movement, stats, cooldowns, elapsed time and buffs', () => {
  const state = game.createGame();
  visit(state, 'travis');
  game.requestItem(state, 'travis');
  state.paused = true;
  const snapshot = JSON.stringify(state);
  advance(state, 20, { x: 1, y: 1, sprint: true });
  assert.equal(JSON.stringify(state), snapshot);
  assert.equal(game.requestItem(state, 'travis').ok, false);
  state.paused = false;
  game.update(state, 0.1, { x: 1 });
  assert.ok(state.elapsed > 0 && state.player.x > 320);
});

test('diagonal movement is normalized, bounds hold, and zero stats never stop walking', () => {
  const cardinal = game.createGame();
  const diagonal = game.createGame();
  game.update(cardinal, 0.1, { x: 1 });
  game.update(diagonal, 0.1, { x: 1, y: -1 });
  assert.ok(Math.abs(Math.hypot(diagonal.player.x - 120, diagonal.player.y - 250) - (cardinal.player.x - 120)) < 0.001);
  const state = game.createGame();
  advance(state, 20, { x: -1, y: -1 });
  assert.equal(state.player.x, 40);
  assert.equal(state.player.y, 100);
  advance(state, 20, { y: 1 });
  assert.equal(state.player.y, 305);
  state.stamina = 0;
  state.happiness = 0;
  const before = state.player.x;
  game.update(state, 0.1, { x: 1, sprint: true });
  assert.equal(state.player.x - before, 8);
  assert.ok(state.stamina >= 0 && state.stamina <= 100);
  assert.ok(state.happiness >= 0 && state.happiness <= 100);
});

test('long frame gaps and invalid input cannot teleport Dylan or corrupt state', () => {
  const state = game.createGame();
  game.update(state, 30, { x: 1 });
  assert.equal(state.player.x, 140);
  assert.equal(state.elapsed, 0.25);
  game.update(state, NaN, { x: Infinity, y: NaN });
  assert.equal(state.player.x, 140);
  game.update(state, 0.1, { x: Infinity, y: NaN });
  assert.equal(state.player.x, 140);
  assert.equal(state.player.y, 250);
  assert.equal(state.player.moving, false);
});
