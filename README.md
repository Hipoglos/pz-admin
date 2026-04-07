# 🧟 PZ Admin Panel

Web admin panel for your Project Zomboid dedicated server.

## Features

- **Dashboard** — RCON status, online players, server controls, broadcast messages
- **Players** — Kick, ban, give items (incl. Katana), give XP, set access level, teleport
- **Config Editor** — Visual + raw editor for all `.ini` server settings
- **RCON Console** — Full terminal with command history

## Install

```bash
git clone https://github.com/Hipoglos/pz-admin.git
cd pz-admin
bash scripts/setup.sh
```

Setup asks you 5 questions, builds the containers, and prints your URL.

## Requirements

- Ubuntu 22.04 / 24.04 (or Debian 11/12)
- Docker + Docker Compose installed
- RCON enabled in your PZ `servertest.ini`:
  ```ini
  RCONPort=27015
  RCONPassword=your_password
  ```

## PZ server IP — what to enter

| Setup | Enter |
|---|---|
| PZ on same machine (baremetal or `network: host`) | `127.0.0.1` (auto-converted) |
| PZ on a different machine | its LAN IP e.g. `192.168.1.100` |

## Useful commands

```bash
docker compose logs -f                              # live logs
docker compose restart                              # restart
docker compose down                                 # stop
docker compose build && docker compose up -d        # rebuild after update

# Reconfigure from scratch:
docker compose down && rm .env secrets/pw_hash && bash scripts/setup.sh
```

## Files after setup

```
pz-admin/
├── backend/          Node.js API (RCON, config editor, auth)
├── frontend/         React app + nginx
├── secrets/pw_hash   Password hash (gitignored, never in .env)
├── .env              Config (gitignored)
├── docker-compose.yml
└── scripts/setup.sh  ← run this
```
