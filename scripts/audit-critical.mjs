import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["audit", "--omit=dev", "--json"], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

let report;
try {
  report = JSON.parse(result.stdout || "{}");
} catch (error) {
  console.error("Could not parse npm audit JSON.");
  console.error(result.stdout || result.stderr || error.message);
  process.exit(2);
}

const vulnerabilities = Object.entries(report.vulnerabilities || {}).map(([name, value]) => ({
  name,
  severity: value?.severity || "unknown",
  isDirect: Boolean(value?.isDirect),
  range: value?.range || null,
  fixAvailable: value?.fixAvailable ?? null,
  via: Array.isArray(value?.via)
    ? value.via.map((item) =>
        typeof item === "string"
          ? item
          : {
              source: item?.source,
              name: item?.name,
              severity: item?.severity,
              title: item?.title,
              url: item?.url,
              range: item?.range,
            }
      )
    : [],
}));

const critical = vulnerabilities.filter((item) => item.severity === "critical");
const metadata = report.metadata?.vulnerabilities || {};

console.log("npm audit production dependency summary");
console.log(JSON.stringify(metadata, null, 2));

if (critical.length) {
  console.error("\nCRITICAL VULNERABILITIES");
  console.error(JSON.stringify(critical, null, 2));
  process.exit(1);
}

console.log("\nPASS: no critical production dependency vulnerabilities.");
