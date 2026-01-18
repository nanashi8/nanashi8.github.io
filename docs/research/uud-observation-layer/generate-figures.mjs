import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const baseDir = resolve(process.cwd(), "docs", "research", "uud-observation-layer");
const metricsPath = resolve(baseDir, "metrics.sample.json");

const metrics = JSON.parse(readFileSync(metricsPath, "utf-8"));

const ablation = `xychart-beta\n    title "${metrics.ablation.title}"\n    x-axis [${metrics.ablation.labels.join(", ")}]\n    y-axis "${metrics.ablation.yTitle}" ${metrics.ablation.yMin} --> ${metrics.ablation.yMax}\n    bar [${metrics.ablation.gap.join(", ")}]\n`;

const stability = `xychart-beta\n    title "${metrics.stability.title}"\n    x-axis [${metrics.stability.labels.join(", ")}]\n    y-axis "${metrics.stability.yTitle}" ${metrics.stability.yMin} --> ${metrics.stability.yMax}\n    bar [${metrics.stability.variance.join(", ")}]\n`;

writeFileSync(resolve(baseDir, "uud-ablation-xy.mmd"), ablation);
writeFileSync(resolve(baseDir, "uud-stability-xy.mmd"), stability);
