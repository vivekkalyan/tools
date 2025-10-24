import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Config {
  vocab_size: number;
  context_length: number;
  num_layers: number;
  d_model: number;
  num_heads: number;
  d_ff: number;
}

const PRESETS: Record<string, Config> = {
  "GPT-2 Small": {
    vocab_size: 50257,
    context_length: 1024,
    num_layers: 12,
    d_model: 768,
    num_heads: 12,
    d_ff: 3072,
  },
  "GPT-2 Medium": {
    vocab_size: 50257,
    context_length: 1024,
    num_layers: 24,
    d_model: 1024,
    num_heads: 16,
    d_ff: 4096,
  },
  "GPT-2 Large": {
    vocab_size: 50257,
    context_length: 1024,
    num_layers: 36,
    d_model: 1280,
    num_heads: 20,
    d_ff: 5120,
  },
  "GPT-2 XL": {
    vocab_size: 50257,
    context_length: 1024,
    num_layers: 48,
    d_model: 1600,
    num_heads: 25,
    d_ff: 6400,
  },
};

interface FLOPsBreakdown {
  qkv_projections: number;
  qk_attention: number;
  attention_v: number;
  output_projection: number;
  ffn: number;
  total_per_block: number;
  total_all_blocks: number;
  lm_head: number;
  total: number;
}

function calculateFLOPs(config: Config): FLOPsBreakdown {
  const { vocab_size, context_length, num_layers, d_model, num_heads, d_ff } = config;
  const seq_len = context_length;

  // MHA Attention
  const qkv_projections = 2 * seq_len * d_model * d_model * 3; // Q, K, V projections
  const qk_attention = 2 * seq_len * (d_model / num_heads) * seq_len * num_heads;
  const attention_v = 2 * seq_len * seq_len * (d_model / num_heads) * num_heads;
  const output_projection = 2 * seq_len * d_model * d_model;

  // FFN
  const ffn = 2 * seq_len * d_model * d_ff * 2 + 2 * seq_len * d_ff * d_model;

  const total_per_block = qkv_projections + qk_attention + attention_v + output_projection + ffn;
  const total_all_blocks = total_per_block * num_layers;

  // Final LM Head
  const lm_head = 2 * seq_len * d_model * vocab_size;

  const total = total_all_blocks + lm_head;

  return {
    qkv_projections,
    qk_attention,
    attention_v,
    output_projection,
    ffn,
    total_per_block,
    total_all_blocks,
    lm_head,
    total,
  };
}

function formatNumber(num: number): string {
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

export default function TransformerFlopsCalculator() {
  const [config, setConfig] = useState<Config>(PRESETS["GPT-2 Small"]);
  const [result, setResult] = useState<FLOPsBreakdown | null>(calculateFLOPs(PRESETS["GPT-2 Small"]));

  useEffect(() => {
    setResult(calculateFLOPs(config));
  }, [config]);

  const loadPreset = (presetName: string) => {
    setConfig({ ...PRESETS[presetName], context_length: config.context_length });
  };

  const updateConfig = (key: keyof Config, value: string) => {
    setConfig({ ...config, [key]: Number(value) });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Transformer FLOPs Calculator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Presets */}
            <div>
              <Label>Presets</Label>
              <div className="mt-2 flex gap-2">
                {Object.keys(PRESETS).map((preset) => (
                  <Button key={preset} variant="outline" onClick={() => loadPreset(preset)}>
                    {preset}
                  </Button>
                ))}
              </div>
            </div>

            {/* Configuration Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="vocab_size">Vocabulary Size</Label>
                <Input
                  id="vocab_size"
                  type="number"
                  value={config.vocab_size}
                  onChange={(e) => updateConfig("vocab_size", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="context_length">Context Length</Label>
                <Input
                  id="context_length"
                  type="number"
                  value={config.context_length}
                  onChange={(e) => updateConfig("context_length", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="num_layers">Number of Layers</Label>
                <Input
                  id="num_layers"
                  type="number"
                  value={config.num_layers}
                  onChange={(e) => updateConfig("num_layers", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="d_model">Model Dimension (d_model)</Label>
                <Input
                  id="d_model"
                  type="number"
                  value={config.d_model}
                  onChange={(e) => updateConfig("d_model", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="num_heads">Number of Heads</Label>
                <Input
                  id="num_heads"
                  type="number"
                  value={config.num_heads}
                  onChange={(e) => updateConfig("num_heads", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="d_ff">FFN Dimension (d_ff)</Label>
                <Input
                  id="d_ff"
                  type="number"
                  value={config.d_ff}
                  onChange={(e) => updateConfig("d_ff", e.target.value)}
                />
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Results</h3>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Total FLOPs:</span>
                    <span className="font-bold text-lg">{formatNumber(result.total)} FLOPs</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Per Layer Breakdown:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-4 font-medium text-muted-foreground">
                      <span>Component</span>
                      <span className="text-right">Per Layer</span>
                      <span className="text-right">All Layers</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <span>Q, K, V Projections:</span>
                      <span className="text-right">
                        {formatNumber(result.qkv_projections)} (
                        {((result.qkv_projections / result.total) * 100).toFixed(1)}%)
                      </span>
                      <span className="text-right">
                        {formatNumber(result.qkv_projections * config.num_layers)} (
                        {(((result.qkv_projections * config.num_layers) / result.total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <span>Q×K Attention:</span>
                      <span className="text-right">
                        {formatNumber(result.qk_attention)} ({((result.qk_attention / result.total) * 100).toFixed(1)}%)
                      </span>
                      <span className="text-right">
                        {formatNumber(result.qk_attention * config.num_layers)} (
                        {(((result.qk_attention * config.num_layers) / result.total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <span>Attention×V:</span>
                      <span className="text-right">
                        {formatNumber(result.attention_v)} ({((result.attention_v / result.total) * 100).toFixed(1)}%)
                      </span>
                      <span className="text-right">
                        {formatNumber(result.attention_v * config.num_layers)} (
                        {(((result.attention_v * config.num_layers) / result.total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <span>Output Projection:</span>
                      <span className="text-right">
                        {formatNumber(result.output_projection)} (
                        {((result.output_projection / result.total) * 100).toFixed(1)}%)
                      </span>
                      <span className="text-right">
                        {formatNumber(result.output_projection * config.num_layers)} (
                        {(((result.output_projection * config.num_layers) / result.total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <span>Feed-Forward Network:</span>
                      <span className="text-right">
                        {formatNumber(result.ffn)} ({((result.ffn / result.total) * 100).toFixed(1)}%)
                      </span>
                      <span className="text-right">
                        {formatNumber(result.ffn * config.num_layers)} (
                        {(((result.ffn * config.num_layers) / result.total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Total per Block:</span>
                    <span>{formatNumber(result.total_per_block)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>All Blocks ({config.num_layers} layers):</span>
                    <span>
                      {formatNumber(result.total_all_blocks)} (
                      {((result.total_all_blocks / result.total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>LM Head:</span>
                    <span>
                      {formatNumber(result.lm_head)} ({((result.lm_head / result.total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-sm mb-2">Component Summary:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Attention (MHA):</span>
                      <span>
                        {(
                          (((result.qkv_projections +
                            result.qk_attention +
                            result.attention_v +
                            result.output_projection) *
                            config.num_layers) /
                            result.total) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Feed-Forward (FFN):</span>
                      <span>{(((result.ffn * config.num_layers) / result.total) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Language Model Head:</span>
                      <span>{((result.lm_head / result.total) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
