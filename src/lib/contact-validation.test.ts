import assert from "node:assert/strict";
import test from "node:test";
import { readContactForm, validateContactFields, type ContactFields } from "./contact-validation";

const valid: ContactFields = {
  name: "Dana Reyes",
  type: "CUSTOMER",
  phone: "+1-555-0100",
  email: "dana@example.com",
  address: null,
  notes: null,
};

test("accepts a normal contact and one with only a name", () => {
  assert.equal(validateContactFields(valid), null);
  assert.equal(validateContactFields({ ...valid, phone: null, email: null }), null);
});

test("points at the field that is wrong", () => {
  assert.equal(validateContactFields({ ...valid, name: "" })?.field, "name");
  assert.equal(validateContactFields({ ...valid, name: "x".repeat(121) })?.field, "name");
  assert.equal(validateContactFields({ ...valid, type: "ADMIN" })?.field, "type");
  assert.equal(validateContactFields({ ...valid, email: "not-an-email" })?.field, "email");
  assert.equal(validateContactFields({ ...valid, email: "a b@c.d" })?.field, "email");
  assert.equal(validateContactFields({ ...valid, phone: "1".repeat(41) })?.field, "phone");
  assert.equal(validateContactFields({ ...valid, notes: "x".repeat(2001) })?.field, "notes");
});

test("form reading trims, blanks become null and the type defaults to customer", () => {
  const form = new FormData();
  form.set("name", "  Dana  ");
  form.set("phone", "   ");
  form.set("email", " dana@example.com ");
  const fields = readContactForm(form);
  assert.equal(fields.name, "Dana");
  assert.equal(fields.phone, null);
  assert.equal(fields.email, "dana@example.com");
  assert.equal(fields.type, "CUSTOMER");
  assert.equal(fields.address, null);
});

test("a whitespace-only name is rejected, not saved as blank", () => {
  const form = new FormData();
  form.set("name", "   ");
  assert.equal(validateContactFields(readContactForm(form))?.field, "name");
});
