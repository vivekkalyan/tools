const TOOL_SLUG_OVERRIDES: Record<string, string> = {
  SeattleSingaporeTimeCheck: "sg-time-check",
  WeddingLuckyDraw: "wedding-lucky-draw",
};

export function toKebabCase(componentName: string): string {
  const override = TOOL_SLUG_OVERRIDES[componentName];
  if (override) return override;

  return componentName
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .slice(1);
}

export function toTitleCase(componentName: string): string {
  return componentName.replace(/([A-Z])/g, " $1").trim();
}
