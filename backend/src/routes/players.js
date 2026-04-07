const express = require('express');
const { sendCommand } = require('../services/rcon');

const router = express.Router();

router.get('/', async (req, res) => {
  const r = await sendCommand('players');
  let list = [];
  if (r.success && r.response) {
    list = r.response.split('\n')
      .filter(l => l.trim().startsWith('-'))
      .map(l => ({ name: l.trim().slice(1).trim(), online: true }));
  }
  res.json({ players: list, raw: r.response });
});

router.post('/kick',     async (req, res) => {
  const { username, reason } = req.body;
  const cmd = reason ? `kickuser "${username}" -r "${reason}"` : `kickuser "${username}"`;
  res.json(await sendCommand(cmd));
});

router.post('/ban',      async (req, res) => {
  const { username, reason } = req.body;
  const cmd = reason ? `banuser "${username}" -r "${reason}"` : `banuser "${username}"`;
  res.json(await sendCommand(cmd));
});

router.post('/unban',    async (req, res) => res.json(await sendCommand(`unbanuser "${req.body.username}"`)));

router.post('/giveitem', async (req, res) => {
  const { username, module: mod, item, count } = req.body;
  res.json(await sendCommand(`additem "${username}" "${mod}.${item}" ${count || 1}`));
});

router.post('/givexp',   async (req, res) => {
  const { username, perk, xp } = req.body;
  res.json(await sendCommand(`addxp "${username}" ${perk}=${xp || 100}`));
});

router.post('/setaccesslevel', async (req, res) => {
  res.json(await sendCommand(`setaccesslevel "${req.body.username}" "${req.body.level}"`));
});

router.post('/teleport', async (req, res) => {
  res.json(await sendCommand(`teleport "${req.body.username}" "${req.body.target}"`));
});

module.exports = router;
