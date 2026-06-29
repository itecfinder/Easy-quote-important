'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Save,
  Loader2,
  LogOut,
  Crown,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { supabase } from '@/lib/supabase-client';
import { EXIT_URL } from '@/lib/constants';

export function SettingsScreen() {
  const router = useRouter();
  const { contractor, setContractor, memberType, planId } = useApp();

  const isNewLead = memberType === 'new';

  // -----------------------------
  // Form State
  // -----------------------------
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [license, setLicense] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // -----------------------------
  // Load contractor into form
  // -----------------------------
  useEffect(() => {
    if (!contractor) return;

    setCompanyName(contractor.companyName || '');
    setPhone(contractor.phone || '');
    setAddress(contractor.address || '');
    setLicense(contractor.license || '');
  }, [contractor]);

  // -----------------------------
  // Logo handler
  // -----------------------------
  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function uploadLogo(file: File): Promise<string> {
    if (!contractor?.email) throw new Error('Missing contractor email');

    const filePath = `logos/${contractor.email}-${Date.now()}`;

    const { error } = await supabase.storage
      .from('contractor-logos')
      .upload(filePath, file, {
        upsert: true,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from('contractor-logos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  // -----------------------------
  // Save handler
  // -----------------------------
  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      if (!contractor?.email) {
        throw new Error('Missing contractor session');
      }

      let finalLogoUrl = contractor.logoUrl || '';

      // Upload logo if new file selected
      if (logoFile) {
        finalLogoUrl = await uploadLogo(logoFile);
      }

      // -----------------------------
      // NEW LEAD FLOW (BD CREATE)
      // -----------------------------
      if (isNewLead) {
        const res = await fetch('/api/auth/create-free-member', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: contractor.email,
            companyName,
            phone,
            address,
            license,
            firstName,
            lastName,
            logoUrl: finalLogoUrl,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to create membership');
        }

        // Update local state
        setContractor({
          email: contractor.email,
          companyName,
          phone,
          address,
          license,
          logoUrl: finalLogoUrl,
          membershipPlan: 8,
        });

        setSaved(true);
        setTimeout(() => router.push('/dashboard'), 1200);
        return;
      }

      // -----------------------------
      // EXISTING MEMBER (SUPABASE ONLY)
      // -----------------------------
      const { error: updateErr } = await supabase
        .from('contractors')
        .update({
          company_name: companyName,
          phone,
          address,
          license,
          logo_url: finalLogoUrl,
          first_name: firstName,
          last_name: lastName,
        })
        .eq('email', contractor.email);

      if (updateErr) throw updateErr;

      setContractor({
        ...contractor,
        companyName,
        phone,
        address,
        license,
        logoUrl: finalLogoUrl,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------
  // Exit / logout
  // -----------------------------
  function handleExit() {
    localStorage.removeItem('contractor');
    localStorage.removeItem('session');

    fetch('/api/auth/session', { method: 'DELETE' }).finally(() => {
      window.location.href = EXIT_URL;
    });
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {isNewLead ? 'Set Up Your Business Profile' : 'Settings'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isNewLead
            ? 'Complete your profile to activate your free membership.'
            : 'Manage your business profile.'}
        </p>
      </div>

      {/* New Lead Banner */}
      {isNewLead && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex gap-3">
            <UserPlus className="h-5 w-5 text-primary mt-1" />
            <div>
              <p className="font-medium text-sm">New Contractor Account</p>
              <p className="text-xs text-muted-foreground">
                Creating your profile will activate your free membership.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Business Profile
          </CardTitle>

          <CardDescription>
            {isNewLead ? 'Free Plan (1 estimate)' : `Plan ID: ${planId}`} •{' '}
            {contractor?.email}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* Name + Logo */}
          <div className="grid sm:grid-cols-3 gap-4">
            {isNewLead && (
              <>
                <div>
                  <Label>First Name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>

                <div>
                  <Label>Last Name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </>
            )}

            <div>
              <Label>Logo</Label>

              {logoPreview ? (
                <img
                  src={logoPreview}
                  className="h-24 w-24 border rounded-lg object-contain p-2"
                />
              ) : (
                <div className="h-24 w-24 border rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                  No Logo
                </div>
              )}

              <Input type="file" accept="image/*" onChange={handleLogoUpload} />
            </div>
          </div>

          {/* Company */}
          <div>
            <Label>Company Name</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>

          {/* Email */}
          <div>
            <Label>Email</Label>
            <Input value={contractor?.email || ''} disabled />
          </div>

          {/* Phone + License */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div>
              <Label>License</Label>
              <Input value={license} onChange={(e) => setLicense(e.target.value)} />
            </div>
          </div>

          {/* Address */}
          <div>
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          {/* Error */}
          {error && (
            <div className="flex gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Saved */}
          {saved && (
            <p className="text-sm text-green-600">
              {isNewLead ? 'Account created!' : 'Profile saved!'}
            </p>
          )}

          {/* Save */}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {isNewLead ? 'Create Account' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Upgrade */}
      {!isNewLead && memberType !== 'paid' && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex justify-between items-center p-5">
            <div>
              <p className="font-semibold flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                Upgrade to Paid
              </p>
              <p className="text-sm text-muted-foreground">
                Unlimited estimates
              </p>
            </div>
            <Button onClick={() => (window.location.href = EXIT_URL)}>
              Upgrade
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Exit */}
      {!isNewLead && (
        <Card>
          <CardContent className="flex justify-between items-center p-5">
            <div>
              <p className="font-semibold flex items-center gap-2">
                <LogOut className="h-4 w-4 text-red-500" />
                Exit
              </p>
              <p className="text-sm text-muted-foreground">
                Sign out and leave portal
              </p>
            </div>

            <Button variant="destructive" onClick={handleExit}>
              Exit
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
