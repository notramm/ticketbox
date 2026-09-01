#!/usr/bin/env bash
# Day 6 — create 1G swap BEFORE installing Node/Postgres heavy packages
set -euo pipefail

if swapon --show | grep -q '/swapfile'; then
  echo "Swap already active:"
  free -m
  exit 0
fi

if [[ -f /swapfile ]]; then
  echo "/swapfile exists but is not active — enabling"
else
  sudo fallocate -l 1G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
fi

sudo swapon /swapfile

if ! grep -q '^/swapfile ' /etc/fstab; then
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "Swap ready:"
free -m
