// Shared by the sale dialog and the sale server actions so what the screen previews is what gets recorded.

/** How long after a sale it can still be undone. Enforced on the server. */
export const UNDO_WINDOW_MS = 10 * 60 * 1000;

/** Why a sale can no longer be undone, or null when it can. Pure so the rules are testable without a database. */
export function undoBlocker(
  sale: { id: string; createdAt: Date },
  latestId: string | undefined,
  now: number = Date.now(),
): string | null {
  if (now - sale.createdAt.getTime() > UNDO_WINDOW_MS) {
    return `It has been more than ${UNDO_WINDOW_MS / 60000} minutes, so this sale can no longer be undone here.`;
  }
  if (latestId !== sale.id) {
    return "Something else was recorded for this product since, so this sale can't be undone.";
  }
  return null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Profit on a sale, or null when the unit's cost was never recorded (unknown is not the same as zero). */
export function saleProfit(unitPrice: number, purchasePrice: number | null, quantity: number): number | null {
  if (purchasePrice === null) return null;
  return round2((unitPrice - purchasePrice) * quantity);
}

/** Today's calendar date in the viewer's own timezone, as the value of an <input type="date">. */
export function localDateString(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * A YYYY-MM-DD sale date stored at midday UTC, so it reads as the same calendar day in every timezone
 * a shop could plausibly be in. Returns null for anything that is not a real date.
 */
export function parseSaleDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

export interface PickableProduct {
  name: string;
  brand?: string | null;
  serialNumber?: string | null;
  imei?: string | null;
}

/** Products matching a typed name, serial number or IMEI; exact serial/IMEI hits first, then name prefixes. */
export function matchProducts<T extends PickableProduct>(products: T[], query: string, limit = 8): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return products.slice(0, limit);

  const scored: { product: T; rank: number }[] = [];
  for (const product of products) {
    const serial = product.serialNumber?.toLowerCase() ?? "";
    const imei = product.imei?.toLowerCase() ?? "";
    const name = product.name.toLowerCase();
    let rank: number;
    if (serial === q || imei === q) rank = 0;
    else if (serial.includes(q) || imei.includes(q)) rank = 1;
    else if (name.startsWith(q)) rank = 2;
    else if (name.includes(q) || (product.brand?.toLowerCase().includes(q) ?? false)) rank = 3;
    else continue;
    scored.push({ product, rank });
  }
  // Array.sort is stable, so equal ranks keep the caller's (alphabetical) order.
  return scored.sort((a, b) => a.rank - b.rank).slice(0, limit).map((s) => s.product);
}
