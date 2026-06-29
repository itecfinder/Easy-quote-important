'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Package, Wrench, Calculator } from 'lucide-react';
import type { LineItem } from '@/lib/types';
import { newLineItem } from '@/lib/estimate-utils';

interface EstimateFormProps {
  items: LineItem[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof LineItem, value: string | number) => void;
  onRemove: (id: string) => void;
}

export function EstimateForm({ items, onAdd, onUpdate, onRemove }: EstimateFormProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> Line Items</CardTitle>
          <Button size="sm" variant="outline" onClick={onAdd}><Plus className="mr-1 h-4 w-4" /> Add Item</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No items yet. Add one above.</p>}
        {items.map((it) => (
          <div key={it.id} className="rounded-lg border p-3 space-y-2 bg-card">
            <div className="flex items-start gap-2">
              <Input
                placeholder="Description"
                value={it.description}
                onChange={(e) => onUpdate(it.id, 'description', e.target.value)}
                className="flex-1"
              />
              <Button size="icon" variant="ghost" onClick={() => onRemove(it.id)} className="text-destructive shrink-0">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <Label className="text-xs">Qty</Label>
                <Input type="number" value={it.qty} onChange={(e) => onUpdate(it.id, 'qty', Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Unit</Label>
                <Input value={it.unit} onChange={(e) => onUpdate(it.id, 'unit', e.target.value)} placeholder="sqft" />
              </div>
              <div>
                <Label className="text-xs">Unit Price</Label>
                <Input type="number" step="0.01" value={it.unitPrice} onChange={(e) => onUpdate(it.id, 'unitPrice', Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <select
                  value={it.category}
                  onChange={(e) => onUpdate(it.id, 'category', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="material">Material</option>
                  <option value="labor">Labor</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <Badge variant={it.category === 'material' ? 'default' : 'secondary'} className="capitalize">
                {it.category === 'material' ? <Package className="mr-1 h-3 w-3" /> : <Wrench className="mr-1 h-3 w-3" />}
                {it.category}
              </Badge>
              <span className="text-sm font-semibold">${(it.qty * it.unitPrice).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function defaultNewItem() {
  return newLineItem();
}
