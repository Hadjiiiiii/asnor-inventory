import assert from "node:assert/strict";
import { test } from "node:test";
import { validateDemoTarget } from "./demo-target";

test("accepts only a separate PostgreSQL demo endpoint", () => {
  assert.equal(
    validateDemoTarget("postgresql://demo:x@ep-demo.us-east-1.aws.neon.tech/db", "postgresql://real:x@ep-real.us-east-1.aws.neon.tech/db").hostname,
    "ep-demo.us-east-1.aws.neon.tech",
  );
  assert.throws(() => validateDemoTarget(undefined, "postgresql://real:x@ep-real.neon.tech/db"));
  assert.throws(() => validateDemoTarget("not a url", undefined));
  assert.throws(() => validateDemoTarget("mysql://demo:x@ep-demo.neon.tech/db", undefined));
  assert.throws(() => validateDemoTarget(
    "postgresql://demo:x@ep-real.c-1.us-east-1.aws.neon.tech/other",
    "postgresql://real:x@ep-real-pooler.c-1.us-east-1.aws.neon.tech/db",
  ));
});
