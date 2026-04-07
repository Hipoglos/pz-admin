require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes    = require('./routes/auth');
const serverRoutes  = require('./routes/server');
const playersRoutes = require('./routes/players');
const configRoutes  = require('./routes/config');
const { authenticateToken } = require('./middleware/auth');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

app.use('/api/auth',    authRoutes);
app.use('/api/server',  authenticateToken, serverRoutes);
app.use('/api/players', authenticateToken, playersRoutes);
app.use('/api/config',  authenticateToken, configRoutes);
app.get('/api/health',  (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
