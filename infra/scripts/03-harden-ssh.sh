#!/usr/bin/env bash
# Day 6 — basic SSH hardening (no root login, key-only)
# Run AFTER you confirm YOUR key login works as ubuntu/deploy user.
set -euo pipefail

SSHD_CONFIG="/etc/ssh/sshd_config"
BACKUP="/etc/ssh/sshd_config.bak.ticketbox.$(date +%Y%m%d%H%M%S)"

echo "Backing up sshd_config → ${BACKUP}"
sudo cp "${SSHD_CONFIG}" "${BACKUP}"

sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' "${SSHD_CONFIG}"
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' "${SSHD_CONFIG}"
sudo sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' "${SSHD_CONFIG}"
sudo sed -i 's/^#\?ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' "${SSHD_CONFIG}"

if ! sudo grep -q '^PermitRootLogin ' "${SSHD_CONFIG}"; then
  echo 'PermitRootLogin no' | sudo tee -a "${SSHD_CONFIG}" >/dev/null
fi
if ! sudo grep -q '^PasswordAuthentication ' "${SSHD_CONFIG}"; then
  echo 'PasswordAuthentication no' | sudo tee -a "${SSHD_CONFIG}" >/dev/null
fi

# Validate config before restart
sudo sshd -t
sudo systemctl reload ssh || sudo systemctl reload sshd

echo "SSH hardened:"
echo "  PermitRootLogin no"
echo "  PasswordAuthentication no"
echo "Keep this SSH session open and test a NEW session before closing."
