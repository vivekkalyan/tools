import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Operation = "rearrange" | "repeat" | "reduce" | "einsum";
type ReductionType = "min" | "max" | "sum" | "mean" | "prod";

interface PyodideInterface {
  loadPackage: (packages: string[]) => Promise<void>;
  runPythonAsync: (code: string) => Promise<unknown>;
}

declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

const EXAMPLES = {
  rearrange: [
    { desc: "Flatten", pattern: "h w -> (h w)", shape: "2 3" },
    { desc: "Add batch", pattern: "h w -> 1 h w", shape: "2 3" },
    { desc: "Transpose", pattern: "h w -> w h", shape: "2 3" },
    { desc: "Split channels", pattern: "h w (c1 c2) -> h w c1 c2", shape: "2 2 4", params: "c1=2" },
  ],
  repeat: [
    { desc: "Repeat rows", pattern: "h w -> (h 2) w", shape: "2 3" },
    { desc: "Repeat cols", pattern: "h w -> h (w 2)", shape: "2 3" },
    { desc: "Tile", pattern: "h w -> (h 2) (w 2)", shape: "2 2" },
  ],
  reduce: [
    { desc: "Sum rows", pattern: "h w -> h", shape: "2 3" },
    { desc: "Sum cols", pattern: "h w -> w", shape: "2 3" },
    { desc: "Global pool", pattern: "h w c -> c", shape: "2 2 3" },
  ],
  einsum: [
    { desc: "Matrix multiply", pattern: "i j, j k -> i k", shape: "2 3", shape2: "3 2" },
    { desc: "Batch matmul", pattern: "b i j, b j k -> b i k", shape: "2 2 3", shape2: "2 3 2" },
  ],
};

function renderTensorData(data: unknown, maxDisplay = 100): JSX.Element {
  if (!data) return <div className="text-sm text-muted-foreground">No data</div>;

  const dataStr = JSON.stringify(data);
  const isLarge = dataStr.length > 500;

  if (Array.isArray(data)) {
    if (data.length === 0) return <div className="text-sm text-muted-foreground">Empty</div>;

    const is2D = Array.isArray(data[0]);
    const is1D = !is2D && typeof data[0] !== "object";

    if (is1D) {
      return (
        <div className="flex flex-wrap gap-1">
          {data.slice(0, maxDisplay).map((val, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Static display of tensor data
            <div key={i} className="px-2 py-1 bg-secondary text-xs font-mono rounded">
              {typeof val === "number" ? val.toFixed(2) : val}
            </div>
          ))}
          {data.length > maxDisplay && (
            <div className="text-xs text-muted-foreground">...{data.length - maxDisplay} more</div>
          )}
        </div>
      );
    }

    if (is2D) {
      const rows = Math.min(data.length, 8);
      return (
        <div className="inline-block">
          {data.slice(0, rows).map((row: number[], i: number) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Static display of tensor data
            <div key={i} className="flex gap-1 mb-1">
              {row.slice(0, 8).map((val, j) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Static display of tensor data
                <div key={j} className="px-2 py-1 bg-secondary text-xs font-mono rounded min-w-[60px] text-center">
                  {typeof val === "number" ? val.toFixed(2) : val}
                </div>
              ))}
              {row.length > 8 && <div className="text-xs text-muted-foreground self-center">...</div>}
            </div>
          ))}
          {data.length > rows && <div className="text-xs text-muted-foreground">...{data.length - rows} more rows</div>}
        </div>
      );
    }
  }

  return (
    <pre className="text-xs font-mono bg-secondary p-3 rounded overflow-auto max-h-64">
      {isLarge ? `${dataStr.slice(0, 500)}...` : dataStr}
    </pre>
  );
}

