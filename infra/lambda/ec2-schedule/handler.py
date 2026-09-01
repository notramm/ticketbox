"""
TicketBox Day 10 — start/stop a single EC2 instance on a schedule.

Env:
  INSTANCE_IDS  comma-separated instance ids (e.g. i-0abc...)
  AWS_REGION    default ap-south-1 (Lambda runtime also provides AWS_REGION)

Event payload (EventBridge target input):
  { "action": "stop" }  or  { "action": "start" }
"""

from __future__ import annotations

import os
from typing import Any

import boto3


def handler(event: dict[str, Any] | None, context: Any) -> dict[str, Any]:
    event = event or {}
    action = str(event.get("action") or os.environ.get("ACTION") or "stop").lower()
    raw_ids = os.environ.get("INSTANCE_IDS", "").strip()
    if not raw_ids:
        raise ValueError("INSTANCE_IDS env var is required")

    instance_ids = [i.strip() for i in raw_ids.split(",") if i.strip()]
    region = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "ap-south-1"
    ec2 = boto3.client("ec2", region_name=region)

    if action == "start":
        resp = ec2.start_instances(InstanceIds=instance_ids)
        state = "starting"
    elif action == "stop":
        resp = ec2.stop_instances(InstanceIds=instance_ids)
        state = "stopping"
    else:
        raise ValueError(f"Unsupported action: {action}")

    return {
        "ok": True,
        "action": action,
        "state": state,
        "instances": instance_ids,
        "response": resp.get("StoppingInstances") or resp.get("StartingInstances") or {},
    }
