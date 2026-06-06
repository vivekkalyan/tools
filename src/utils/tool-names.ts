const TOOL_SLUG_OVERRIDES: Record<string, string> = {
  SeattleSingaporeTimeCheck: "sg-time-check",
  WeddingLuckyDraw: "kangraye-and-qiongdan",
};

const TOOL_TITLE_OVERRIDES: Record<string, string> = {
  WeddingLuckyDraw: "Kang Raye and Qiong Dan",
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
  const override = TOOL_TITLE_OVERRIDES[componentName];
  if (override) return override;

  return componentName.replace(/([A-Z])/g, " $1").trim();
}