export default function EinopsViz() {
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [loading, setLoading] = useState(true);
  const [operation, setOperation] = useState<Operation>("rearrange");
  const [pattern, setPattern] = useState("h w -> w h");
  const [inputShape, setInputShape] = useState("2 3");
  const [inputShape2, setInputShape2] = useState("3 2");
  const [params, setParams] = useState("");
  const [reductionType, setReductionType] = useState<ReductionType>("sum");
  const [result, setResult] = useState<{
    input: unknown;
    inputShape: number[];
    output: unknown;
    outputShape: number[];
    input2?: unknown;
  } | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js";
    script.async = true;
    script.onload = async () => {
      try {
        const pyodideInstance = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/",
        });
        await pyodideInstance.loadPackage(["numpy", "micropip"]);
        await pyodideInstance.runPythonAsync(`
          import micropip
          await micropip.install('einops')
        `);
        setPyodide(pyodideInstance);
        setLoading(false);
      } catch (_err) {
        setError("Failed to load Python environment");
        setLoading(false);
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const runOperation = async () => {
    if (!pyodide) {
      setError("Python environment not ready");
      return;
    }

    setRunning(true);
    setError("");

    try {
      const shape = inputShape.trim().split(/\s+/).map(Number);
      if (shape.some(Number.isNaN) || shape.length === 0) {
        setError("Invalid input shape");
        setRunning(false);
        return;
      }

      let code = `
import numpy as np
from einops import ${operation}

shape = [${shape.join(", ")}]
input_tensor = np.arange(np.prod(shape)).reshape(shape)
`;

      if (operation === "einsum") {
        const shape2 = inputShape2.trim().split(/\s+/).map(Number);
        if (shape2.some(Number.isNaN) || shape2.length === 0) {
          setError("Invalid second tensor shape");
          setRunning(false);
          return;
        }
        code += `
shape2 = [${shape2.join(", ")}]
input_tensor2 = np.arange(np.prod(shape2)).reshape(shape2)
output = einsum(input_tensor, input_tensor2, '${pattern}')
`;
      } else if (operation === "reduce") {
        const paramsDict = params.trim()
          ? `{${params
              .split(",")
              .map((p) => {
                const [k, v] = p.trim().split("=");
                return `'${k.trim()}': ${v.trim()}`;
              })
              .join(", ")}}`
          : "{}";
        code += `
output = reduce(input_tensor, '${pattern}', reduction='${reductionType}', **${paramsDict})
`;
      } else {
        const paramsDict = params.trim()
          ? `{${params
              .split(",")
              .map((p) => {
                const [k, v] = p.trim().split("=");
                return `'${k.trim()}': ${v.trim()}`;
              })
              .join(", ")}}`
          : "{}";
        code += `
output = ${operation}(input_tensor, '${pattern}', **${paramsDict})
`;
      }

      code += `
{
  'input': input_tensor.tolist(),
  'input_shape': list(input_tensor.shape),
  'output': output.tolist(),
  'output_shape': list(output.shape),
  ${operation === "einsum" ? "'input2': input_tensor2.tolist()," : ""}
}
`;

      const resultData = await pyodide.runPythonAsync(code);
      const jsResult = resultData.toJs({ dict_converter: Object.fromEntries });

      setResult({
        input: jsResult.input,
        inputShape: Array.from(jsResult.input_shape),
        output: jsResult.output,
        outputShape: Array.from(jsResult.output_shape),
        input2: jsResult.input2,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error running operation");
      setResult(null);
    } finally {
      setRunning(false);
    }
  };

  const loadExample = (example: { pattern: string; shape: string; params?: string; shape2?: string }) => {
    setPattern(example.pattern);
    setInputShape(example.shape);
    setParams(example.params || "");
    if (example.shape2) setInputShape2(example.shape2);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Einops Interactive Visualizer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading && (
              <div className="p-4 bg-muted rounded-md text-center">
                Loading Python environment... This may take a few seconds.
              </div>
            )}

            <div>
              <Label>Operation</Label>
              <div className="mt-2 flex gap-2 flex-wrap">
                {(["rearrange", "repeat", "reduce", "einsum"] as Operation[]).map((op) => (
                  <Button
                    key={op}
                    variant={operation === op ? "default" : "outline"}
                    onClick={() => setOperation(op)}
                    disabled={loading}
                  >
                    {op}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pattern">Pattern</Label>
                <Input
                  id="pattern"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="h w -> w h"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shape">Input Tensor Shape</Label>
                  <Input
                    id="shape"
                    value={inputShape}
                    onChange={(e) => setInputShape(e.target.value)}
                    placeholder="2 3"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">Values will be indices 0, 1, 2...</p>
                </div>

                {operation === "einsum" && (
                  <div className="space-y-2">
                    <Label htmlFor="shape2">Second Tensor Shape (for einsum)</Label>
                    <Input
                      id="shape2"
                      value={inputShape2}
                      onChange={(e) => setInputShape2(e.target.value)}
                      placeholder="3 2"
                      disabled={loading}
                    />
                  </div>
                )}
              </div>

              {(operation === "rearrange" || operation === "repeat") && (
                <div className="space-y-2">
                  <Label htmlFor="params">Parameters (e.g., c1=2, c2=3)</Label>
                  <Input
                    id="params"
                    value={params}
                    onChange={(e) => setParams(e.target.value)}
                    placeholder="c1=2"
                    disabled={loading}
                  />
                </div>
              )}

              {operation === "reduce" && (
                <div className="space-y-2">
                  <Label>Reduction Type</Label>
                  <div className="flex gap-2 flex-wrap">
                    {(["min", "max", "sum", "mean", "prod"] as ReductionType[]).map((type) => (
                      <Button
                        key={type}
                        variant={reductionType === type ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReductionType(type)}
                        disabled={loading}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button onClick={runOperation} className="w-full" disabled={loading || running}>
              {running ? "Running..." : "Run Einops Operation"}
            </Button>

            {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}

            <div>
              <Label className="mb-2 block">Quick Examples</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {EXAMPLES[operation]?.map((example, i) => (
                  <Button
                    // biome-ignore lint/suspicious/noArrayIndexKey: Static examples list
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => loadExample(example)}
                    className="justify-start text-left h-auto py-2"
                    disabled={loading}
                  >
                    <div>
                      <div className="font-semibold text-xs">{example.desc}</div>
                      <div className="text-xs text-muted-foreground font-mono">{example.pattern}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {result && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Input Tensor</h3>
                  <div className="mb-2 text-sm text-muted-foreground">Shape: [{result.inputShape.join(", ")}]</div>
                  <div className="p-4 bg-muted rounded-md overflow-auto">{renderTensorData(result.input)}</div>
                </div>

                {result.input2 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Second Input Tensor</h3>
                    <div className="p-4 bg-muted rounded-md overflow-auto">{renderTensorData(result.input2)}</div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-2">Output Tensor</h3>
                  <div className="mb-2 text-sm text-muted-foreground">Shape: [{result.outputShape.join(", ")}]</div>
                  <div className="p-4 bg-muted rounded-md overflow-auto">{renderTensorData(result.output)}</div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t space-y-4">
              <h3 className="text-lg font-semibold">Einops Syntax Reference</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Parentheses ( )</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p className="text-muted-foreground">Groups dimensions together for splitting or merging.</p>
                    <code className="block bg-muted p-2 rounded text-xs">(h d) → h×d as one dimension</code>
                    <code className="block bg-muted p-2 rounded text-xs">batch (h w c) -&gt; batch h w c</code>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Number 1</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p className="text-muted-foreground">Adds a singleton dimension of size 1.</p>
                    <code className="block bg-muted p-2 rounded text-xs">h w -&gt; 1 h w</code>
                    <code className="block bg-muted p-2 rounded text-xs">b h w -&gt; b h w 1</code>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Ellipsis ...</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p className="text-muted-foreground">Matches any number of dimensions.</p>
                    <code className="block bg-muted p-2 rounded text-xs">... d -&gt; ... 1 d</code>
                    <p className="text-xs text-muted-foreground">Works with unknown batch dims</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Named Axes</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p className="text-muted-foreground">Use descriptive names for clarity.</p>
                    <code className="block bg-muted p-2 rounded text-xs">Common: batch, seq, height</code>
                    <p className="text-xs text-muted-foreground">Must match on both sides!</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
