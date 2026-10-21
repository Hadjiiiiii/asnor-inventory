// Fake but realistic shop data for the public demo database. Everything here is invented:
// names, phone numbers (555-01xx), emails (example.com), serials and IMEIs.
// Pure and deterministic (seeded random), so the same "now" always builds the same shop.

const DAY = 24 * 60 * 60 * 1000;

/** Small seeded PRNG (mulberry32) so reruns produce the same demo. */
function makeRandom(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T,>(items: readonly T[]) => items[Math.floor(next() * items.length)],
    chance: (p: number) => next() < p,
  };
}

const SERIAL_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789".split("");
const round2 = (n: number) => Math.round(n * 100) / 100;
/** Prices end in 0 or 5, the way a shop actually tags them. */
const shopPrice = (n: number) => Math.round(n / 5) * 5;

export const DEMO_CATEGORIES = ["Phones", "Tablets", "Laptops", "Smartwatches", "Accessories"] as const;
type CategoryName = (typeof DEMO_CATEGORIES)[number];

export const DEMO_USERS = [
  { name: "Demo Admin", email: "admin@asnor.com", password: "admin123", role: "ADMIN" },
  { name: "Demo Staff", email: "staff@asnor.com", password: "staff123", role: "STAFF" },
] as const;

type DeviceModel = {
  name: string;
  brand: string;
  model: string;
  category: CategoryName;
  colors: string[];
  cost: [number, number];
  cellular: boolean;
};

const DEVICE_MODELS: DeviceModel[] = [
  { name: "iPhone 15 Pro Max", brand: "Apple", model: "A3106", category: "Phones", colors: ["Natural Titanium", "Black Titanium", "Blue Titanium"], cost: [780, 900], cellular: true },
  { name: "iPhone 15", brand: "Apple", model: "A3090", category: "Phones", colors: ["Black", "Pink", "Green"], cost: [520, 610], cellular: true },
  { name: "iPhone 14 Pro", brand: "Apple", model: "A2890", category: "Phones", colors: ["Deep Purple", "Space Black", "Gold"], cost: [480, 560], cellular: true },
  { name: "iPhone 13", brand: "Apple", model: "A2633", category: "Phones", colors: ["Midnight", "Starlight", "Blue"], cost: [290, 350], cellular: true },
  { name: "iPhone SE (3rd gen)", brand: "Apple", model: "A2783", category: "Phones", colors: ["Midnight", "Red"], cost: [160, 200], cellular: true },
  { name: "Galaxy S24 Ultra", brand: "Samsung", model: "SM-S928B", category: "Phones", colors: ["Titanium Black", "Titanium Gray"], cost: [760, 880], cellular: true },
  { name: "Galaxy S23", brand: "Samsung", model: "SM-S911B", category: "Phones", colors: ["Phantom Black", "Cream"], cost: [380, 450], cellular: true },
  { name: "Galaxy A54", brand: "Samsung", model: "SM-A546E", category: "Phones", colors: ["Awesome Graphite", "Awesome Lime"], cost: [190, 240], cellular: true },
  { name: "Pixel 8 Pro", brand: "Google", model: "GC3VE", category: "Phones", colors: ["Obsidian", "Bay"], cost: [520, 600], cellular: true },
  { name: "Pixel 7a", brand: "Google", model: "GWKK3", category: "Phones", colors: ["Charcoal", "Sea"], cost: [210, 260], cellular: true },
  { name: "iPad Air 11-inch (M2)", brand: "Apple", model: "A2902", category: "Tablets", colors: ["Space Gray", "Blue"], cost: [430, 500], cellular: false },
  { name: "iPad (10th gen)", brand: "Apple", model: "A2696", category: "Tablets", colors: ["Silver", "Yellow"], cost: [260, 310], cellular: false },
  { name: "Galaxy Tab S9", brand: "Samsung", model: "SM-X710", category: "Tablets", colors: ["Graphite", "Beige"], cost: [450, 520], cellular: false },
  { name: "MacBook Air 13-inch (M2)", brand: "Apple", model: "MLY33", category: "Laptops", colors: ["Midnight", "Starlight"], cost: [650, 760], cellular: false },
  { name: "MacBook Pro 14-inch (M3)", brand: "Apple", model: "MRX33", category: "Laptops", colors: ["Space Black", "Silver"], cost: [1150, 1300], cellular: false },
  { name: "Dell XPS 13", brand: "Dell", model: "9315", category: "Laptops", colors: ["Platinum"], cost: [520, 620], cellular: false },
  { name: "Apple Watch Series 9", brand: "Apple", model: "A2980", category: "Smartwatches", colors: ["Midnight", "Starlight"], cost: [220, 270], cellular: false },
  { name: "Galaxy Watch6", brand: "Samsung", model: "SM-R930", category: "Smartwatches", colors: ["Graphite", "Silver"], cost: [140, 180], cellular: false },
];

