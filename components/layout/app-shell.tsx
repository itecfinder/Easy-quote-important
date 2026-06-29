'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ScanLine } from 'lucide-react';
import { AppProvider } from '@/context/app-context';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { supabase } from '@/lib/supabase-client';
import type { Contractor } from '@/lib/types';

export function AppShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: { email: string; planId: number; memberType: 'paid' | 'free' | 'new' };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (session.memberType === 'new') {
        // New lead — no contractor row exists yet. Don't query Supabase.
        setContractor({ email: session.email, membershipPlan: session.planId });
        setLoading(false);
        return;
      }
      // Existing member — load their profile from Supabase.
      const { data } = await supabase
        .from('contractors')
        .select('*')
        .eq('email', session.email)
        .maybeSingle();
      if (data) {
        setContractor({
          id: data.id,
          email: data.email,
          companyName: data.company_name,
          phone: data.phone,
          address: data.address,
          license: data.license,
          website: data.website,
          logoUrl: data.logo_url,
          membershipPlan: data.membership_plan,
          createdAt: data.created_at,
        });
      } else {
        setContractor({ email: session.email, membershipPlan: session.planId });
      }
      setLoading(false);
    })();
  }, [session.email, session.memberType, session.planId]);

  // New leads must complete Settings before accessing other screens.
  useEffect(() => {
    if (!loading && session.memberType === 'new' && pathname !== '/settings') {
      router.replace('/settings');
    }
  }, [loading, session.memberType, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center animate-pulse">
            <ScanLine className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider session={session}>
      <div className="min-h-screen bg-background flex">
        <Sidebar session={session} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar session={session} />
          <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 overflow-x-hidden">
            <div className="max-w-5xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </AppProvider>
  );
}
