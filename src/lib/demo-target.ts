/**
 * The demo seed wipes the database it runs against, so it only runs against DEMO_DATABASE_URL,
 * and refuses when that points at the same Neon endpoint as the app's own DATABASE_URL.
 */
export function validateDemoTarget(demoUrl: string | undefined, activeDatabaseUrl: string | undefined) {
  if (!demoUrl) {
    throw new Error("Set DEMO_DATABASE_URL (in .env.demo.local) to the separate demo database first.");
  }

  let target: URL;
  try {
    target = new URL(demoUrl);
  } catch {
    throw new Error("DEMO_DATABASE_URL must be a valid PostgreSQL connection URL.");
  }
  if (target.protocol !== "postgres:" && target.protocol !== "postgresql:") {
    throw new Error("DEMO_DATABASE_URL must use PostgreSQL.");
  }

  if (activeDatabaseUrl) {
    let active: URL;
    try {
      active = new URL(activeDatabaseUrl);
    } catch {
      throw new Error("Could not read DATABASE_URL to compare it; refusing to touch the demo target.");
    }
    // Neon's pooled and direct hosts differ only by "-pooler", so compare without it.
    const strip = (host: string) => host.replace(/-pooler(?=\.|$)/, "");
    if (strip(target.hostname) === strip(active.hostname)) {
      throw new Error("DEMO_DATABASE_URL points at the same database server as DATABASE_URL; refusing.");
    }
  }

  return target;
}
