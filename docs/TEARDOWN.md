# Teardown checklist

Run when the course says **tear down** so nothing keeps billing. Order matters.

## App / DNS

- [ ] Remove Razorpay webhook (`https://api.…/webhooks/razorpay`)
- [ ] Optional: take a final `pg_dump` and download it locally
- [ ] Delete Route 53 **A records** (apex, www, api, app)
- [ ] Delete Route 53 **hosted zone** (after records gone)
- [ ] Revert registrar nameservers if you will not keep the domain on Route 53

## Compute / network

- [ ] Disable/delete EventBridge rules (`ticketbox-ec2-stop` / `start`)
- [ ] Delete Lambda `ec2-schedule` (+ IAM role if unused)
- [ ] Disassociate + **release** Elastic IP
- [ ] Terminate EC2 instance (or stop + terminate)
- [ ] Delete unused security groups / key pairs if created only for this project

## Storage

- [ ] Empty + delete S3 banner bucket (or clear `banners/` prefix)
- [ ] Empty + delete S3 backup bucket/prefix
- [ ] Confirm EBS volumes attached to terminated instance are deleted (check Volumes)

## Secrets / local

- [ ] Rotate or delete IAM access keys used for the project
- [ ] Remove project `.env` from shared chats; keep a private archive if needed
- [ ] Confirm Billing shows no unexpected daily cost after 24–48h

## Do not forget

- Elastic IP left unattached can still cost money — **release** it
- Hosted zones bill monthly until deleted
- Certbot certs die with the instance — no action needed in Let's Encrypt
