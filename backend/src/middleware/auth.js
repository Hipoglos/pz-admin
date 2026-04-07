const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'changeme';

function authenticateToken(req, res, next) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(403).json({ error: 'Invalid token' }); }
}

function verifyToken(token) {
  try { return jwt.verify(token, SECRET); } catch { return null; }
}

module.exports = { authenticateToken, verifyToken, SECRET };
