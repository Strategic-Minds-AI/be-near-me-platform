const port = Number(process.env.AGENT_HTTP_PORT || 8787);
try {
  const response = await fetch("http://127.0.0.1:" + port + "/healthz", { signal: AbortSignal.timeout(3000) });
  if (!response.ok) process.exit(1);
  const body = await response.json();
  if (!body?.ok) process.exit(1);
  process.exit(0);
} catch {
  process.exit(1);
}
