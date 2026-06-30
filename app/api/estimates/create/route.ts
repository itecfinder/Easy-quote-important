import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase-server';
import { PAID_PLANS } from '@/lib/constants';

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { project, items, totals } = await req.json();

    const supabase = getSupabaseServer();

    // 1. Paid members = unlimited
    const isPaid = PAID_PLANS.includes(session.planId);

    // 2. Free members = check usage
    if (!isPaid) {
      const { data: usage } = await supabase
        .from('estimate_usage')
        .select('free_estimate_used, estimate_count')
        .eq('email', session.email)
        .maybeSingle();

      const alreadyUsed =
        usage?.free_estimate_used ||
        (usage?.estimate_count ?? 0) >= 1;

      if (alreadyUsed) {
        return NextResponse.json(
          {
            error: 'Free estimate already used',
            redirect: true,
          },
          { status: 403 }
        );
      }
    }


    // 3. Create project
    const { data: proj, error: projectError } =
      await supabase
        .from('projects')
        .insert({
          contractor_email: session.email,
          customer_name: project.customerName,
          customer_email: project.customerEmail,
          project_type: project.projectType,
          status: 'estimated',
          estimate_total: totals.grandTotal,
          project_data_json: project,
        })
        .select('id')
        .single();


    if (projectError) {
      throw projectError;
    }


    // 4. Create estimate
    const { error: estimateError } =
      await supabase
        .from('estimates')
        .insert({
          project_id: proj.id,
          line_items_json: items,
          subtotal: totals.subtotal,
          tax: totals.tax,
          markup: totals.markup,
          grand_total: totals.grandTotal,
        });


    if (estimateError) {
      throw estimateError;
    }


    // 5. Consume free estimate
    if (!isPaid) {
      await supabase
        .from('estimate_usage')
        .upsert({
          email: session.email,
          free_estimate_used: true,
          estimate_count: 1,
        });
    }


    return NextResponse.json({
      success: true,
      projectId: proj.id,
    });


  } catch (err) {

    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Create estimate failed',
      },
      { status: 500 }
    );
  }
}
