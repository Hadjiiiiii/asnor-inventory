import "dotenv/config";
import dotenv from "dotenv";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { validateBenchmarkTarget } from "../src/lib/benchmark-target";

dotenv.config({ path: ".env.benchmark.local", quiet: true });

try {
  const benchmarkUrl = validateBenchmarkTarget(
    process.env.BENCHMARK_DATABASE_URL,
    process.env.DATABASE_URL,
    process.env.VERCEL_ENV,
  ).toString();

  console.log("Pushing the Prisma schema to the isolated benchmark database.");
  const result = spawnSync(
    resolve("node_modules/.bin/prisma"),
    ["db", "push"],
    {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: benchmarkUrl },
      stdio: "inherit",
    },
  );

  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} catch (error) {
  const errorName = error instanceof Error ? error.name : "UnknownError";
  console.error(`Benchmark schema setup failed (${errorName}); no connection details were printed.`);
  process.exitCode = 1;
}
