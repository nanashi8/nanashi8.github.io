#!/usr/bin/env node

// Reads `npm audit --json` output from stdin and prints a compact summary.

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  let data;
  try {
    data = JSON.parse(input);
  } catch {
    console.error("npm-audit-summary: failed to parse JSON from stdin");
    process.exitCode = 2;
    return;
  }

  const meta = data.metadata ?? {};
  const severityCounts = meta.vulnerabilities ?? null;

  const entries = [];

  // npm v6
  if (data.advisories && typeof data.advisories === "object") {
    for (const adv of Object.values(data.advisories)) {
      if (!adv || typeof adv !== "object") continue;
      entries.push({
        name: adv.module_name,
        severity: adv.severity,
        title: adv.title,
      });
    }
  }

  // npm v7+
  if (data.vulnerabilities && typeof data.vulnerabilities === "object") {
    for (const [name, v] of Object.entries(data.vulnerabilities)) {
      if (!v || typeof v !== "object") continue;
      const via = v.via;
      if (Array.isArray(via)) {
        for (const item of via) {
          if (item && typeof item === "object" && item.title) {
            entries.push({
              name,
              severity: item.severity,
              title: item.title,
            });
          }
        }
      }
    }
  }

  const entryCounts = {};
  for (const e of entries) {
    const s = e.severity ?? "unknown";
    entryCounts[s] = (entryCounts[s] ?? 0) + 1;
  }

  const sevOrder = { critical: 4, high: 3, moderate: 2, low: 1, info: 0 };
  entries.sort(
    (a, b) => (sevOrder[b.severity] ?? -1) - (sevOrder[a.severity] ?? -1)
  );

  const top = entries.slice(0, 20);

  if (severityCounts) console.log("severityCounts", severityCounts);
  console.log("entryCounts", entryCounts);
  console.log("top20", top);
});

process.stdin.resume();
