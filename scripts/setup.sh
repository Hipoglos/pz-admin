#!/bin/bash
# PZ Admin Panel — Setup
# Ubuntu / Debian with Docker already installed
set -e

G='\033[0;32m'; A='\033[1;33m'; R='\033[0;31m'; D='\033[0;90m'; N='\033[0m'; B='\033[1m'
log()  { echo -e "${G}[✔]${N} $1"; }
info() { echo -e "${B}[→]${N} $1"; }
warn() { echo -e "${A}[!]${N} $1"; }
err()  { echo -e "${R}[✘]${N} $1"; exit 1; }
dim()  { echo -e "${D}    $1${N}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo ""
echo -e "${G}╔═══════════════════════════════════════╗${N}"
echo -e "${G}║    PZ ADMIN PANEL — SETUP             ║${N}"
echo -e "${G}╚═══════════════════════════════════════╝${N}"
echo ""

# Verify Docker
command -v docker &>/dev/null || err "Docker not found."
if docker compose version &>/dev/null 2>&1; then COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null;   then COMPOSE="docker-compose"
else err "Docker Compose not found."; fi
log "Docker ready"

# Configure
if [ -f ".env" ]; then
  warn ".env exists — skipping setup questions."
  warn "To reconfigure: docker compose down && rm .env secrets/pw_hash && bash scripts/setup.sh"
else
  echo ""
  echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
  echo -e "${B}  CONFIGURATION${N}"
  echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
  echo ""

  echo -e "${B}  ── RCON ──${N}"
  echo ""
  echo -e "  Where is your PZ server?"
  dim "· Same machine (baremetal or network:host) → 127.0.0.1  (auto-converted)"
  dim "· Different machine on LAN                → its IP e.g. 192.168.1.100"
  echo ""
  read -rp "$(echo -e ${G})[?]$(echo -e ${N}) PZ server IP: " RCON_HOST
  [ -z "$RCON_HOST" ] && err "Cannot be empty"
  if [ "$RCON_HOST" = "127.0.0.1" ] || [ "$RCON_HOST" = "localhost" ]; then
    warn "Redirecting to host.docker.internal (required inside Docker)"
    RCON_HOST="host.docker.internal"
  fi

  read -rp "$(echo -e ${G})[?]$(echo -e ${N}) RCON port [27015]: " RCON_PORT
  RCON_PORT="${RCON_PORT:-27015}"

  read -rsp "$(echo -e ${G})[?]$(echo -e ${N}) RCON password: " RCON_PASSWORD; echo ""
  [ -z "$RCON_PASSWORD" ] && err "Cannot be empty"

  echo ""
  echo -e "${B}  ── Web Panel Login ──${N}"
  echo ""
  read -rp "$(echo -e ${G})[?]$(echo -e ${N}) Admin username [admin]: " ADMIN_USERNAME
  ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"

  read -rsp "$(echo -e ${G})[?]$(echo -e ${N}) Admin password: " ADMIN_PASSWORD; echo ""
  [ -z "$ADMIN_PASSWORD" ] && err "Cannot be empty"

  echo ""
  echo -e "${B}  ── PZ Config Path ──${N}"
  echo ""
  dim "Path on this VM to your PZ Server config directory"
  dim "Usually: /srv/pzserver/Zomboid/Server"
  echo ""
  read -rp "$(echo -e ${G})[?]$(echo -e ${N}) Config path [/srv/pzserver/Zomboid/Server]: " PZ_CONFIG_PATH
  PZ_CONFIG_PATH="${PZ_CONFIG_PATH:-/srv/pzserver/Zomboid/Server}"

  echo ""
  read -rp "$(echo -e ${G})[?]$(echo -e ${N}) Admin panel port [8080]: " ADMIN_PORT
  ADMIN_PORT="${ADMIN_PORT:-8080}"

  # Hash password into secrets/pw_hash (avoids Docker $ mangling)
  info "Hashing password..."
  mkdir -p secrets
  TMPDIR=$(mktemp -d)
  docker run --rm -v "$TMPDIR":/work node:20-alpine \
    sh -c "cd /work && npm init -y >/dev/null 2>&1 && npm install bcryptjs >/dev/null 2>&1 \
           && node -e \"process.stdout.write(require('bcryptjs').hashSync('${ADMIN_PASSWORD}',10))\"" \
    > "$TMPDIR/hash.txt" 2>/dev/null
  cp "$TMPDIR/hash.txt" secrets/pw_hash
  rm -rf "$TMPDIR"
  [ ! -s secrets/pw_hash ] && err "Hash generation failed"
  chmod 600 secrets/pw_hash
  log "Password hashed → secrets/pw_hash"

  JWT_SECRET=$(head -c 48 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 48)

  cat > .env << ENVEOF
RCON_HOST=${RCON_HOST}
RCON_PORT=${RCON_PORT}
RCON_PASSWORD=${RCON_PASSWORD}

ADMIN_USERNAME=${ADMIN_USERNAME}
JWT_SECRET=${JWT_SECRET}

PZ_CONFIG_PATH=${PZ_CONFIG_PATH}

ADMIN_PORT=${ADMIN_PORT}
ENVEOF

  chmod 600 .env
  log ".env written"
fi

set -a; source .env; set +a

[ ! -f "secrets/pw_hash" ] && err "secrets/pw_hash missing — delete .env and re-run."

[ ! -d "$PZ_CONFIG_PATH" ] && warn "Config path '$PZ_CONFIG_PATH' not found — Config Editor will activate once PZ has run."

echo ""
info "Building containers..."
$COMPOSE build

info "Starting..."
$COMPOSE up -d

VM_IP=$(hostname -I | awk '{print $1}')
echo ""
echo -e "${G}╔═══════════════════════════════════════╗${N}"
echo -e "${G}║           ALL DONE  🧟                ║${N}"
echo -e "${G}╚═══════════════════════════════════════╝${N}"
echo ""
echo -e "  🌐  ${G}http://${VM_IP}:${ADMIN_PORT:-8080}${N}"
echo -e "  👤  ${ADMIN_USERNAME:-admin}"
echo ""
dim "docker compose logs -f       # live logs"
dim "docker compose restart        # restart"
dim "docker compose down           # stop"
dim "docker compose build && docker compose up -d  # rebuild after git pull"
echo ""
