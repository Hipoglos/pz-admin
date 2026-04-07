const { Rcon } = require('rcon-client');

let client = null;

async function getClient() {
  if (client) return client;
  client = new Rcon({
    host: process.env.RCON_HOST || '127.0.0.1',
    port: parseInt(process.env.RCON_PORT) || 27015,
    password: process.env.RCON_PASSWORD || '',
    timeout: 5000,
  });
  client.on('end',   () => { client = null; });
  client.on('error', () => { client = null; });
  await client.connect();
  return client;
}

async function sendCommand(command) {
  try {
    const c = await getClient();
    const response = await c.send(command);
    return { success: true, response };
  } catch (err) {
    client = null;
    return { success: false, error: err.message };
  }
}

module.exports = { sendCommand };
