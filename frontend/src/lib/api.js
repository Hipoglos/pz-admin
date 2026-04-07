import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('pz_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(r => r, err => {
  if ([401, 403].includes(err.response?.status)) {
    localStorage.removeItem('pz_token');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

export const auth    = {
  login:  (u, p) => api.post('/auth/login', { username: u, password: p }),
  verify: ()     => api.post('/auth/verify'),
};
export const server  = {
  status:    ()    => api.get('/server/status'),
  command:   (cmd) => api.post('/server/command', { command: cmd }),
  save:      ()    => api.post('/server/save'),
  quit:      ()    => api.post('/server/quit'),
  chopper:   ()    => api.post('/server/chopper'),
  gunshot:   ()    => api.post('/server/gunshot'),
  startRain: ()    => api.post('/server/startrain'),
  stopRain:  ()    => api.post('/server/stoprain'),
  broadcast: (msg) => api.post('/server/broadcast', { message: msg }),
};
export const players = {
  list:           ()                       => api.get('/players'),
  kick:           (username, reason)       => api.post('/players/kick', { username, reason }),
  ban:            (username, reason)       => api.post('/players/ban', { username, reason }),
  unban:          (username)               => api.post('/players/unban', { username }),
  giveItem:       (username, mod, item, n) => api.post('/players/giveitem', { username, module: mod, item, count: n }),
  giveXp:         (username, perk, xp)     => api.post('/players/givexp', { username, perk, xp }),
  setAccessLevel: (username, level)        => api.post('/players/setaccesslevel', { username, level }),
  teleport:       (username, target)       => api.post('/players/teleport', { username, target }),
};
export const config  = {
  files:   ()           => api.get('/config/files'),
  getFile: (name)       => api.get(`/config/file/${name}`),
  save:    (name, edits) => api.put(`/config/file/${name}`, { updates: edits }),
  saveRaw: (name, raw)  => api.put(`/config/file/${name}`, { raw }),
};
export default api;
