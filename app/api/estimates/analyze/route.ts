import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase-server';
import { MAX_FREE_ESTIMATES } from '@/lib/constants';
import type { LineItem, ScanResult } from '@/lib/types';

function generateLineItems(): LineItem[] {
  const items: Omit<LineItem, 'id'>[] = [
    { description: 'Demolition & debris removal', qty: 1, unit: 'lot', unitPrice: 850, category: 'labor' },
    { description: 'Install drywall (1/2")', qty: 450, unit: 'sqft', unitPrice: 1.85, category: 'material' },
    { description: 'Drywall taping & mudding', qty: 450, unit: 'sqft', unitPrice: 1.25, category: 'labor' },
    { description: 'Prime & paint walls', qty: 450, unit: 'sqft', unitPrice: 2.1, category: 'material' },
    { description: 'Install luxury vinyl plank flooring', qty: 320, unit: 'sqft', unitPrice: 4.5, category: 'material' },
    { description: 'Flooring labor', qty: 320, unit: 'sqft', unitPrice: 3.0, category: 'labor' },
    { description: 'Replace baseboards', qty: 120, unit: 'lf', unitPrice: 2.75, category: 'material' },
    { description: 'Electrical rough-in', qty: 1, unit: 'lot', unitPrice: 1200, category: 'labor' },
    { description: 'Update light fixtures', qty: 6, unit: 'ea', unitPrice: 85, category: 'material' },
    { description: 'Plumbing rework', qty: 1, unit: 'lot', unitPrice: 950, category: 'labor' },
  ];
  return items.map((it, i) => ({ ...it, id: `li_${Date.now()}_${i}` }));
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const images: string[] = body.images || [];

    if (session.memberType === 'free' || session.memberType === 'new') {
      const supabase = getSupabaseServer();
      const { data: usage } = await supabase
        .from('estimate_usage')
        .select('free_estimate_used, estimate_count')
        .eq('email', session.email)
        .maybeSingle();
      const used = usage?.free_estimate_used || (usage?.estimate_count ?? 0) >= MAX_FREE_ESTIMATES;
      if (used) {
        return NextResponse.json({ error: 'Free estimate already used' }, { status: 403 });
      }
    }

    const scanResult: ScanResult = {
      roomType: 'Residential Room',
      dimensions: 'Approx. 16\' x 20\' (320 sqft floor, 450 sqft wall)',
      materials: ['1/2" Drywall', 'Luxury Vinyl Plank', 'Baseboards (MDF)', 'Primer & Paint (Eggshell)'],
      fixtures: ['6 LED recessed lights', '2 ceiling fans', '1 GFCI outlet upgrade', '1 light switch'],
      labor: ['Demolition crew (1 day)', 'Drywall install (2 days)', 'Taping & mudding (2 days)', 'Painting (1 day)', 'Flooring install (1 day)'],
      demolition: ['Remove existing flooring', 'Remove old drywall sections', 'Haul away debris'],
      suggestedLineItems: generateLineItems(),
    };

    if (session.memberType === 'free' || session.memberType === 'new') {
      const supabase = getSupabaseServer();
      await supabase
        .from('estimate_usage')
        .upsert(
          {
            email: session.email,
            free_estimate_used: true,
            estimate_count: 1,
            last_estimate_date: new Date().toISOString(),
          },
          { onConflict: 'email' }
        );
    }

    return NextResponse.json({ scanResult, imageCount: images.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
