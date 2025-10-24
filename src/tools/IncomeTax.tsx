import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const taxBrackets = [
  { threshold: 0, rate: 0, cumulative: 0 },
  { threshold: 20000, rate: 0.02, cumulative: 0 },
  { threshold: 30000, rate: 0.035, cumulative: 200 },
  { threshold: 40000, rate: 0.07, cumulative: 550 },
  { threshold: 80000, rate: 0.115, cumulative: 3350 },
  { threshold: 120000, rate: 0.15, cumulative: 7950 },
  { threshold: 160000, rate: 0.18, cumulative: 13950 },
  { threshold: 200000, rate: 0.19, cumulative: 21150 },
  { threshold: 240000, rate: 0.195, cumulative: 28750 },
  { threshold: 280000, rate: 0.2, cumulative: 36550 },
  { threshold: 320000, rate: 0.22, cumulative: 44550 },
  { threshold: 500000, rate: 0.23, cumulative: 84150 },
  { threshold: 1000000, rate: 0.24, cumulative: 199150 },
];

function calculateTax(income: number): { tax: number; bracket: number; rate: number } {
  if (income <= 20000) {
    return { tax: 0, bracket: 0, rate: 0 };
  }

  let bracket = 0;
  for (let i = taxBrackets.length - 1; i >= 0; i--) {
    if (income > taxBrackets[i].threshold) {
      bracket = i;
      break;
    }
  }

  const currentBracket = taxBrackets[bracket];
  const excess = income - currentBracket.threshold;
  const tax = currentBracket.cumulative + excess * currentBracket.rate;

  return { tax, bracket, rate: currentBracket.rate };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function getBracketInfo(income: number, bracket: number): string {
  if (income <= 20000) {
    return "No tax payable for income up to $20,000";
  }

  const rate = (taxBrackets[bracket].rate * 100).toFixed(1);
  const threshold = formatCurrency(taxBrackets[bracket].threshold);

  if (bracket === taxBrackets.length - 1) {
    return `Income above $1,000,000 taxed at ${rate}%`;
  }

  const nextThreshold = formatCurrency(taxBrackets[bracket + 1].threshold);
  return `Income above ${threshold} taxed at ${rate}% (next bracket at ${nextThreshold})`;
}

export default function SgTaxCalculator() {
  const [income, setIncome] = useState<string>("");

  const incomeNum = parseFloat(income) || 0;
  const { tax, bracket, rate } = calculateTax(incomeNum);
  const effectiveRate = incomeNum > 0 ? (tax / incomeNum) * 100 : 0;
  const takeHome = incomeNum - tax;
  const monthlyTakeHome = takeHome / 12;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Singapore Income Tax Calculator</CardTitle>
            <CardDescription>
              For tax residents (YA 2024 onwards) •{" "}
              <a
                href="https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-residency-and-tax-rates/individual-income-tax-rates"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                IRAS Tax Rates Reference
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="income">Annual Chargeable Income (SGD)</Label>
              <Input
                id="income"
                type="number"
                placeholder="e.g., 100000"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                min="0"
                step="1000"
                className="text-lg"
              />
            </div>

            {incomeNum > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-muted-foreground text-sm">Tax Payable</p>
                        <p className="text-primary text-4xl font-bold">{formatCurrency(tax)}</p>
                      </div>

                      <div className="border-border space-y-3 border-t pt-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Chargeable Income</span>
                          <span className="font-medium">{formatCurrency(incomeNum)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Effective Tax Rate</span>
                          <span className="font-medium">{effectiveRate.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Take-Home Pay</span>
                          <span className="font-medium">{formatCurrency(takeHome)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Monthly Take-Home</span>
                          <span className="font-medium">{formatCurrency(monthlyTakeHome)}</span>
                        </div>
                      </div>

                      <div className="border-border rounded-md border bg-muted/50 p-3">
                        <p className="text-muted-foreground text-sm">{getBracketInfo(incomeNum, bracket)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
