# Day 10 — Ops wrap-up (auto-stop, backups, proof, teardown)

**PRD checkpoint:** EC2 auto-stops on a schedule; DB dumps land in S3 (or local + upload); budget/cost proof captured; architecture + RUNBOOK ready; teardown checklist written (run teardown only when the course says so).

| Deliverable | In repo | On AWS / EC2 |
|---|---|---|
| Lambda auto-stop / start | `infra/lambda/ec2-schedule/` | Deploy Lambda + EventBridge |
| `pg_dump` cron → S3 | `infra/scripts/11-pg-dump-backup.sh` | cron + IAM / bucket |
| Architecture diagram | `docs/ARCHITECTURE.md` | — |
| Cost / budget proof | `docs/COST_REPORT.md`, `BUDGET_PROOF.md` | Console screenshots |
| Teardown checklist | `docs/TEARDOWN.md` | Execute later if required |
| FTP vs rsync (graded) | `docs/FTP_VS_RSYNC.md` | — |
| RUNBOOK polish | `docs/RUNBOOK.md` | — |

**Not Day 10:** building new product features. Stop when the wrap-up artifacts above exist and the auto-stop + backup paths are documented/runnable.

---

## Prereqs (Day 9 done)

- [ ] HTTPS works on apex / api / app
- [ ] Test payment + live webhook succeeded
- [ ] Elastic IP still associated (auto-stop must not drop DNS)

---

## 1. Lambda auto-stop / start (save money overnight)

Code: `Backend/infra/lambda/ec2-schedule/handler.py`  
Deploy notes: `Backend/infra/lambda/ec2-schedule/README.md`

Suggested schedule (Asia/Kolkata) — **align with your course**; PRD example was ~9:00 PM IST weekdays:

| Rule | Action | Example (UTC) | ≈ IST |
|---|---|---|---|
| Evening | **stop** | `cron(30 15 ? * MON-FRI *)` | 9:00 PM IST (PRD) |
| Morning | **start** | `cron(30 2 * * ? *)` | 8:00 AM IST |

Or evening `cron(30 17 * * ? *)` ≈ 11:00 PM IST if the course allows. Convert IST → UTC carefully.

**Auto-fail:** do **not** attach `AmazonEC2FullAccess` / `AdministratorAccess` to the Lambda role — only `ec2:StopInstances` + `ec2:StartInstances` (+ optional `DescribeInstances`) on **this instance ARN**, plus basic CloudWatch logs.


```bash
ssh … 'pm2 status && sudo systemctl status nginx --no-pager'
curl -sI https://yourdomain.com | head
```

Elastic IP stays attached across stop/start — that is why Day 8 required it.

---

## 2. Nightly `pg_dump` → S3

On the EC2 box:

```bash
cd ~/ticketbox/Backend
# Prefer reading DATABASE_URL from .env — see script header
sudo mkdir -p /var/backups/ticketbox
sudo chown ubuntu:ubuntu /var/backups/ticketbox

export BACKUP_S3_URI=s3://YOUR_BACKUP_BUCKET/ticketbox/db/
bash infra/scripts/11-pg-dump-backup.sh
```

Install cron (example — 2:15 AM server local time):

```cron
15 2 * * * cd /home/ubuntu/ticketbox/Backend && set -a && . ./.env && set +a && BACKUP_S3_URI=s3://YOUR_BACKUP_BUCKET/ticketbox/db/ bash infra/scripts/11-pg-dump-backup.sh >> /var/log/ticketbox-backup.log 2>&1
```

Restore drill (optional but good):

```bash
bash infra/scripts/12-restore-from-dump.sh /var/backups/ticketbox/ticketbox-YYYY-MM-DD.dump
```

Use a **separate** S3 bucket for backups if possible (not the public banner bucket). IAM: `s3:PutObject` (and `GetObject` for restore) on `arn:aws:s3:::YOUR_BACKUP_BUCKET/ticketbox/db/*`.

---

## 3. Budget proof + cost report

1. Fill [`COST_REPORT.md`](./COST_REPORT.md) with actual line items (EC2, EBS, EIP, Route 53, S3, data transfer, domain).
2. Capture AWS Billing / Cost Explorer screenshots → attach to [`BUDGET_PROOF.md`](./BUDGET_PROOF.md) (or your shared drive; do not commit secrets).
3. Note free-tier vs paid and the overnight stop savings story.

---

## 4. Architecture diagram

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) — export PNG/PDF for the report if the PRD asks for an image.

---

## 5. Teardown checklist

When the course says tear down (not necessarily today): follow [`TEARDOWN.md`](./TEARDOWN.md) so nothing keeps billing.

---

## Verify checkpoint

- [ ] EventBridge → Lambda stop/start tested once (manual invoke OK)
- [ ] One successful `pg_dump` file exists; S3 object present if configured
- [ ] Cost report + budget screenshots filled
- [ ] Architecture diagram linked from RUNBOOK
- [ ] Teardown checklist ready (execution optional until asked)

---

## Stop here

Day 10 ends when the **ops wrap-up pack** is in the repo and auto-stop + backup are documented (and ideally run once).

There is no Day 11 in this Week 2 track — course submission / teardown follows the PRD calendar.
