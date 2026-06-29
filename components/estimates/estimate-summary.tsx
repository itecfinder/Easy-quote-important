'use client';

import { Card, CardContent } from '@/components/ui/card';

interface EstimateSummaryProps {
  subtotal: number;
  markup: number;
  tax: number;
  grandTotal: number;
  markupRate: number;
  taxRate: number;
}

export function EstimateSummary({ subtotal, markup, tax, grandTotal, markupRate, taxRate }: EstimateSummaryProps) {
  return (
    <Card className="bg-secondary/40">
      <CardContent className="p-6 space-y-2">
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">${subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Markup ({markupRate}%)</span><span className="font-medium">${markup.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax ({taxRate}%)</span><span className="font-medium">${tax.toFixed(2)}</span></div>
        <div className="border-t pt-2 flex justify-between text-lg font-bold"><span>Grand Total</span><span className="text-primary">${grandTotal.toFixed(2)}</span></div>
      </CardContent>
    </Card>
  );
}
