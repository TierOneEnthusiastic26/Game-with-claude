const T = 16, SCALE = 3;
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
const $ = id => document.getElementById(id);

// Legend: # wall, . floor, H house wall, T tree, D door, L locked door, E exit, C chest
const MAPS = {
  world: { name: 'Village', spawn: [9, 7], rows: [
    '####################',
    '#..T..........T....#',
    '#..HHH......HHH....#',
    '#..HDH......HLH..T.#',
    '#..................#',
    '#.T.........C......#',
    '#..................#',
    '#.C...........T..C.#',
    '#..................#',
    '####################']},
  house: { name: 'Cozy House', exit: ['world', 4, 4], rows: [
    '##########',
    '#........#',
    '#.C....C.#',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '####E#####']},
  vault: { name: 'Treasure Vault', exit: ['world', 13, 4], rows: [
    '##########',
    '#........#',
    '#.C.C.C..#',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '####E#####']}
};
const DOORS = { 'world:4,3': ['house', 4, 6], 'world:13,3': ['vault', 4, 6] };
const LOOT = {
  'world:12,5': {coins: 5},  'world:2,7': {coins: 8},   'world:17,7': {coins: 3},
  'house:2,2': {key: 1},     'house:7,2': {coins: 10},
  'vault:2,2': {coins: 25},  'vault:4,2': {coins: 15},  'vault:6,2': {gem: 1}
};

let map, px, py, face, opened, coins, keys, won;

function start() {
  opened = new Set(); coins = 0; keys = 0; won = false;
  $('total').textContent = Object.keys(LOOT).length;
  $('restart').hidden = true;
  say('Walk with arrow keys / WASD. Find the key, open the locked house.');
  enter('world', ...MAPS.world.spawn);
}
function enter(name, x, y) {
  map = name; px = x; py = y; face = 'down';
  const m = MAPS[name];
  cv.width = m.rows[0].length * T; cv.height = m.rows.length * T;
  cv.style.width = cv.width * SCALE + 'px';
  $('where').textContent = m.name;
  draw();
}
const say = t => $('msg').textContent = t;
const tile = (x, y) => (MAPS[map].rows[y] || '')[x] || '#';
const key = (x, y) => `${map}:${x},${y}`;

function move(dx, dy) {
  if (won) return;
  face = dx < 0 ? 'left' : dx > 0 ? 'right' : dy < 0 ? 'up' : 'down';
  const nx = px + dx, ny = py + dy, t = tile(nx, ny);
  if ('#HT'.includes(t)) return draw();
  if (t === 'C') { openChest(nx, ny); return draw(); }
  if (t === 'L') {
    if (keys > 0) { keys--; say('🔓 You unlocked the vault door!'); const d = DOORS[key(nx, ny)]; return enter(...d); }
    say('🔒 Locked. You need a key.'); return draw();
  }
  if (t === 'D') return enter(...DOORS[key(nx, ny)]);
  if (t === 'E') return enter(...MAPS[map].exit);
  px = nx; py = ny; draw();
}
function openChest(x, y) {
  const k = key(x, y);
  if (opened.has(k)) return say('The chest is empty.');
  opened.add(k);
  const l = LOOT[k];
  if (l.coins) { coins += l.coins; say(`🪙 You found ${l.coins} coins!`); }
  if (l.key) { keys += 1; say('🗝️ You found a key! Try the other house.'); }
  if (l.gem) { won = true; say('💎 You found the Royal Gem! You win!'); $('restart').hidden = false; }
}
function hud() {
  $('coins').textContent = coins; $('keys').textContent = keys; $('chests').textContent = opened.size;
}

// ---------- drawing (all pixel art made from rectangles) ----------
const r = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
function drawTile(t, x, y, inWorld) {
  const X = x * T, Y = y * T, even = (x + y) % 2;
  if (inWorld) r(even ? '#4f9d4a' : '#58a852', X, Y, T, T); else r(even ? '#7a5a3c' : '#84633f', X, Y, T, T);
  if (t === '#') { inWorld ? (r('#2d6a33', X, Y, T, T), r('#3c8a40', X + 2, Y + 2, 5, 5), r('#3c8a40', X + 9, Y + 8, 5, 5)) : (r('#3a3050', X, Y, T, T), r('#52466e', X, Y, T, 3), r('#2a2238', X, Y + 13, T, 3)); }
  if (t === 'H') { r('#b85c38', X, Y, T, T); r('#8f4529', X, Y + 5, T, 1); r('#8f4529', X, Y + 11, T, 1); }
  if (t === 'T') { r('#5b3a1e', X + 6, Y + 9, 4, 7); r('#2d7a32', X + 1, Y + 1, 14, 10); r('#3fa045', X + 3, Y + 3, 5, 4); }
  if (t === 'D' || t === 'L') { r('#b85c38', X, Y, T, T); r('#4a2a14', X + 3, Y + 2, 10, 14); r(t === 'L' ? '#f2b632' : '#7a4a24', X + 10, Y + 9, 2, 2); if (t === 'L') r('#999', X + 6, Y + 6, 4, 4); }
  if (t === 'E') { r('#d8c28a', X, Y, T, T); r('#fff', X + 5, Y + 5, 6, 6); }
  if (t === 'C') {
    const open = opened.has(key(x, y));
    r('#000', X + 1, Y + 4, 14, 11);
    r(open ? '#6a4a1c' : '#c8832a', X + 2, Y + 5, 12, 9);
    r(open ? '#2a1a08' : '#e6a64a', X + 2, Y + (open ? 5 : 5), 12, open ? 4 : 3);
    if (!open) { r('#f2e04a', X + 7, Y + 8, 2, 3); }
  }
}
function drawPlayer() {
  const X = px * T, Y = py * T;
  r('rgba(0,0,0,.3)', X + 3, Y + 13, 10, 3);
  r('#3a6fd8', X + 4, Y + 7, 8, 6);           // tunic
  r('#f2c9a0', X + 4, Y + 1, 8, 7);           // head
  r('#5a2f12', X + 4, Y + 1, 8, 3);           // hair
  r('#222', X + 4, Y + 13, 3, 2); r('#222', X + 9, Y + 13, 3, 2);
  if (face === 'down') { r('#000', X + 5, Y + 5, 2, 2); r('#000', X + 9, Y + 5, 2, 2); }
  if (face === 'left') r('#000', X + 5, Y + 5, 2, 2);
  if (face === 'right') r('#000', X + 9, Y + 5, 2, 2);
}
function draw() {
  const rows = MAPS[map].rows, inWorld = map === 'world';
  rows.forEach((row, y) => [...row].forEach((t, x) => drawTile(t, x, y, inWorld)));
  drawPlayer(); hud();
}

// ---------- input ----------
const KEYS = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
addEventListener('keydown', e => {
  const d = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  if (d) { e.preventDefault(); move(...d); }
});
const PAD = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
document.querySelectorAll('#pad button').forEach(b => b.addEventListener('click', () => move(...PAD[b.dataset.d])));
$('restart').addEventListener('click', start);
start();
