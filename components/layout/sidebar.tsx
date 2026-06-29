'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScanLine, LayoutGrid, Camera, FileText, Receipt, History, Settings, LogOut, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EXIT_URL } from '@/lib/constants';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/capture', label: 'New Project', icon: Camera },
  { href: '/estimate', label: 'Estimate', icon: FileText },
  { href: '/prices', label: 'Prices', icon: Receipt },
  { href: '/invoice', label: 'Invoice', icon: FileText },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ session }: { session: { email: string; memberType: 'paid' | 'free' | 'new' } }) {
  const pathname = usePathname();

  function handleExit() {
    localStorage.clear();
    fetch('/api/auth/session', { method: 'DELETE' }).finally(() => {
      window.location.href = EXIT_URL;
    });
  }

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-card shrink-0">
      <div className="p-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-bold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ScanLine className="h-5 w-5" />
          </div>
          Estimator Pro
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t space-y-2">
        <div className="px-3 py-2 rounded-lg bg-secondary/50">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-sm font-medium truncate">{session.email}</p>
          <div className="flex items-center gap-1 mt-1">
            {session.memberType === 'paid' && <Crown className="h-3 w-3 text-primary" />}
            <span className="text-xs text-muted-foreground capitalize">{session.memberType} plan</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive" onClick={handleExit}>
          <LogOut className="mr-2 h-4 w-4" /> Exit
        </Button>
      </div>
    </aside>
  );
}
