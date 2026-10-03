# Rollback Runbook

## Web production

Use the last verified Vercel production deployment or a Git revert PR. Avoid force-pushing `main`.

## Container runtime

1. Stop intake of new queue packets.
2. Preserve `agent_data` volume.
3. Record active lease and working packet IDs.
4. Roll image tag back to the last verified immutable digest.
5. Start one worker replica.
6. Verify heartbeat, queue, and dead-letter state.
7. Re-run smoke validation.
8. Emit rollback receipt.

Never delete the durable volume as part of routine rollback.
