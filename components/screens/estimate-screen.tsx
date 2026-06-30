'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { EstimateForm } from '@/components/estimates/estimate-form';
import { EstimateSummary } from '@/components/estimates/estimate-summary';
import { calcTotals, newLineItem } from '@/lib/estimate-utils';

import type { LineItem } from '@/lib/types';

export function EstimateScreen() {
  const router = useRouter();
  const { project, scanResult, estimate, setEstimate } = useApp();
  const [items, setItems] = useState<LineItem[]>(
    estimate.lineItems.length ? estimate.lineItems : scanResult?.suggestedLineItems || []
  );
  const [taxRate, setTaxRate] = useState(8.5);
  const [markupRate, setMarkupRate] = useState(20);
  const [saving, setSaving] = useState(false);

  const totals = calcTotals(items, taxRate, markupRate);

useEffect(() => {
  setEstimate({
    ...estimate,
    lineItems: items,
    ...totals,
  });
}, [items, taxRate, markupRate, estimate, setEstimate, totals]);

  function addItem() {
    setItems((prev) => [...prev, newLineItem()]);
  }

  function updateItem(id: string, field: keyof LineItem, value: string | number) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }
async function saveProject() {
  setSaving(true);

  try {
    const res = await fetch('/api/estimates/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project,
        items,
        totals,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Could not create estimate');
      return;
    }

    router.push('/invoice');

  } catch (err) {
    alert(
      err instanceof Error
        ? err.message
        : 'Something went wrong'
    );
  } finally {
    setSaving(false);
  }
}

  return (
    <div className="space-y-6 animate-in-fade max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Estimate Editor</h1>
        <p className="text-muted-foreground mt-1">Adjust line items, labor, materials, markups, and taxes.</p>
      </div>

      <EstimateForm items={items} onAdd={addItem} onUpdate={updateItem} onRemove={removeItem} />

      <Card>
        <CardHeader><CardTitle className="text-lg">Markups & Tax</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="markup">Markup %</Label>
            <Input id="markup" type="number" value={markupRate} onChange={(e) => setMarkupRate(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax">Tax %</Label>
            <Input id="tax" type="number" step="0.1" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
          </div>
        </CardContent>
      </Card>

      <EstimateSummary {...totals} markupRate={markupRate} taxRate={taxRate} />

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push('/scan')}>Back</Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={saveProject} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save Project'}
          </Button>
          <Button onClick={() => router.push('/invoice')}>
            Build Invoice <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
