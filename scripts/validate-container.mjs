const base = (process.argv[2] || process.env.VALIDATION_BASE_URL || "http://127.0.0.1:8080").replace(/\/$/, "");
const paths = [
  "/healthz",
  "/home","/nearby","/challenge","/create","/search","/profile",
  "/creator-studio","/ai-coach","/rewards","/reward-checkout/bottle",
  "/manifest.json","/sw.js","/icon.svg"
];

let failed = false;
for (const path of paths) {
  try {
    const response = await fetch(base + path, { redirect: "follow", signal: AbortSignal.timeout(10000) });
    const ok = response.status >= 200 && response.status < 400;
    console.log(JSON.stringify({ path, status: response.status, ok, content_type: response.headers.get("content-type") }));
    if (!ok) failed = true;
  } catch (error) {
    console.error(JSON.stringify({ path, ok: false, error: String(error.message || error) }));
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
