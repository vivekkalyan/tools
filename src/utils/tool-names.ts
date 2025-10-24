export function toKebabCase(componentName: string): string {
  return componentName
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .slice(1);
}

export function toTitleCase(componentName: string): string {
  return componentName.replace(/([A-Z])/g, " $1").trim();
}
