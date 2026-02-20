#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_DIR="$SCRIPT_DIR/apps/api"
WEB_DIR="$SCRIPT_DIR/apps/web"

# Load .env (has PGPASSWORD and other secrets)
[ -f "$API_DIR/.env" ] && { set -a; source "$API_DIR/.env"; set +a; }

cleanup() { kill $API_PID $WEB_PID 2>/dev/null; wait 2>/dev/null; }
trap cleanup EXIT INT TERM

# Start Fine API (spawns OC gateway internally)
cd "$API_DIR" && npx tsx watch src/index.ts &
API_PID=$!
sleep 5

# Start Web UI
cd "$WEB_DIR" && yarn dev &
WEB_PID=$!

echo ""
echo "========================================"
echo "  Fine API + OC  →  http://localhost:3001"
echo "  Web UI         →  http://localhost:3000"
echo "========================================"
echo "  Press Ctrl+C to stop all services."
echo ""

wait
