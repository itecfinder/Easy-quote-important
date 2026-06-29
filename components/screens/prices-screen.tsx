'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Store, TrendingDown, Check } from 'lucide-react';

interface SupplierPrice {
  supplier: string;
  price: number;
  inStock: boolean;
  deliveryDays: number;
}

interface MaterialComparison {
  name: string;
  unit: string;
  qty: number;
  prices: SupplierPrice[];
  best: SupplierPrice;
}

const mockComparisons: MaterialComparison[] = [
  {
    name: '1/2" Drywall (4x8)',
    unit: 'sheet',
    qty: 28,
    prices: [
      { supplier: 'Home Depot', price: 14.5, inStock: true, deliveryDays: 2 },
      { supplier: 'Lowe\'s', price: 13.98, inStock: true, deliveryDays: 3 },
      { supplier: '84 Lumber', price: 12.75, inStock: true, deliveryDays: 5 },
    ],
    best: { supplier: '84 Lumber', price: 12.75, inStock: true, deliveryDays: 5 },
  },
  {
    name: 'Luxury Vinyl Plank',
    unit: 'sqft',
    qty: 320,
    prices: [
      { supplier: 'Floor & Decor', price: 3.49, inStock: true, deliveryDays: 1 },
      { supplier: 'Home Depot', price: 4.5, inStock: true, deliveryDays: 2 },
      { supplier: 'LL Flooring', price: 3.99, inStock: false, deliveryDays: 7 },
    ],
    best: { supplier: 'Floor & Decor', price: 3.49, inStock: true, deliveryDays: 1 },
  },
  {
    name: 'LED Recessed Light',
    unit: 'ea',
    qty: 6,
    prices: [
      { supplier: 'Home Depot', price: 85, inStock: true, deliveryDays: 2 },
      { supplier: 'Amazon', price: 72.99, inStock: true, deliveryDays: 1 },
      { supplier: 'SupplyHouse', price: 79.5, inStock: true, deliveryDays: 4 },
    ],
    best: { supplier: 'Amazon', price: 72.99, inStock: true, deliveryDays: 1 },
  },
];

export function PricesScreen() {
  const router = useRouter();
  const [comparisons] = useState(mockComparisons);

  const totalSavings = comparisons.reduce((sum, c) => {
    const max = Math.max(...c.prices.map((p) => p.price));
    return sum + (max - c.best.price) * c.qty;
  }, 0);

  return (
    <div className="space-y-6 animate-in-fade max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Price Comparison</h1>
        <p className="text-muted-foreground mt-1">Compare local material pricing across suppliers.</p>
      </div>

      <Card className="bg-gradient-to-br from-success/10 to-emerald-50 border-success/20">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
            <TrendingDown className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Potential Savings</p>
            <p className="text-2xl font-bold text-success">${totalSavings.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {comparisons.map((c) => (
          <Card key={c.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Store className="h-4 w-4 text-primary" /> {c.name}</CardTitle>
                <Badge variant="outline">{c.qty} {c.unit}</Badge>
              </div>
              <CardDescription>Best price: {c.best.supplier} @ ${c.best.price.toFixed(2)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {c.prices
                  .slice()
                  .sort((a, b) => a.price - b.price)
                  .map((p) => {
                    const isBest = p.supplier === c.best.supplier;
                    return (
                      <div
                        key={p.supplier}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isBest ? 'border-success bg-success/5' : 'bg-card'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isBest ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-white"><Check className="h-3 w-3" /></div>
                          ) : (
                            <div className="h-6 w-6" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{p.supplier}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.deliveryDays} day delivery {p.inStock ? '• In stock' : '• Backorder'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${p.price.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">${(p.price * c.qty).toFixed(2)} total</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push('/estimate')}>Back</Button>
        <Button onClick={() => router.push('/invoice')}>Continue to Invoice <ArrowRight className="ml-2 h-4 w-4" /></Button>
      </div>
    </div>
  );
}
