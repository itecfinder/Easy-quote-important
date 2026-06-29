import { NextResponse } from 'next/server';
import { getSession, clearSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ loggedIn: false }, { status: 401 });
  }
  return NextResponse.json({
    loggedIn: true,
    email: session.email,
    planId: session.planId,
    memberType: session.memberType,
  });
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ success: true });
}
