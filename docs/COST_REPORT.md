# TicketBox cost report (Week 2)

Fill with **your** account numbers. Currency: INR (or USD — stay consistent). Keep receipts for the domain.

| Line item | Est. / month | Actual (this week) | Notes |
|---|---:|---:|---|
| EC2 (t2/t3.micro or class size) | | | Hours running after auto-stop |
| EBS root volume | | | Size / type |
| Elastic IP (associated) | | | Free while associated to running/stopped instance per AWS rules — verify |
| Route 53 hosted zone | | | |
| S3 banners | | | Storage + PUT/GET |
| S3 DB backups | | | |
| Data transfer | | | Usually small for demo |
| Domain registrar | | | One-time / annual |
| Razorpay | | | Test mode ≈ ₹0 |
| **Total** | | | |

## Auto-stop savings (story)

- Without stop: ~730 hours/month × instance rate  
- With nightly stop (example 9 hours off): ~270 hours saved  
- Note your actual stop/start window from EventBridge rules

## Screenshots / exports

Link or attach (do not commit secrets):

- [ ] Cost Explorer — last 7 days  
- [ ] Billing → Bills / Free Tier  
- [ ] EC2 instance type + Elastic IP console  

See also [`BUDGET_PROOF.md`](./BUDGET_PROOF.md).
