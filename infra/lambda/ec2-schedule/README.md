# Day 10 — EC2 schedule Lambda (auto-stop / auto-start)

Stops the TicketBox EC2 at night and starts it in the morning so the Elastic IP keeps DNS stable without paying for idle compute.

## What to create in AWS (console or CLI)

1. **IAM role** for Lambda (`ticketbox-ec2-scheduler-role`)
   - Trust: `lambda.amazonaws.com`
   - Permissions (**scoped — auto-fail if you use EC2FullAccess**):
     - `ec2:StartInstances`, `ec2:StopInstances` on  
       `arn:aws:ec2:ap-south-1:<account-id>:instance/<instance-id>`
     - Optional: `ec2:DescribeInstances` on that instance (or account EC2 read for debugging)
     - `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`  
       (or managed `AWSLambdaBasicExecutionRole`)
2. **Lambda function**
   - Runtime: Python 3.12 (or Node — same idea)
   - Handler: `handler.handler`
   - Upload `handler.py` (zip single file or use inline editor)
   - Env:
     - `INSTANCE_IDS=i-xxxxxxxx`
     - `AWS_REGION=ap-south-1` (optional; runtime sets region)
   - Timeout: 30s · Memory: 128 MB
3. **EventBridge rules** (two rules → same function, different constant JSON input)

| Name | Schedule (UTC examples) | Input |
|---|---|---|
| `ticketbox-ec2-stop` | `cron(30 15 ? * MON-FRI *)` ≈ 9:00 PM IST (PRD) | `{"action":"stop"}` |
| `ticketbox-ec2-start` | `cron(30 2 * * ? *)` ≈ 8:00 AM IST | `{"action":"start"}` |

Convert IST → UTC carefully for your course window. Alternate stop: `cron(30 17 * * ? *)` ≈ 11:00 PM IST.

4. **Test**
   - Lambda → Test with `{"action":"stop"}` then `{"action":"start"}`
   - Confirm Elastic IP still associated after stop
   - After start: SSH + `pm2 status` + `curl -sI https://yourdomain.com`

## Zip from laptop (optional)

```bash
cd Backend/infra/lambda/ec2-schedule
zip function.zip handler.py
# Upload function.zip in Lambda console
```

## Notes

- Do **not** terminate the instance from Lambda — only stop/start.
- Keep the Elastic IP association; re-associating after every start is painful.
- If PM2 does not come back after start, enable `pm2 startup` + `pm2 save` (Day 7).
