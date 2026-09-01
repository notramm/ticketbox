# Day 6 — EC2 bootstrap checklist

Checkpoint from PRD: **Both can SSH. Postgres running. Swap active (`free -m`).**

## Non-coding (AWS Console) — do this first

1. **Region:** `ap-south-1` (Mumbai) only.
2. **Budget alerts** (if not done): Billing → Budgets → $5 and $10 email alerts.
3. **Key pair:** Create / download `.pem` (Ram). Optionally create a second key for Sahil, or share one carefully and migrate later.
4. **Security Group** (`ticketbox-sg`):
   - Inbound **22** → *My IP* only (not `0.0.0.0/0`)
   - Inbound **80** → `0.0.0.0/0`
   - Inbound **443** → `0.0.0.0/0`
   - **Do not** open 3000 or 4000
5. **Launch EC2:**
   - AMI: Ubuntu Server 24.04 LTS
   - Type: `t3.micro`
   - Storage: 20 GB gp3
   - Attach `ticketbox-sg`
   - Use your key pair
6. Note the **public IPv4**. SSH immediately.

## Local machine (before SSH)

```bash
# Windows (Git Bash / WSL) — lock down key perms
chmod 400 ~/Downloads/ticketbox-key.pem

ssh -i ~/Downloads/ticketbox-key.pem ubuntu@<EC2_PUBLIC_IP>
```

If Windows OpenSSH rejects the key permissions, move the `.pem` into `C:\Users\<you>\.ssh\` and remove inheritance / grant only your user Read.

## On the server (coding helpers in repo)

Copy the repo (or just `infra/scripts`) onto the box, then:

```bash
export DB_PASSWORD='choose-a-strong-db-password'
bash infra/scripts/day6-bootstrap.sh
```

Or step by step:

```bash
bash infra/scripts/01-swap.sh
export DB_PASSWORD='...'
bash infra/scripts/02-postgres.sh
```

### Second engineer SSH (Sahil)

On Sahil’s laptop, generate a key if needed:

```bash
ssh-keygen -t ed25519 -C "sahil@ticketbox"
```

On the server (as ubuntu):

```bash
export NEW_USER=sahil
export PUBKEY='paste-sahil-public-key-here'
bash infra/scripts/04-add-ssh-user.sh
```

Sahil tests:

```bash
ssh -i ~/.ssh/id_ed25519 sahil@<EC2_PUBLIC_IP>
```

### Harden SSH (last)

Only after **both** Ram and Sahil have a working SSH session:

```bash
bash infra/scripts/03-harden-ssh.sh
```

Keep the old session open; open a **new** terminal and confirm login still works.

## Verify checkpoint

```bash
free -m                    # Swap total ~1024
sudo systemctl status postgresql
sudo -u postgres psql -c '\l' | grep ticketbox
sudo ufw status            # 22/80/443 only
```

## Not today (Day 7+)

- Node.js / PM2 / nginx
- Domain / Route 53 / Elastic IP / SSL
- Deploying the TicketBox app
