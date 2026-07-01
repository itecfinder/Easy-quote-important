import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { createSession } from '@/lib/auth';
import {
  PAID_PLANS,
  FREE_PLAN,
  EXIT_URL,
  BD_API_BASE,
  BD_API_KEY,
} from '@/lib/constants';
import type { MemberType } from '@/lib/types';

function toNumber(value: unknown): number | null {
  const n = Number(value);

  return Number.isFinite(n) ? n : null;
}

function resolvePlanId(data: any): number | null {
  const candidate =
    data?.planId ??
    data?.plan_id ??
    data?.membershipPlan ??
    data?.subscription_id ??
    data?.user?.planId ??
    data?.user?.subscription_id;

  return toNumber(candidate);
}

function hasMemberIdentity(data: any): boolean {
  return Boolean(
    data?.id ||
    data?.user_id ||
    data?.email ||
    data?.user?.email
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body?.email;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalized = email.trim().toLowerCase();
    const supabase = getSupabaseServer();

    let memberType: MemberType = 'new';
    let effectivePlan: number = FREE_PLAN;
    let freeEstimateUsed = false;
    //
    // 1. CHECK BD FIRST
    //

    let bdFound = false;
    let bdPlanId: number | null = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        5000
      );

      const res = await fetch(
        `${BD_API_BASE}/user/get?property=email&property_value=${encodeURIComponent(normalized)}`,
        {
          method: 'GET',
          headers: {
            'X-Api-Key': BD_API_KEY,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        bdFound = hasMemberIdentity(data);
        bdPlanId = resolvePlanId(data);

      } else {
        console.error('BD lookup failed', {
          status: res.status,
        });
      }
    } catch (error) {
      console.error('BD lookup error', {
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      });
    }
    //
    // 2. RESOLVE BD MEMBER
    //
    if (bdFound) {
      if (
        bdPlanId !== null &&
        PAID_PLANS.includes(bdPlanId)
      ) {
        memberType = 'paid';
        effectivePlan = bdPlanId;
      } else {
        // Any BD member without a paid plan
        // is treated as FREE because BD creates FREE accounts

        memberType = 'free';
        effectivePlan = FREE_PLAN;
      }
    } else {
      //
      // 3. FALLBACK TO SUPABASE
      //
      const { data: existing } =
        await supabase
          .from('contractors')
          .select(
            'email, membership_plan'
          )
          .eq(
            'email',
            normalized
          )
          .maybeSingle();
      if (existing) {
        const plan =
          toNumber(existing.membership_plan);
        if (
          plan !== null &&
          PAID_PLANS.includes(plan)
        ) {
          memberType = 'paid';
          effectivePlan = plan;
        } else 
        {
          memberType = 'free';
          effectivePlan = FREE_PLAN;
        }
      }
    }
    //
    // 4. FREE ESTIMATE CHECK
    //
    if (memberType === 'free') {
      const { data: usage } =
        await supabase
          .from('estimate_usage')
          .select(
            'free_estimate_used, estimate_count'
          )
          .eq(
            'email',
            normalized
          )
          .maybeSingle();
      if (usage) {
        freeEstimateUsed =
          usage.free_estimate_used === true ||
          Number(
            usage.estimate_count ?? 0
          ) >= 1;
      }
    }
    //
    // 5. FREE USER ALREADY USED ESTIMATE
    //
    if (
      memberType === 'free' &&
      freeEstimateUsed
    ) {
      return NextResponse.json(
        {
          allowed: false,
          redirect: EXIT_URL,
          reason: 'free_estimate_used',
        },
        {
          status: 403,
        }
      );
    }
    //
    // 6. CREATE SESSION
    //
    await createSession({
      email: normalized,
      planId: effectivePlan,
      memberType,
    });
    return NextResponse.json({
      allowed: true,
      memberType,
      planId: effectivePlan,
      freeEstimateUsed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Verification failed',
      },
      {
        status: 500,
      }
    );
  }
}

