import "dotenv/config";
import dotenv from "dotenv";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { validateDemoTarget } from "../src/lib/demo-target";

dotenv.config({ path: ".env.demo.local", quiet: true });

try {
  const demoUrl = validateDemoTarget(process.env.DEMO_DATABASE_URL, process.env.DATABASE_URL).toString();

  console.log("Pushing the Prisma schema to the demo database.");
  const result = spawnSync(resolve("node_modules/.bin/prisma"), ["db", "push"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: demoUrl },
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(`Demo schema setup failed: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
}
