import assert from "node:assert/strict";
import { test } from "node:test";
import { validateBenchmarkTarget } from "./benchmark-target";

test("accepts only a separate PostgreSQL benchmark endpoint outside production", () => {
  assert.equal(
    validateBenchmarkTarget(
      "postgresql://stage:secret@sea-staging.example/db",
      "postgresql://active:secret@use1.example/db",
      "preview",
    ).hostname,
    "sea-staging.example",
  );
  assert.throws(() => validateBenchmarkTarget(undefined, "postgresql://active:secret@use1.example/db", "preview"));
  assert.throws(() => validateBenchmarkTarget("postgresql://active:secret@use1.example/db", undefined, "production"));
  assert.throws(() => validateBenchmarkTarget(
    "postgresql://stage:secret@use1.example/other-db",
    "postgresql://active:secret@use1.example/db",
    "preview",
  ));
  assert.throws(() => validateBenchmarkTarget(
    "postgresql://stage@ep-example.c-1.us-east-1.aws.neon.tech/db",
    "postgresql://active@ep-example-pooler.c-1.us-east-1.aws.neon.tech/db",
    "preview",
  ));
});
