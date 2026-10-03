import { spawn } from "node:child_process";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function child(args) {
  return spawn(process.execPath, args, {
    env: process.env,
    stdio: "inherit",
  });
}

function exitCode(proc) {
  if (proc.exitCode !== null) {
    return Promise.resolve({ code: proc.exitCode, signal: proc.signalCode });
  }
  return new Promise((resolve, reject) => {
    proc.once("error", reject);
    proc.once("exit", (code, signal) => resolve({ code, signal }));
  });
}

const supervisor = child(["ops/super-agent/supervisor.mjs"]);

try {
  await sleep(3000);
  if (supervisor.exitCode !== null) {
    process.exit(supervisor.exitCode || 1);
  }
  const validator = child(["scripts/validate-super-agent-runtime.mjs"]);
  const result = await exitCode(validator);
  if (result.code !== 0) {
    supervisor.kill("SIGTERM");
    process.exit(result.code || 1);
  }
  console.log(JSON.stringify({ event: "production_canary_pass" }));
  const final = await exitCode(supervisor);
  process.exit(final.code || 0);
} catch (error) {
  supervisor.kill("SIGTERM");
  console.error(error);
  process.exit(1);
}
