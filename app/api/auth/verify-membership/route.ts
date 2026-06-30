import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { createSession } from '@/lib/auth';
import { PAID_PLANS, FREE_PLAN, EXIT_URL, BD_API_BASE, BD_API_KEY } from '@/lib/constants';
import type { MemberType } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const normalized = email.trim().toLowerCase();

    const supabase = getSupabaseServer();

   // 1. BD API lookup — check membership by email.
let planId: number | null = null;
let bdFound = false;

try {
  const res = await fetch(
    `${BD_API_BASE}/user/get?property=email&property_value=${encodeURIComponent(normalized)}`,
    {
      method: 'GET',
      headers: {
        'X-Api-Key': BD_API_KEY,
      },
    }
  );

  console.log('BD status:', res.status);

  const data = await res.json();

  console.log('BD response:', data);

  if (res.ok) {
    bdFound = true;

    planId = Number(
      data?.planId ??
      data?.plan_id ??
      data?.membershipPlan ??
      data?.subscription_id
    );

    if (Number.isNaN(planId)) {
      planId = null;
    }

    console.log('BD parsed planId:', planId);
  }

} catch (err) {
  console.error('BD lookup failed:', err);
}

    let memberType: MemberType;
    let effectivePlan: number;

    if (bdFound && planId != null && PAID_PLANS.includes(planId)) {
      // Paid member — unlimited access.
      memberType = 'paid';
      effectivePlan = planId;
    } else if (bdFound && planId === FREE_PLAN) {
      // Free member — 1 estimate limit.
      memberType = 'free';
      effectivePlan = FREE_PLAN;
    } else if (bdFound) {
      // Found in BD but plan not recognized — treat as free.
      memberType = 'free';
      effectivePlan = FREE_PLAN;
    } else {
      // Not found in BD — check Supabase for an existing local record.
      const { data: existing } = await supabase
        .from('contractors')
        .select('email, membership_plan')
        .eq('email', normalized)
        .maybeSingle();

      if (existing) {
        const p = existing.membership_plan;
        if (PAID_PLANS.includes(p)) {
          memberType = 'paid';
          effectivePlan = p;
        } else {
          memberType = 'free';
          effectivePlan = FREE_PLAN;
        }
      } else {
        // New lead — no record anywhere. Nothing stored in app.
        // They get a session and are sent to Settings to set up their profile.
        memberType = 'new';
        effectivePlan = FREE_PLAN;
      }
    }

    // 2. Check free estimate usage for free members (not new leads).
    let freeEstimateUsed = false;
    if (memberType === 'free') {
      const { data: usage } = await supabase
        .from('estimate_usage')
        .select('free_estimate_used, estimate_count')
        .eq('email', normalized)
        .maybeSingle();
      if (usage) {
        freeEstimateUsed = usage.free_estimate_used || usage.estimate_count >= 1;
      }
    }

    // 3. Free member who already used their estimate — redirect to BD login.
    if (memberType === 'free' && freeEstimateUsed) {
      return NextResponse.json(
        { allowed: false, redirect: EXIT_URL, reason: 'free_estimate_used' },
        { status: 403 }
      );
    }

    // 4. Create session. For new leads, nothing is stored in the app yet.
    await createSession({ email: normalized, planId: effectivePlan, memberType });

    return NextResponse.json({
      allowed: true,
      memberType,
      planId: effectivePlan,
      freeEstimateUsed,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
