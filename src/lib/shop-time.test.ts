import assert from "node:assert/strict";
import test from "node:test";
import { shopDate, shopDayStart } from "./shop-time";

const NY = "America/New_York";

test("an evening sale in New York is still that day, though UTC has rolled over", () => {
  // 9pm on 13 Oct in New York (EDT, UTC-4) is 01:00 UTC on the 14th.
  const at = new Date("2026-10-14T01:00:00Z");
  assert.deepEqual(shopDate(at, NY), { year: 2026, month: 10, day: 13 });
  assert.deepEqual(shopDate(at, "UTC"), { year: 2026, month: 10, day: 14 });
});

test("day start is local midnight, in winter and summer time", () => {
  assert.equal(shopDayStart(2026, 10, 13, NY).toISOString(), "2026-10-13T04:00:00.000Z");
  assert.equal(shopDayStart(2026, 1, 15, NY).toISOString(), "2026-01-15T05:00:00.000Z");
});

test("day start is correct on the day clocks change", () => {
  // US clocks go back on 1 Nov 2026: midnight is still EDT, the next midnight is EST.
  assert.equal(shopDayStart(2026, 11, 1, NY).toISOString(), "2026-11-01T04:00:00.000Z");
  assert.equal(shopDayStart(2026, 11, 2, NY).toISOString(), "2026-11-02T05:00:00.000Z");
});

test("month and day overflow like Date does", () => {
  assert.equal(shopDayStart(2026, 0, 1, NY).toISOString(), shopDayStart(2025, 12, 1, NY).toISOString());
  assert.equal(shopDayStart(2026, 3, 0, NY).toISOString(), shopDayStart(2026, 2, 28, NY).toISOString());
});

test("a zone ahead of UTC starts the day earlier in UTC terms", () => {
  assert.equal(shopDayStart(2026, 10, 13, "Pacific/Auckland").toISOString(), "2026-10-12T11:00:00.000Z");
});
