import assert from "node:assert/strict";
import test from "node:test";
import { localDateString, matchProducts, parseSaleDate, saleProfit } from "./sale";

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
