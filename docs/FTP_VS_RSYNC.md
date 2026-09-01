# FTP/SFTP-only deploy vs rsync (or proper release process)

**Graded deliverable (PRD).** Why “upload files with FileZilla and hope” is not enough for production.

## What SFTP-only looks like

1. Build admin `dist/` (or copy Backend files) on a laptop  
2. Drag-drop over SFTP into `/var/www/admin` or the app directory  
3. Restart nothing / restart PM2 by hand if you remember  

That works for **Day 6–7 first upload**. It fails as a long-term deploy strategy.

## Why SFTP-only is wrong

| Problem | What happens |
|---|---|
| **No atomic release** | Half the new files land while nginx still serves old `index.html` → broken SPA / mixed asset hashes |
| **No rollback** | Yesterday’s working `dist/` is gone unless you kept a zip. Outage = rebuild from memory |
| **No audit trail** | “Who deployed what, when?” — SFTP has no commit SHA, no changelog |
| **Broken mid-upload** | Laptop sleep, Wi‑Fi drop, or FileZilla timeout leaves a corrupt tree |
| **Config drift** | Someone edits `.env` or nginx on the box; laptop copy disagrees; nobody knows truth |
| **Secrets risk** | Easy to accidentally upload `.env`, `.pem`, or `node_modules` |

## Better patterns (pick one and defend it)

1. **rsync over SSH** with `--delete` into a **versioned release dir**, then `ln -sfn` to `current` (atomic cutover)  
2. **Git pull + `npm ci` + `pm2 reload`** on the server from a tagged commit (still document who can SSH)  
3. **CI artifact** (zip/tarball of `dist/` + Backend) uploaded once, extracted to a release folder  

For TicketBox Week 2, a practical minimum is:

- Keep every admin build as `deploy/artifacts/admin-dist-YYYYMMDD.zip`  
- On the server, extract to `/var/www/admin-releases/<stamp>/`, then symlink `/var/www/admin` → that folder  
- Backend deploys only from a known git branch/tag (`day-9`, etc.), never random edited files

## What we still use SFTP for

- First bootstrap of `/var/www/admin` (Day 6)  
- Emergency one-off fixes when CI is not set up  

SFTP is a **tool**, not a **release process**.
