'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useSession } from '@/hooks/useSession';
import { useContractorProfile } from '@/hooks/useContractorProfile';

import { supabase } from '@/lib/supabase-client';
import { EXIT_URL } from '@/lib/constants';

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

export function SettingsScreen() {
  const router = useRouter();

  // 🔐 SESSION (source of truth)
  const { email, loading: sessionLoading } = useSession();

  // 🧑 PROFILE (DB state)
  const { profile, setProfile, loading: profileLoading } =
    useContractorProfile(email);

  const isNewLead = !profile && !profileLoading;

  // -----------------------------
  // Form state (local UI only)
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
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // -----------------------------
  // Load profile into form once
  // -----------------------------
  useState(() => {
    if (!profile) return;

    setCompanyName(profile.companyName || '');
    setPhone(profile.phone || '');
    setAddress(profile.address || '');
    setLicense(profile.license || '');
    setFirstName(profile.firstName || '');
    setLastName(profile.lastName || '');
  });

  // -----------------------------
  // GUARD
  // -----------------------------
  if (sessionLoading) {
    return <p className="p-6">Loading session...</p>;
  }

  if (!email) {
    return <p className="p-6 text-red-500">Missing session. Please login.</p>;
  }

  // -----------------------------
  // SAVE LOGIC
  // -----------------------------
  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      let finalLogoUrl = profile?.logoUrl || '';

      if (logoFile) {
        const filePath = `logos/${email}-${Date.now()}`;

        const { error } = await supabase.storage
          .from('contractor-logos')
          .upload(filePath, logoFile, { upsert: true });

        if (error) throw error;

        const { data } = supabase.storage
          .from('contractor-logos')
          .getPublicUrl(filePath);

        finalLogoUrl = data.publicUrl;
      }

      // NEW LEAD → CREATE BD ACCOUNT
      if (!profile) {
        const res = await fetch('/api/auth/create-free-member', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
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
        if (!res.ok) throw new Error(data.error);

        setProfile({
          email,
          companyName,
          phone,
          address,
          license,
          firstName,
          lastName,
          logoUrl: finalLogoUrl,
        });

        setSaved(true);
        setTimeout(() => router.push('/dashboard'), 1200);
        return;
      }

      // EXISTING → UPDATE SUPABASE
      const { error } = await supabase
        .from('contractors')
        .update({
          company_name: companyName,
          phone,
          address,
          license,
          first_name: firstName,
          last_name: lastName,
          logo_url: finalLogoUrl,
        })
        .eq('email', email);

      if (error) throw error;

      setProfile({
        ...profile,
        companyName,
        phone,
        address,
        license,
        firstName,
        lastName,
        logoUrl: finalLogoUrl,
      });

      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------
  // UI (simplified)
  // -----------------------------
  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <h1 className="text-2xl font-bold">
        {isNewLead ? 'Set Up Your Business Profile' : 'Settings'}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>{email}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">

          <div>
            <Label>Company Name</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>

          <div>
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save />}
            Save
          </Button>

          {error && <p className="text-red-500">{error}</p>}
          {saved && <p className="text-green-600">Saved!</p>}
        </CardContent>
      </Card>
    </div>
  );
}
