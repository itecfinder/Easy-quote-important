import type { Estimate, LineItem, ProjectData } from './types';

export const emptyProject: ProjectData = {
  customerName: '',
  customerEmail: '',
  projectType: '',
  images: [],
};

export const emptyEstimate: Estimate = {
  lineItems: [],
  subtotal: 0,
  tax: 0,
  markup: 0,
  grandTotal: 0,
};

export function calcTotals(items: LineItem[], taxRate: number, markupRate: number) {
  const subtotal = items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0);
  const markup = subtotal * (markupRate / 100);
  const tax = (subtotal + markup) * (taxRate / 100);
  const grandTotal = subtotal + markup + tax;
  return { subtotal, markup, tax, grandTotal };
}

export function newLineItem(): LineItem {
  return {
    id: `li_${Date.now()}`,
    description: '',
    qty: 1,
    unit: 'ea',
    unitPrice: 0,
    category: 'material',
  };
}
