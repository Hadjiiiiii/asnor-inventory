import assert from "node:assert/strict";
import { test } from "node:test";
import { shouldEnablePreviewSpeedInsights } from "./preview-speed-insights";

test("enables Vercel Speed Insights only for Preview deployments", () => {
  assert.equal(shouldEnablePreviewSpeedInsights("preview"), true);
  assert.equal(shouldEnablePreviewSpeedInsights("production"), false);
  assert.equal(shouldEnablePreviewSpeedInsights(undefined), false);
});
