'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck, ScanLine, FileText, ArrowRight, AlertCircle, Building2 } from 'lucide-react';
import { EXIT_URL } from '@/lib/constants';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [redirectReason, setRedirectReason] = useState('');

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.redirect) {
          setRedirectReason(data.reason || 'free_estimate_used');
          return;
        }
        throw new Error(data.error || 'Verification failed');
      }
      // New leads go to Settings to set up their profile.
      // Free/paid members go to Dashboard.
      if (data.memberType === 'new') {
        router.push('/settings');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (redirectReason) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4">
        <Card className="w-full max-w-md animate-in-fade">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
              <AlertCircle className="h-7 w-7 text-warning" />
            </div>
            <CardTitle>Free Estimate Used</CardTitle>
            <CardDescription>
              You have already used your free estimate. Create a business account to get unlimited access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" onClick={() => (window.location.href = EXIT_URL)}>
              Go to Membership Portal
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-600 via-sky-700 to-cyan-800 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
              <ScanLine className="h-6 w-6" />
            </div>
            Estimator Pro
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            AI-Powered Estimates<br />Built From a Photo.
          </h1>
          <p className="text-lg text-sky-100">
            Scan project sites, generate accurate line items, compare supplier prices, and ship professional invoices — all from your phone.
          </p>
          <div className="space-y-3 pt-4">
            {[
              { icon: ScanLine, text: 'AI image analysis detects materials, labor & demolition' },
              { icon: FileText, text: 'Build estimates and invoices in minutes' },
              { icon: ShieldCheck, text: 'BD Membership verified — one free estimate for new contractors' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sky-50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur shrink-0">
                  <f.icon className="h-5 w-5" />
                </div>
                <span className="text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-sm text-sky-200">Trusted by contractors nationwide</div>
      </div>

      {/* Right checkpoint panel */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4">
        <div className="w-full max-w-md animate-in-slide">
          <div className="lg:hidden mb-8 flex items-center gap-2 text-2xl font-bold text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ScanLine className="h-6 w-6" />
            </div>
            Estimator Pro
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Access Checkpoint</CardTitle>
              <CardDescription>
                Enter the email on file with your BD Membership to verify access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Membership Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contractor@example.com"
                    required
                    autoFocus
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  Verify Membership
                </Button>
                <div className="pt-2 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>Paid members (Plan 4 or 112) get unlimited estimates.</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>Free members and new contractors get one free estimate.</span>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
