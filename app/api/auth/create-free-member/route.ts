import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { createSession } from '@/lib/auth';
import { FREE_PLAN, BD_API_USER_CREATE, BD_API_KEY } from '@/lib/constants';

function generatePassword(length = 16): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let pw = '';
  for (let i = 0; i < length; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const companyName = body.companyName || '';
    const phone = body.phone || '';
    const address = body.address || '';
    const license = body.license || '';
    const website = body.website || '';
    const logoUrl = body.logoUrl || '';
    const firstName = body.firstName || '';
    const lastName = body.lastName || '';

    const password = generatePassword();
    const formBody = new URLSearchParams({
      email,
      password,
      subscription_id: String(FREE_PLAN),
      active: '1',
      signup_date: new Date().toISOString().split('T')[0],
    });

    if (companyName) formBody.set('company', companyName);
    if (phone) formBody.set('phone_number', phone);
    if (address) formBody.set('address1', address);
    if (firstName) formBody.set('first_name', firstName);
    if (lastName) formBody.set('last_name', lastName);

    let bdCreated = false;
    let bdError = '';

    try {
      const res = await fetch(BD_API_USER_CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Api-Key': BD_API_KEY,
          'X-BD-Site-URL': process.env.NEXT_PUBLIC_SITE_URL || '',
        },
        body: formBody.toString(),
      });

      if (res.ok) {
        bdCreated = true;
      } else {
        const text = await res.text().catch(() => '');
        bdError = `BD API error (${res.status}): ${text || 'Unknown'}`;
      }
    } catch (err) {
      bdError = err instanceof Error ? err.message : 'BD API unreachable';
    }

    if (!bdCreated) {
      return NextResponse.json(
        { error: `Could not create membership account. ${bdError}`.trim() },
        { status: 502 }
      );
    }

    const supabase = getSupabaseServer();

    const { error: upsertErr } = await supabase.from('contractors').upsert(
      {
        email,
        company_name: companyName,
        phone,
        address,
        license,
        website,
        logo_url: logoUrl,
        membership_plan: FREE_PLAN,
      },
      { onConflict: 'email' }
    );

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    const { error: usageErr } = await supabase.from('estimate_usage').upsert(
      { email, free_estimate_used: false, estimate_count: 0 },
      { onConflict: 'email' }
    );

    if (usageErr) {
      return NextResponse.json({ error: usageErr.message }, { status: 500 });
    }

    await createSession({ email, planId: FREE_PLAN, memberType: 'free' });

    return NextResponse.json({
      success: true,
      memberType: 'free',
      bdCreated: true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create member' },
      { status: 500 }
    );
  }
}
