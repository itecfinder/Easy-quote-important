'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building2, Save, Loader2, LogOut, Crown, UserPlus, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { supabase } from '@/lib/supabase-client';
import { EXIT_URL } from '@/lib/constants';

export function SettingsScreen() {
  const router = useRouter();
  const { contractor, setContractor, memberType, planId } = useApp();
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [license, setLicense] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const isNewLead = memberType === 'new';

  useEffect(() => {
    if (contractor) {
      setCompanyName(contractor.companyName || '');
      setPhone(contractor.phone || '');
      setAddress(contractor.address || '');
      setLicense(contractor.license || '');
      setWebsite(contractor.website || '');
      setLogoUrl(contractor.logoUrl || '');
    }
  }, [contractor]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      if (isNewLead) {
        // New lead — call BD API to create the membership account.
        // Nothing was stored in the app until this point.
        const res = await fetch('/api/auth/create-free-member', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: contractor?.email,
            companyName,
            phone,
            address,
            license,
            website,
            logoUrl,
            firstName,
            lastName,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create membership account');
        }
        // BD account created + contractor row stored + estimate_usage initialized.
        // Session is now upgraded from 'new' to 'free'.
        setContractor({
          email: contractor!.email,
          companyName,
          phone,
          address,
          license,
          website,
          logoUrl,
          membershipPlan: 8,
        });
        setSaved(true);
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        // Existing member — just update the local profile.
        const { error: updateErr } = await supabase
          .from('contractors')
          .update({
            company_name: companyName,
            phone,
            address,
            license,
            website,
            logo_url: logoUrl,
          })
          .eq('email', contractor!.email);
        if (updateErr) throw new Error(updateErr.message);
        setContractor({
          ...contractor!,
          companyName,
          phone,
          address,
          license,
          website,
          logoUrl,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function handleExit() {
    localStorage.clear();
    fetch('/api/auth/session', { method: 'DELETE' }).finally(() => {
      window.location.href = EXIT_URL;
    });
  }

  return (
    <div className="space-y-6 animate-in-fade max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isNewLead ? 'Set Up Your Business Profile' : 'Settings'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isNewLead
            ? 'Complete your profile to activate your free membership and create your first estimate.'
            : 'Manage your business profile and membership.'}
        </p>
      </div>

      {isNewLead && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 shrink-0">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">New Contractor Account</p>
              <p className="text-xs text-muted-foreground mt-1">
                Saving your profile creates a free membership account in the BD directory
                and activates your 1 free estimate.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Business Profile
            </CardTitle>
            {!isNewLead && (
              <Badge variant={memberType === 'paid' ? 'default' : 'secondary'} className="flex items-center gap-1">
                {memberType === 'paid' && <Crown className="h-3 w-3" />}
                {memberType === 'paid' ? 'Paid Member' : 'Free Plan'}
              </Badge>
            )}
          </div>
          <CardDescription>
            {isNewLead ? 'Plan: Free (1 estimate) • ' : `Plan ID: ${planId} • `}
            {contractor?.email}
          </CardDescription>
        </CardHeader>
```tsx
<CardContent className="space-y-4">

  {/* First Name | Last Name | Upload Logo */}
  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_180px] gap-4 items-start">

    {isNewLead && (
      <>
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="John"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Smith"
          />
        </div>
      </>
    )}

    <div className="space-y-2">
      <Label>Upload Logo</Label>

      {logoUrl ? (
        <img
          src={logoUrl}
          alt="Logo"
          className="h-24 w-24 rounded-lg border object-contain p-2"
        />
      ) : (
        <div className="h-24 w-24 rounded-lg border flex items-center justify-center text-xs text-muted-foreground">
          No Logo
        </div>
      )}

      <Input
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
      />
    </div>

  </div>

  {/* Company Name */}
  <div className="space-y-2">
    <Label htmlFor="cn">Company Name</Label>
    <Input
      id="cn"
      value={companyName}
      onChange={(e) => setCompanyName(e.target.value)}
      placeholder="Acme Construction LLC"
    />
  </div>

  {/* Email */}
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input
      id="email"
      value={contractor?.email || ''}
      disabled
    />
  </div>

  {/* Phone + License */}
  <div className="grid sm:grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="phone">Phone</Label>
      <Input
        id="phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="(555) 123-4567"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="license">License #</Label>
      <Input
        id="license"
        value={license}
        onChange={(e) => setLicense(e.target.value)}
        placeholder="Lic. #12345"
      />
    </div>
  </div>

  {/* Address */}
  <div className="space-y-2">
    <Label htmlFor="address">Address</Label>
    <Input
      id="address"
      value={address}
      onChange={(e) => setAddress(e.target.value)}
      placeholder="123 Main St, City, ST 00000"
    />
  </div>

  {error && (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{error}</span>
    </div>
  )}

  {saved && (
    <p className="text-sm text-success">
      {isNewLead
        ? 'Membership account created! Redirecting to dashboard...'
        : 'Profile saved.'}
    </p>
  )}

  <Button onClick={handleSave} disabled={saving} className="w-full">
    {saving ? (
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    ) : (
      <Save className="mr-2 h-4 w-4" />
    )}

    {isNewLead
      ? 'Create Membership & Continue'
      : 'Save Changes'}
  </Button>

</CardContent>
 </Card>

      {!isNewLead && memberType !== 'paid' && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2"><Crown className="h-4 w-4 text-primary" /> Upgrade to Paid</h3>
              <p className="text-sm text-muted-foreground mt-1">Unlimited estimates with a paid membership.</p>
            </div>
            <Button onClick={() => (window.location.href = EXIT_URL)}>Upgrade</Button>
          </CardContent>
        </Card>
      )}

      {!isNewLead && (
        <Card className="border-destructive/30">
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2"><LogOut className="h-4 w-4 text-destructive" /> Exit</h3>
              <p className="text-sm text-muted-foreground mt-1">Sign out and return to the membership portal.</p>
            </div>
            <Button variant="destructive" onClick={handleExit}>Exit</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
