#!/bin/bash
set -euo pipefail

/app/goalsync &
BACKEND_PID=$!

cd /app/frontend
npm run preview -- --host 0.0.0.0 --port 3000 &
FRONTEND_PID=$!

trap 'kill "$BACKEND_PID" "$FRONTEND_PID"' INT TERM
wait -n "$BACKEND_PID" "$FRONTEND_PID"

