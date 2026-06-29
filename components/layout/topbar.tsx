'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScanLine, Menu, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EXIT_URL } from '@/lib/constants';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/capture', label: 'New Project' },
  { href: '/estimate', label: 'Estimate' },
  { href: '/prices', label: 'Prices' },
  { href: '/invoice', label: 'Invoice' },
  { href: '/history', label: 'History' },
  { href: '/settings', label: 'Settings' },
];

export function Topbar({ session }: { session: { email: string } }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function handleExit() {
    localStorage.clear();
    fetch('/api/auth/session', { method: 'DELETE' }).finally(() => {
      window.location.href = EXIT_URL;
    });
  }

  return (
    <>
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-card border-b px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ScanLine className="h-4 w-4" />
          </div>
          Estimator Pro
        </Link>
        <Button size="icon" variant="ghost" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setOpen(false)}>
          <div className="absolute top-14 inset-x-0 bg-card border-b p-3 space-y-1" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Button variant="ghost" size="sm" className="w-full justify-start text-destructive" onClick={handleExit}>
              <LogOut className="mr-2 h-4 w-4" /> Exit
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
