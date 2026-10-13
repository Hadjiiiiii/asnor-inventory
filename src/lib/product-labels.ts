export type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive";

// One place for how a condition or status reads and is coloured, so list and detail cannot disagree.
export const conditionLabels: Record<string, { label: string; variant: BadgeVariant }> = {
  BRAND_NEW: { label: "Brand New", variant: "success" },
  SECONDHAND: { label: "Secondhand", variant: "secondary" },
  FOR_PARTS: { label: "For Parts", variant: "destructive" },
};

export const statusLabels: Record<string, { label: string; variant: BadgeVariant }> = {
  AVAILABLE: { label: "Available", variant: "success" },
  RESERVED: { label: "Reserved", variant: "warning" },
  SOLD: { label: "Sold", variant: "secondary" },
};
