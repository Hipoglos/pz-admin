const express = require('express');
const fs   = require('fs');
const path = require('path');

const router = express.Router();
const CONFIG_DIR = process.env.PZ_CONFIG_DIR || '/pz-config';

function parseIni(content) {
  const out = {};
  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) return;
    const i = line.indexOf('=');
    if (i === -1) return;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  });
  return out;
}

function applyEdits(original, edits) {
  return original.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) return line;
    const i = trimmed.indexOf('=');
    if (i === -1) return line;
    const key = trimmed.slice(0, i).trim();
    return key in edits ? `${key}=${edits[key]}` : line;
  }).join('\n');
}

router.get('/files', (req, res) => {
  if (!fs.existsSync(CONFIG_DIR)) return res.json({ files: [], error: 'Config dir not mounted' });
  const files = fs.readdirSync(CONFIG_DIR)
    .filter(f => f.endsWith('.ini'))
    .map(f => ({ name: f }));
  res.json({ files });
});

router.get('/file/:name', (req, res) => {
  const file = path.join(CONFIG_DIR, path.basename(req.params.name));
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
  const content = fs.readFileSync(file, 'utf-8');
  res.json({ content, parsed: parseIni(content) });
});

router.put('/file/:name', (req, res) => {
  const file = path.join(CONFIG_DIR, path.basename(req.params.name));
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
  try {
    const { updates, raw } = req.body;
    if (raw !== undefined) {
      fs.writeFileSync(file, raw, 'utf-8');
    } else if (updates) {
      const original = fs.readFileSync(file, 'utf-8');
      fs.writeFileSync(file, applyEdits(original, updates), 'utf-8');
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
