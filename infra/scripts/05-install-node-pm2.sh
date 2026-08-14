#!/usr/bin/env bash
# Day 7 — install Node.js 20 LTS + PM2 on Ubuntu 24.04
set -euo pipefail

if command -v node >/dev/null 2>&1; then
  echo "Node already installed: $(node -v)"
else
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi

node -v
npm -v

sudo npm install -g pm2
pm2 -v

echo "Node + PM2 ready."
