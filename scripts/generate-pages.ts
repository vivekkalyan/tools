import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const toolsDir = join(process.cwd(), "src/tools");
const pagesDir = join(process.cwd(), "src/pages");

const files = readdirSync(toolsDir).filter((file) => file.endsWith(".tsx"));

for (const file of files) {
  const componentName = file.replace(".tsx", "");
  const pageName = componentName
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .slice(1);

  const pageContent = `---
import Layout from "@/layouts/Layout.astro";
import ${componentName} from "@/tools/${componentName}";
---

<Layout>
	<${componentName} client:load />
</Layout>
`;

  writeFileSync(join(pagesDir, `${pageName}.astro`), pageContent);
  console.log(`✓ Generated ${pageName}.astro`);
}

console.log(`\n✨ Generated ${files.length} pages`);
