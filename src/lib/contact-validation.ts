// Shared by the contact forms (maxLength, inline errors) and the server actions so they cannot disagree.
export const CONTACT_LIMITS = {
  name: 120,
  phone: 40,
  email: 254,
  address: 200,
  notes: 2000,
} as const;

export const CONTACT_TYPES = ["SUPPLIER", "CUSTOMER", "BOTH"] as const;
export type ContactTypeValue = (typeof CONTACT_TYPES)[number];

export interface ContactFields {
  name: string;
  type: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
}

/** Trims every field and turns blanks into null; the single reading of a contact form, client and server. */
export function readContactForm(formData: FormData): ContactFields {
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const optional = (key: string) => text(key) || null;
  return {
    name: text("name"),
    type: text("type") || "CUSTOMER",
    phone: optional("phone"),
    email: optional("email"),
    address: optional("address"),
    notes: optional("notes"),
  };
}

/** First problem found, with the id of the input it belongs to, or null when the fields are acceptable. */
export function validateContactFields(f: ContactFields): { error: string; field: string } | null {
  const L = CONTACT_LIMITS;
  if (!f.name) return { error: "Enter a name", field: "name" };
  if (f.name.length > L.name) return { error: `Name must be ${L.name} characters or fewer`, field: "name" };
  if (!(CONTACT_TYPES as readonly string[]).includes(f.type)) {
    return { error: "Choose supplier, customer or both", field: "type" };
  }
  if (f.phone && f.phone.length > L.phone) {
    return { error: `Phone must be ${L.phone} characters or fewer`, field: "phone" };
  }
  if (f.email) {
    if (f.email.length > L.email) return { error: `Email must be ${L.email} characters or fewer`, field: "email" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
      return { error: "Enter an email address like name@example.com", field: "email" };
    }
  }
  if (f.address && f.address.length > L.address) {
    return { error: `Address must be ${L.address} characters or fewer`, field: "address" };
  }
  if (f.notes && f.notes.length > L.notes) {
    return { error: `Notes must be ${L.notes} characters or fewer`, field: "notes" };
  }
  return null;
}
