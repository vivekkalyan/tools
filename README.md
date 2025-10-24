# Tools

A collection of utility tools built with Astro, React, and shadcn/ui.

## 🚀 Quick Start

```bash
bun install
bun dev
```

Visit `http://localhost:4321`

## 📝 Creating a New Tool

Simply create a new React component in `src/tools/`:

```tsx
// src/tools/MyNewTool.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyNewTool() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>My New Tool</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Your tool content */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

The page will be **automatically generated** at `/my-new-tool` when you run `bun dev` or `bun build`.

### Naming Convention

Component names are converted to kebab-case URLs:
- `SgTaxCalculator.tsx` → `/sg-tax-calculator`
- `MyNewTool.tsx` → `/my-new-tool`
- `CompoundGrowth.tsx` → `/compound-growth`

## 🧞 Commands

| Command              | Action                                      |
| :------------------- | :------------------------------------------ |
| `bun install`        | Install dependencies                        |
| `bun dev`            | Start dev server at `localhost:4321`        |
| `bun build`          | Build production site to `./dist/`          |
| `bun preview`        | Preview build locally                       |
| `bun generate:pages` | Generate Astro pages from tools (auto-run)  |

## 🎨 Available Components

- Card, CardContent, CardHeader, CardTitle, CardDescription
- Input
- Label
- Button

Add more with: `bunx shadcn@latest add <component>`