const ACCESSORY_MODELS = [
  { name: "USB-C to USB-C Cable (1m)", brand: "Anker", model: "A8856", cost: 8, price: 15, bought: [40, 60], lowStock: 5 },
  { name: "20W USB-C Power Adapter", brand: "Apple", model: "MHJA3", cost: 11, price: 22, bought: [25, 35], lowStock: 5 },
  { name: "65W GaN Charger", brand: "Anker", model: "A2667", cost: 24, price: 45, bought: [12, 18], lowStock: 3 },
  { name: "iPhone 15 Pro Max Clear Case", brand: "Spigen", model: "Ultra Hybrid", cost: 5, price: 12, bought: [20, 30], lowStock: 4 },
  { name: "Galaxy S24 Ultra Rugged Case", brand: "OtterBox", model: "Defender", cost: 18, price: 35, bought: [10, 14], lowStock: 3 },
  { name: "Tempered Glass Screen Protector", brand: "ESR", model: "Armorite", cost: 3, price: 10, bought: [50, 80], lowStock: 10 },
  { name: "AirPods Pro (2nd gen)", brand: "Apple", model: "MTJV3", cost: 165, price: 219, bought: [6, 9], lowStock: 2 },
  { name: "Power Bank 10,000mAh", brand: "Anker", model: "A1257", cost: 14, price: 29, bought: [12, 20], lowStock: 3 },
] as const;

const FIRST_NAMES = ["Maria", "James", "Aisha", "Daniel", "Sofia", "Kenji", "Olivia", "Marcus", "Priya", "Liam", "Grace", "Mateo"];
const LAST_NAMES = ["Santos", "Reyes", "Nguyen", "Okafor", "Kim", "Silva", "Brooks", "Patel", "Cruz", "Murphy", "Tan", "Rivera"];

const SUPPLIERS = [
  { name: "TechSource Wholesale", notes: "Main wholesale supplier for phones and laptops" },
  { name: "Pacific Device Traders", notes: "Secondhand iPhones in bulk, ships weekly" },
  { name: "Metro Accessories Supply", notes: "Cables, chargers and cases" },
];
const BOTH = [
  { name: "Mobile Hub Trading", notes: "Buys and sells devices; good for trade-ins" },
  { name: "Second Life Gadgets", notes: "Swaps stock with us when one of us runs low" },
];

const SECONDHAND_NOTES = ["Clean unit, light wear on frame", "Like new, original box", "Minor scuff on back", "Fully tested, all functions OK", "Small dent on corner, works perfectly"];

export type DemoContact = { id: string; name: string; type: "SUPPLIER" | "CUSTOMER" | "BOTH"; phone: string; email: string; address: string | null; notes: string | null; createdAt: Date };
export type DemoProduct = {
  id: string; name: string; brand: string; model: string; color: string | null;
  type: "DEVICE" | "ACCESSORY"; category: CategoryName;
  condition: "BRAND_NEW" | "SECONDHAND" | "FOR_PARTS"; status: "AVAILABLE" | "RESERVED" | "SOLD";
  serialNumber: string | null; imei: string | null; quantity: number; lowStockThreshold: number | null;
  purchasePrice: number; sellingPrice: number; batteryHealth: number | null;
  scratchesMarkings: boolean; dents: boolean; serviceBattery: boolean;
  salvagedParts: string | null; notes: string | null; createdAt: Date;
};
export type DemoTransaction = {
  id: string; type: "BUY" | "SELL"; date: Date; productId: string; contactId: string | null;
  quantity: number; unitPrice: number; totalPrice: number; profit: number | null; notes: string | null;
};

