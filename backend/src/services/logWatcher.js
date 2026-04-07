const fs = require('fs');
const path = require('path');

const LOG_DIR = process.env.PZ_LOG_DIR || '/pz-logs';
const CONFIG_DIR = process.env.PZ_CONFIG_DIR || '/pz-config';

// players_live.json is written by the ZM_PlayerTracker Lua mod
// PZ writes mod output files into the Zomboid/ data directory, same level as Logs/
// We check the log dir parent (Zomboid/) and also the log dir itself
const POSITIONS_PATHS = [
  path.join(path.dirname(LOG_DIR), 'players_live.json'),  // Zomboid/players_live.json
  path.join(LOG_DIR, '..', 'players_live.json'),           // fallback
  path.join(CONFIG_DIR, '..', 'players_live.json'),        // another fallback
];

let playerPositions = new Map();
let positionsFromMod = false;

// ── Mod JSON reader (preferred — accurate, real-time) ──────────────────────
function readModPositions() {
  for (const filePath of POSITIONS_PATHS) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.players)) continue;

      // Update positions map from mod data
      const nowOnline = new Set();
      data.players.forEach(p => {
        if (!p.username) return;
        nowOnline.add(p.username);
        playerPositions.set(p.username, {
          name: p.name || p.username,
          x: p.x,
          y: p.y,
          z: p.z || 0,
          online: true,
          is_dead: p.is_dead || false,
          lastSeen: Date.now(),
          source: 'mod',
        });
      });

      // Mark players no longer in the list as offline
      playerPositions.forEach((v, k) => {
        if (!nowOnline.has(k)) {
          playerPositions.set(k, { ...v, online: false });
        }
      });

      positionsFromMod = true;
      return true;
    } catch {}
  }
  return false;
}

// ── Log file parser (fallback — less accurate) ─────────────────────────────
const POSITION_REGEX = /player\s+"([^"]+)".*?moved to ([\d.]+),\s*([\d.]+)/i;
const CONNECT_REGEX  = /player\s+"([^"]+)".*?connected/i;
const DISCONNECT_REGEX = /player\s+"([^"]+)".*?disconnected/i;

function parseLogLine(line) {
  if (positionsFromMod) return; // mod data takes priority

  const posMatch = line.match(POSITION_REGEX);
  if (posMatch) {
    const [, name, x, y] = posMatch;
    const current = playerPositions.get(name) || {};
    playerPositions.set(name, { ...current, name, x: parseFloat(x), y: parseFloat(y), online: true, lastSeen: Date.now(), source: 'log' });
    return;
  }
  const conMatch = line.match(CONNECT_REGEX);
  if (conMatch) {
    const name = conMatch[1];
    const current = playerPositions.get(name) || {};
    playerPositions.set(name, { ...current, name, online: true, lastSeen: Date.now() });
    return;
  }
  const disMatch = line.match(DISCONNECT_REGEX);
  if (disMatch) {
    const name = disMatch[1];
    const current = playerPositions.get(name) || {};
    playerPositions.set(name, { ...current, online: false });
  }
}

function watchLogFile(filePath) {
  let size = 0;
  try { size = fs.statSync(filePath).size; } catch { return; }

  fs.watch(filePath, () => {
    try {
      const newSize = fs.statSync(filePath).size;
      if (newSize <= size) return;
      const stream = fs.createReadStream(filePath, { start: size, end: newSize });
      size = newSize;
      let buf = '';
      stream.on('data', chunk => { buf += chunk.toString(); });
      stream.on('end', () => { buf.split('\n').forEach(parseLogLine); });
    } catch {}
  });
}

function startLogWatcher() {
  // Try mod JSON first (runs every 5s)
  const modFound = readModPositions();
  if (modFound) {
    console.log('[Map] Using ZM_PlayerTracker mod for player positions ✓');
  } else {
    console.log('[Map] ZM_PlayerTracker mod file not found — falling back to log parsing');
    console.log('[Map] Install the mod from /game-server/mods/ for accurate positioning');
  }

  // Poll mod file every 5s
  setInterval(() => { readModPositions(); }, 5000);

  // Also watch log files as fallback
  if (!fs.existsSync(LOG_DIR)) {
    console.warn(`[Map] Log dir not found: ${LOG_DIR}`);
    return;
  }

  try {
    fs.readdirSync(LOG_DIR)
      .filter(f => f.endsWith('.txt'))
      .forEach(f => watchLogFile(path.join(LOG_DIR, f)));

    fs.watch(LOG_DIR, (event, filename) => {
      if (filename && filename.endsWith('.txt')) {
        const fp = path.join(LOG_DIR, filename);
        if (fs.existsSync(fp)) watchLogFile(fp);
      }
    });
  } catch (e) {
    console.warn('[Map] Could not watch log dir:', e.message);
  }
}

function getPlayerPositions() {
  return Array.from(playerPositions.values());
}

module.exports = { startLogWatcher, getPlayerPositions };
