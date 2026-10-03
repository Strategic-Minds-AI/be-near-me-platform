#!/usr/bin/env bash
set -euo pipefail

service="super-agent"
sha="${GITHUB_SHA:-local}"
safe_key="ci-runtime-${sha}"
protected_key="ci-protected-${sha}"

wait_for_file() {
  local file="$1"
  for _ in $(seq 1 30); do
    if docker compose exec -T "$service" sh -lc "test -f '$file'"; then
      return 0
    fi
    sleep 1
  done
  echo "Timed out waiting for $file" >&2
  return 1
}

write_packet() {
  local file="$1"
  local payload="$2"
  printf '%s
' "$payload" | docker compose exec -T "$service" sh -lc "cat > '$file'"
}

safe_packet=$(cat <<JSON
{"id":"ci-runtime","project_id":"BNM-EA-V1","action_class":"READ","task_type":"runtime_snapshot","idempotency_key":"$safe_key","max_attempts":1,"timeout_ms":30000}
JSON
)

write_packet "/data/queue/pending/ci-runtime.json" "$safe_packet"
wait_for_file "/data/queue/done/ci-runtime.json"
wait_for_file "/data/receipts/$safe_key.json"

docker compose exec -T "$service" node -e "
  const fs=require('fs');
  const r=JSON.parse(fs.readFileSync('/data/receipts/$safe_key.json','utf8'));
  if(r.status!=='PASS') { console.error(r); process.exit(1); }
  if(r.task_type!=='runtime_snapshot') process.exit(1);
"

before_hash=$(docker compose exec -T "$service" sha256sum "/data/receipts/$safe_key.json" | awk '{print $1}')

duplicate_packet=$(cat <<JSON
{"id":"ci-runtime-duplicate","project_id":"BNM-EA-V1","action_class":"READ","task_type":"runtime_snapshot","idempotency_key":"$safe_key","max_attempts":1,"timeout_ms":30000}
JSON
)
write_packet "/data/queue/pending/ci-runtime-duplicate.json" "$duplicate_packet"
wait_for_file "/data/queue/done/ci-runtime-duplicate.json"
after_hash=$(docker compose exec -T "$service" sha256sum "/data/receipts/$safe_key.json" | awk '{print $1}')
test "$before_hash" = "$after_hash"

protected_packet=$(cat <<JSON
{"id":"ci-protected","project_id":"BNM-EA-V1","action_class":"PROTECTED","task_type":"runtime_snapshot","idempotency_key":"$protected_key","max_attempts":1,"timeout_ms":30000}
JSON
)
write_packet "/data/queue/pending/ci-protected.json" "$protected_packet"
wait_for_file "/data/queue/blocked/ci-protected.json"
wait_for_file "/data/receipts/blocked-ci-protected.json"

docker compose exec -T "$service" node -e "
  const fs=require('fs');
  const r=JSON.parse(fs.readFileSync('/data/receipts/blocked-ci-protected.json','utf8'));
  if(r.status!=='BLOCKED') { console.error(r); process.exit(1); }
"

docker compose exec -T "$service" test -f /data/state/heartbeat.json
heartbeat_before=$(docker compose exec -T "$service" sha256sum /data/state/heartbeat.json | awk '{print $1}')

docker compose restart "$service"

for _ in $(seq 1 30); do
  if docker compose exec -T "$service" node ops/super-agent/healthcheck.mjs >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

docker compose exec -T "$service" node ops/super-agent/healthcheck.mjs
wait_for_file "/data/receipts/$safe_key.json"
restart_hash=$(docker compose exec -T "$service" sha256sum "/data/receipts/$safe_key.json" | awk '{print $1}')
test "$before_hash" = "$restart_hash"

docker compose exec -T "$service" node -e "
  fetch('http://127.0.0.1:'+(process.env.PORT||process.env.AGENT_HTTP_PORT||8787)+'/readyz')
    .then(async r=>{const b=await r.json(); console.log(JSON.stringify(b)); if(!r.ok||!b.ready) process.exit(1)})
    .catch(e=>{console.error(e);process.exit(1)})
"

heartbeat_after=$(docker compose exec -T "$service" sha256sum /data/state/heartbeat.json | awk '{print $1}')
test "$heartbeat_before" != "$heartbeat_after"

echo "Super-Agent persistence contract: PASS"