export function buildDemoData(now: Date, seed = 20261020) {
  const r = makeRandom(seed);
  const at = (daysAgo: number) => {
    // Shop hours: 10:00–18:59 UTC, rounded to the minute.
    const d = new Date(now.getTime() - daysAgo * DAY);
    d.setUTCHours(r.int(10, 18), r.int(0, 59), 0, 0);
    return d.getTime() > now.getTime() ? new Date(now.getTime() - 60_000) : d;
  };

  const usedCodes = new Set<string>();
  const uniqueCode = (make: () => string) => {
    for (;;) { const code = make(); if (!usedCodes.has(code)) { usedCodes.add(code); return code; } }
  };
  const serial = () => uniqueCode(() => Array.from({ length: 11 }, () => r.pick(SERIAL_CHARS)).join(""));
  const imei = () => uniqueCode(() => "35" + Array.from({ length: 13 }, () => r.int(0, 9)).join(""));

  // ---- contacts ----
  let contactN = 0;
  const contact = (c: Omit<DemoContact, "id" | "phone" | "createdAt">): DemoContact => {
    contactN += 1;
    return { id: `demo_contact_${String(contactN).padStart(2, "0")}`, phone: `+1-555-01${String(contactN).padStart(2, "0")}`, createdAt: at(200 - contactN), ...c };
  };
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const suppliers = SUPPLIERS.map((s) => contact({ name: s.name, type: "SUPPLIER", email: `orders@${slug(s.name)}.example.com`, address: `${r.int(100, 999)} Commerce Ave, Suite ${r.int(1, 30)}`, notes: s.notes }));
  const both = BOTH.map((s) => contact({ name: s.name, type: "BOTH", email: `trade@${slug(s.name)}.example.com`, address: `${r.int(100, 999)} Market St`, notes: s.notes }));
  const customers = FIRST_NAMES.map((first, i) => {
    const last = LAST_NAMES[(i * 5) % LAST_NAMES.length];
    return contact({ name: `${first} ${last}`, type: "CUSTOMER", email: `${first}.${last}@example.com`.toLowerCase(), address: null, notes: i % 4 === 0 ? "Repeat customer" : null });
  });
  const contacts = [...suppliers, ...both, ...customers];
  const deviceSources = [suppliers[0], suppliers[1], ...both];
  const buyers = [...customers, ...customers, ...both]; // customers twice as likely

  const products: DemoProduct[] = [];
  const transactions: DemoTransaction[] = [];
  let txN = 0;
  const tx = (t: Omit<DemoTransaction, "id">) => { txN += 1; transactions.push({ id: `demo_tx_${String(txN).padStart(4, "0")}`, ...t }); };

  // ---- devices ----
  // 34 sold over the last ~6 months (busier recently), 14 in stock, 3 reserved, 2 for parts.
  const plan: { status: DemoProduct["status"]; soldDaysAgo?: number; boughtDaysAgo: number }[] = [];
  for (let i = 0; i < 34; i++) {
    const soldDaysAgo = Math.floor(175 * Math.pow(r.next(), 1.4)); // skew toward recent months
    plan.push({ status: "SOLD", soldDaysAgo, boughtDaysAgo: soldDaysAgo + r.int(3, 25) });
  }
  for (let i = 0; i < 14; i++) plan.push({ status: "AVAILABLE", boughtDaysAgo: r.int(1, 45) });
  for (let i = 0; i < 3; i++) plan.push({ status: "RESERVED", boughtDaysAgo: r.int(5, 30) });

  plan.forEach((p, i) => {
    const m = r.pick(DEVICE_MODELS);
    const condition: DemoProduct["condition"] = r.chance(0.35) ? "BRAND_NEW" : "SECONDHAND";
    const base = r.int(m.cost[0], m.cost[1]);
    const purchasePrice = condition === "BRAND_NEW" ? shopPrice(base * 1.15) : shopPrice(base);
    const sellingPrice = shopPrice(purchasePrice * (1.15 + r.next() * 0.15));
    const used = condition === "SECONDHAND";
    const id = `demo_device_${String(i + 1).padStart(3, "0")}`;
    const boughtAt = at(p.boughtDaysAgo);
    products.push({
      id, name: m.name, brand: m.brand, model: m.model, color: r.pick(m.colors),
      type: "DEVICE", category: m.category, condition, status: p.status,
      serialNumber: serial(), imei: m.cellular ? imei() : null, quantity: 1, lowStockThreshold: null,
      purchasePrice, sellingPrice,
      batteryHealth: used && m.category !== "Laptops" ? r.int(78, 98) : null,
      scratchesMarkings: used && r.chance(0.4), dents: used && r.chance(0.1), serviceBattery: false,
      salvagedParts: null,
      notes: used ? r.pick(SECONDHAND_NOTES) : "Sealed box",
      createdAt: boughtAt,
    });
    tx({ type: "BUY", date: boughtAt, productId: id, contactId: r.pick(deviceSources).id, quantity: 1, unitPrice: purchasePrice, totalPrice: purchasePrice, profit: null, notes: null });
    if (p.status === "SOLD") {
      // Some sales are negotiated a little below the tag price.
      const unitPrice = r.chance(0.3) ? shopPrice(sellingPrice * 0.95) : sellingPrice;
      tx({ type: "SELL", date: at(p.soldDaysAgo!), productId: id, contactId: r.pick(buyers).id, quantity: 1, unitPrice, totalPrice: unitPrice, profit: round2(unitPrice - purchasePrice), notes: null });
    }
  });

  // Two for-parts units, so that state shows up in the demo too.
  ["iPhone 12", "Galaxy S21"].forEach((name, i) => {
    const id = `demo_parts_${i + 1}`;
    const boughtAt = at(r.int(20, 90));
    const purchasePrice = i === 0 ? 60 : 45;
    products.push({
      id, name, brand: i === 0 ? "Apple" : "Samsung", model: i === 0 ? "A2403" : "SM-G991B", color: "Black",
      type: "DEVICE", category: "Phones", condition: "FOR_PARTS", status: "AVAILABLE",
      serialNumber: serial(), imei: imei(), quantity: 1, lowStockThreshold: null,
      purchasePrice, sellingPrice: purchasePrice + 35, batteryHealth: null,
      scratchesMarkings: true, dents: true, serviceBattery: true,
      salvagedParts: i === 0 ? "Rear camera, Taptic Engine" : "Screen (cracked, removed)",
      notes: "Water damaged, does not power on", createdAt: boughtAt,
    });
    tx({ type: "BUY", date: boughtAt, productId: id, contactId: both[i].id, quantity: 1, unitPrice: purchasePrice, totalPrice: purchasePrice, profit: null, notes: "Bought for parts" });
  });

  // ---- accessories ----
  ACCESSORY_MODELS.forEach((a, i) => {
    const id = `demo_accessory_${String(i + 1).padStart(2, "0")}`;
    const bought = r.int(a.bought[0], a.bought[1]);
    const boughtAt = at(r.int(150, 180));
    tx({ type: "BUY", date: boughtAt, productId: id, contactId: suppliers[2].id, quantity: bought, unitPrice: a.cost, totalPrice: round2(a.cost * bought), profit: null, notes: `Bulk order, ${bought} units` });
    // Sell most of it in small lots; leave a couple of items under their low-stock line.
    const target = i % 3 === 0 ? bought - r.int(1, a.lowStock) : bought - r.int(a.lowStock + 2, a.lowStock * 3);
    let sold = 0;
    while (sold < target) {
      const qty = Math.min(target - sold, r.int(1, 3));
      sold += qty;
      tx({ type: "SELL", date: at(Math.floor(140 * Math.pow(r.next(), 1.3))), productId: id, contactId: r.chance(0.5) ? r.pick(customers).id : null, quantity: qty, unitPrice: a.price, totalPrice: round2(a.price * qty), profit: round2((a.price - a.cost) * qty), notes: null });
    }
    products.push({
      id, name: a.name, brand: a.brand, model: a.model, color: null,
      type: "ACCESSORY", category: "Accessories", condition: "BRAND_NEW", status: "AVAILABLE",
      serialNumber: null, imei: null, quantity: bought - sold, lowStockThreshold: a.lowStock,
      purchasePrice: a.cost, sellingPrice: a.price, batteryHealth: null,
      scratchesMarkings: false, dents: false, serviceBattery: false, salvagedParts: null,
      notes: null, createdAt: boughtAt,
    });
  });

  transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  return { categories: [...DEMO_CATEGORIES], users: DEMO_USERS, contacts, products, transactions };
}
