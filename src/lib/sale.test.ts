import assert from "node:assert/strict";
import test from "node:test";
import { UNDO_WINDOW_MS, localDateString, matchProducts, parseSaleDate, saleProfit, undoBlocker } from "./sale";

test("profit is price minus cost times quantity, rounded to cents", () => {
  assert.equal(saleProfit(480, 385, 1), 95);
  assert.equal(saleProfit(10.1, 3.05, 3), 21.15);
  assert.equal(saleProfit(0.1 + 0.2, 0, 1), 0.3);
});

test("a sale below cost is a negative profit", () => {
  assert.equal(saleProfit(300, 320, 1), -20);
});

test("unknown cost gives unknown profit, not full-price profit", () => {
  assert.equal(saleProfit(480, null, 1), null);
  assert.equal(saleProfit(480, 0, 1), 480);
});

test("local date uses the calendar fields, not UTC", () => {
  // 23:30 local on 5 March is still 5 March whatever UTC says.
  assert.equal(localDateString(new Date(2026, 2, 5, 23, 30)), "2026-03-05");
  assert.equal(localDateString(new Date(2026, 0, 1, 0, 5)), "2026-01-01");
});

test("sale dates must be real YYYY-MM-DD days", () => {
  assert.equal(parseSaleDate("2026-10-13")?.toISOString(), "2026-10-13T12:00:00.000Z");
  assert.equal(parseSaleDate("2026-02-30"), null);
  assert.equal(parseSaleDate("13/10/2026"), null);
  assert.equal(parseSaleDate(""), null);
});

const stock = [
  { name: "iPhone 14 128GB", serialNumber: "F2LXK1", imei: "356938035643809", brand: "Apple" },
  { name: "Galaxy S23", serialNumber: "R5CT12", imei: null, brand: "Samsung" },
  { name: "AirPods Pro", serialNumber: null, imei: null, brand: "Apple" },
  { name: "Pixel 8 iPhone-case", serialNumber: null, imei: null, brand: null },
];

test("an exact serial or IMEI beats a name match", () => {
  assert.equal(matchProducts(stock, "356938035643809")[0].name, "iPhone 14 128GB");
  assert.equal(matchProducts(stock, "r5ct12")[0].name, "Galaxy S23");
});

test("name prefixes rank above mid-name matches, and brand matches are found", () => {
  assert.deepEqual(matchProducts(stock, "iphone").map((p) => p.name), ["iPhone 14 128GB", "Pixel 8 iPhone-case"]);
  assert.deepEqual(matchProducts(stock, "samsung").map((p) => p.name), ["Galaxy S23"]);
});

test("empty and unmatched queries behave", () => {
  assert.equal(matchProducts(stock, "   ").length, 4);
  assert.equal(matchProducts(stock, "zzz").length, 0);
  assert.equal(matchProducts(stock, "a", 2).length, 2);
});

test("a fresh sale that is still the latest can be undone", () => {
  const sale = { id: "t1", createdAt: new Date(1_000_000) };
  assert.equal(undoBlocker(sale, "t1", 1_000_000 + 60_000), null);
  assert.equal(undoBlocker(sale, "t1", 1_000_000 + UNDO_WINDOW_MS), null);
});

test("an old sale cannot be undone, whatever else is true", () => {
  const sale = { id: "t1", createdAt: new Date(1_000_000) };
  assert.match(undoBlocker(sale, "t1", 1_000_000 + UNDO_WINDOW_MS + 1) ?? "", /more than 10 minutes/);
});

test("a sale followed by another transaction cannot be undone", () => {
  const sale = { id: "t1", createdAt: new Date(1_000_000) };
  assert.match(undoBlocker(sale, "t2", 1_000_000 + 1000) ?? "", /Something else/);
  assert.match(undoBlocker(sale, undefined, 1_000_000 + 1000) ?? "", /Something else/);
});
