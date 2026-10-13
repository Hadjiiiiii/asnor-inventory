import assert from "node:assert/strict";
import test from "node:test";
import { validateProductFields, type ProductFields } from "./product-validation";

const valid: ProductFields = {
  name: "iPhone 15",
  brand: "Apple",
  model: null,
  color: null,
  categoryId: "cat_1",
  serialNumber: null,
  imei: null,
  quantity: 1,
  lowStockThreshold: null,
  purchasePrice: 500,
  sellingPrice: 650,
  salvagedParts: null,
  notes: null,
};

test("accepts a normal product, including free stock and a zero price", () => {
  assert.equal(validateProductFields(valid), null);
  assert.equal(validateProductFields({ ...valid, quantity: 0, purchasePrice: 0 }), null);
});

test("points at the field that is wrong", () => {
  assert.equal(validateProductFields({ ...valid, name: "" })?.field, "name");
  assert.equal(validateProductFields({ ...valid, name: "x".repeat(121) })?.field, "name");
  assert.equal(validateProductFields({ ...valid, categoryId: "" })?.field, "categoryId");
  assert.equal(validateProductFields({ ...valid, notes: "x".repeat(2001) })?.field, "notes");
});

test("rejects prices the database column cannot hold or that are not numbers", () => {
  assert.equal(validateProductFields({ ...valid, purchasePrice: -1 })?.field, "purchasePrice");
  assert.equal(validateProductFields({ ...valid, sellingPrice: Number.NaN })?.field, "sellingPrice");
  assert.equal(validateProductFields({ ...valid, sellingPrice: 100_000_000 })?.field, "sellingPrice");
});

test("rejects absurd or malformed stock numbers", () => {
  assert.equal(validateProductFields({ ...valid, quantity: 1_000_000 })?.field, "quantity");
  assert.equal(validateProductFields({ ...valid, lowStockThreshold: -2 })?.field, "lowStockThreshold");
  assert.equal(validateProductFields({ ...valid, lowStockThreshold: Number.NaN })?.field, "lowStockThreshold");
});
