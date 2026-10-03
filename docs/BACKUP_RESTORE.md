# Backup and Restore

## What must persist

Railway volume mount: `/data`

Contains:
- queue state
- dead-letter/blocked work
- receipts
- heartbeat
- supervisor lease

## Backup

Before a runtime migration or destructive maintenance window:
1. stop queue intake
2. wait for /queue/working to drain
3. capture a volume snapshot/export using the hosting provider's supported mechanism
4. record source SHA, image digest, heartbeat and queue counts
5. validate the backup artifact exists before proceeding

## Restore

1. deploy the exact previously validated image/SHA
2. mount the restored data at /data
3. ensure only one worker replica starts
4. remove only a demonstrably expired stale lease
5. verify /healthz and /readyz
6. verify prior receipt hashes
7. enqueue one safe runtime_snapshot canary
8. confirm idempotency and next heartbeat
9. emit restore receipt

Never treat deleting the volume as a normal rollback.
