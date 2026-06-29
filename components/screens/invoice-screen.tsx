'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { supabase } from '@/lib/supabase-client';

export function InvoiceScreen() {
  const router = useRouter();
  const { project, estimate, contractor } = useApp();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const today = new Date().toLocaleDateString();
  const dueDate = new Date(Date.now() + 30 * 86400000).toLocaleDateString();

  async function saveInvoice() {
    setSaving(true);
    try {
      if (contractor?.email) {
        const { data: proj } = await supabase
          .from('projects')
          .insert({
            contractor_email: contractor.email,
            customer_name: project.customerName,
            customer_email: project.customerEmail,
            project_type: project.projectType,
            status: 'invoiced',
            estimate_total: estimate.grandTotal,
            project_data_json: project,
          })
          .select('id')
          .single();
        if (proj?.id) {
          await supabase.from('invoices').insert({
            project_id: proj.id,
            invoice_number: invoiceNumber,
            invoice_json: { ...estimate, customerName: project.customerName, customerEmail: project.customerEmail, companyName: contractor.companyName },
          });
        }
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function exportPdf() {
    window.print();
  }

  if (saved) {
    return (
      <div className="max-w-md mx-auto text-center py-12 animate-in-fade">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-success/15 mb-4">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Invoice Saved</h2>
        <p className="text-muted-foreground mb-6">Invoice {invoiceNumber} has been created.</p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={exportPdf}><Download className="mr-2 h-4 w-4" /> Export PDF</Button>
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in-fade max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoice Builder</h1>
        <p className="text-muted-foreground mt-1">Convert your estimate into a professional invoice.</p>
      </div>

      <Card className="print:shadow-none print:border-0" id="invoice">
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row justify-between gap-6 mb-8 pb-6 border-b">
            <div>
              <h2 className="text-2xl font-bold">{contractor?.companyName || 'Your Company'}</h2>
              {contractor?.address && <p className="text-sm text-muted-foreground mt-1">{contractor.address}</p>}
              {contractor?.phone && <p className="text-sm text-muted-foreground">{contractor.phone}</p>}
              {contractor?.license && <p className="text-sm text-muted-foreground">License: {contractor.license}</p>}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold">INVOICE</span>
              </div>
              <p className="text-sm"><span className="text-muted-foreground">No: </span>{invoiceNumber}</p>
              <p className="text-sm"><span className="text-muted-foreground">Date: </span>{today}</p>
              <p className="text-sm"><span className="text-muted-foreground">Due: </span>{dueDate}</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Bill To</p>
            <p className="font-medium">{project.customerName || 'Customer'}</p>
            {project.customerEmail && <p className="text-sm text-muted-foreground">{project.customerEmail}</p>}
            <p className="text-sm text-muted-foreground mt-1">{project.projectType}</p>
          </div>

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 font-medium text-right">Qty</th>
                <th className="pb-2 font-medium text-right">Unit Price</th>
                <th className="pb-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {estimate.lineItems.map((li) => (
                <tr key={li.id} className="border-b">
                  <td className="py-2">{li.description}</td>
                  <td className="py-2 text-right">{li.qty} {li.unit}</td>
                  <td className="py-2 text-right">${li.unitPrice.toFixed(2)}</td>
                  <td className="py-2 text-right font-medium">${(li.qty * li.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-full sm:w-64 space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>${estimate.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Markup</span><span>${estimate.markup.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax</span><span>${estimate.tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total Due</span><span className="text-primary">${estimate.grandTotal.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
            Payment due within 30 days. Thank you for your business.
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between print:hidden">
        <Button variant="outline" onClick={() => router.push('/estimate')}>Back</Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportPdf}><Download className="mr-2 h-4 w-4" /> Export PDF</Button>
          <Button onClick={saveInvoice} disabled={saving}>
            <FileText className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save Invoice'}
          </Button>
        </div>
      </div>
    </div>
  );
}
