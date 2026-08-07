#!/usr/bin/env bash
# Day 6 — add a second Linux user (e.g. Sahil) with their own SSH public key
# Usage:
#   export NEW_USER=sahil
#   export PUBKEY='ssh-ed25519 AAAA... sahil@laptop'
#   bash infra/scripts/04-add-ssh-user.sh
set -euo pipefail

NEW_USER="${NEW_USER:-}"
PUBKEY="${PUBKEY:-}"

if [[ -z "${NEW_USER}" || -z "${PUBKEY}" ]]; then
  echo "Usage:"
  echo "  export NEW_USER=sahil"
  echo "  export PUBKEY='ssh-ed25519 AAAA... comment'"
  echo "  bash infra/scripts/04-add-ssh-user.sh"
  exit 1
fi

if id "${NEW_USER}" >/dev/null 2>&1; then
  echo "User ${NEW_USER} already exists"
else
  sudo adduser --disabled-password --gecos "" "${NEW_USER}"
  sudo usermod -aG sudo "${NEW_USER}"
fi

sudo mkdir -p "/home/${NEW_USER}/.ssh"
echo "${PUBKEY}" | sudo tee "/home/${NEW_USER}/.ssh/authorized_keys" >/dev/null
sudo chmod 700 "/home/${NEW_USER}/.ssh"
sudo chmod 600 "/home/${NEW_USER}/.ssh/authorized_keys"
sudo chown -R "${NEW_USER}:${NEW_USER}" "/home/${NEW_USER}/.ssh"

echo "Done. ${NEW_USER} can SSH with their private key:"
echo "  ssh -i sahil-key.pem ${NEW_USER}@<EC2_PUBLIC_IP>"
