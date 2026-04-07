const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const fs      = require('fs');
const { SECRET } = require('../middleware/auth');

const router = express.Router();

function getHash() {
  // Hash is stored in a file to avoid Docker Compose mangling $ signs
  try {
    const h = fs.readFileSync('/run/secrets/pw_hash', 'utf-8').trim();
    if (h) return h;
  } catch {}
  return process.env.ADMIN_PASSWORD_HASH || null;
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  if (username !== adminUser)
    return res.status(401).json({ error: 'Invalid credentials' });

  const hash = getHash();
  const valid = hash
    ? await bcrypt.compare(password, hash)
    : password === 'changeme';

  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ username }, SECRET, { expiresIn: '24h' });
  res.json({ token, username });
});

router.post('/verify', (req, res) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ valid: false });
  try {
    const u = jwt.verify(token, SECRET);
    res.json({ valid: true, username: u.username });
  } catch {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;
