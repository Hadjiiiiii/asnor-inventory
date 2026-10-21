import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDemoData } from "./demo-data";

const now = new Date("2026-10-20T15:00:00.000Z");

test("is deterministic for the same date", () => {
  assert.deepEqual(buildDemoData(now), buildDemoData(now));
});

test("builds a consistent shop", () => {
  const { products, transactions, contacts } = buildDemoData(now);
  const byId = new Map(products.map((p) => [p.id, p]));

  const serials = products.flatMap((p) => (p.serialNumber ? [p.serialNumber] : []));
  const imeis = products.flatMap((p) => (p.imei ? [p.imei] : []));
  assert.equal(new Set(serials).size, serials.length, "serial numbers are unique");
  assert.equal(new Set(imeis).size, imeis.length, "IMEIs are unique");

  const contactIds = new Set(contacts.map((c) => c.id));
  for (const t of transactions) {
    const p = byId.get(t.productId);
    assert.ok(p, `transaction ${t.id} has a product`);
    if (t.contactId) assert.ok(contactIds.has(t.contactId));
    assert.ok(t.date.getTime() <= now.getTime(), "no future transactions");
    assert.equal(t.totalPrice, Math.round(t.unitPrice * t.quantity * 100) / 100);
    if (t.type === "SELL") {
      assert.equal(t.profit, Math.round((t.unitPrice - p!.purchasePrice) * t.quantity * 100) / 100);
      const buy = transactions.find((b) => b.type === "BUY" && b.productId === t.productId)!;
      assert.ok(buy.date.getTime() <= t.date.getTime(), "bought before sold");
    }
  }

  for (const p of products) {
    const sells = transactions.filter((t) => t.type === "SELL" && t.productId === p.id);
    if (p.type === "DEVICE") assert.equal(sells.length, p.status === "SOLD" ? 1 : 0);
    else {
      const bought = transactions.filter((t) => t.type === "BUY" && t.productId === p.id).reduce((s, t) => s + t.quantity, 0);
      const sold = sells.reduce((s, t) => s + t.quantity, 0);
      assert.equal(p.quantity, bought - sold, `${p.name} stock matches its history`);
      assert.ok(p.quantity >= 0);
    }
  }

  assert.ok(products.some((p) => p.type === "ACCESSORY" && p.quantity <= (p.lowStockThreshold ?? 0)), "some low stock");
  // Sales in each of the last 6 months, so the dashboard chart has no empty bars.
  const months = new Set(transactions.filter((t) => t.type === "SELL").map((t) => t.date.toISOString().slice(0, 7)));
  for (let i = 0; i < 6; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    assert.ok(months.has(d.toISOString().slice(0, 7)), `sales in ${d.toISOString().slice(0, 7)}`);
  }
});
