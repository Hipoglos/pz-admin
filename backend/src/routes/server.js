const express = require('express');
const { sendCommand } = require('../services/rcon');

const router = express.Router();

router.get('/status', async (req, res) => {
  const r = await sendCommand('players');
  res.json({ connected: r.success, host: process.env.RCON_HOST, port: process.env.RCON_PORT });
});

router.post('/command',   async (req, res) => res.json(await sendCommand(req.body.command || '')));
router.post('/save',      async (req, res) => res.json(await sendCommand('save')));
router.post('/quit',      async (req, res) => res.json(await sendCommand('quit')));
router.post('/chopper',   async (req, res) => res.json(await sendCommand('chopper')));
router.post('/gunshot',   async (req, res) => res.json(await sendCommand('gunshot')));
router.post('/startrain', async (req, res) => res.json(await sendCommand('startrain')));
router.post('/stoprain',  async (req, res) => res.json(await sendCommand('stoprain')));
router.post('/broadcast', async (req, res) => res.json(await sendCommand(`servermsg "${req.body.message || ''}"`)));

module.exports = router;
