export function validateBenchmarkTarget(
  benchmarkUrl: string | undefined,
  activeDatabaseUrl: string | undefined,
  vercelEnvironment: string | undefined,
) {
  if (vercelEnvironment === "production") {
    throw new Error("Benchmark data seeding is disabled in the Vercel Production environment.");
  }

  if (!benchmarkUrl) {
    throw new Error("Set BENCHMARK_DATABASE_URL to an isolated staging database before seeding.");
  }

  let target: URL;
  try {
    target = new URL(benchmarkUrl);
  } catch {
    throw new Error("BENCHMARK_DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  if (target.protocol !== "postgres:" && target.protocol !== "postgresql:") {
    throw new Error("BENCHMARK_DATABASE_URL must use PostgreSQL.");
  }

  if (activeDatabaseUrl) {
    let active: URL;
    try {
      active = new URL(activeDatabaseUrl);
    } catch {
      throw new Error("Could not verify the active database endpoint; refusing to seed.");
    }

    const targetHost = target.hostname.replace(/-pooler(?=\.|$)/, "");
    const activeHost = active.hostname.replace(/-pooler(?=\.|$)/, "");
    if (targetHost === activeHost) {
      throw new Error("The benchmark database must use a separate endpoint from the active database.");
    }
  }

  return target;
}
