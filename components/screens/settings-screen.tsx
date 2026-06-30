'use client';

import { useEffect, useState } from 'react';
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

import { Building2, Save, Loader2, LogOut, Crown } from 'lucide-react';

import { useApp } from '@/context/app-context';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/lib/supabase-client';
import { EXIT_URL } from '@/lib/constants';

export function SettingsScreen() {
  const router = useRouter();

  const { contractor, setContractor, memberType, planId } = useApp();
  const { session, loading } = useSession();

  const email = session?.email || '';

  // ---------------- FORM STATE ----------------
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [license, setLicense] = useState('');

  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // ---------------- LOAD DATA ----------------
  useEffect(() => {
    if (!contractor) return;

    setCompanyName(contractor.companyName || '');
    setPhone(contractor.phone || '');
    setAddress(contractor.address || '');
    setLicense(contractor.license || '');
  }, [contractor]);

  // ---------------- SESSION GUARD ----------------
  useEffect(() => {
    if (!loading && !email) {
      router.replace('/login');
    }
  }, [email, loading, router]);

  if (loading) return <p>Loading session...</p>;
  if (!email) return null;

  // ---------------- LOGO UPLOAD ----------------
  async function uploadLogo(file: File) {
    const filePath = `logos/${email}-${Date.now()}`;

    const { error: uploadError } = await supabase.storage
      .from('contractor-logos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('contractor-logos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  // ---------------- SAVE ----------------
  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      let finalLogoUrl = contractor?.logoUrl || '';

      if (logoFile) {
        finalLogoUrl = await uploadLogo(logoFile);
      }

      const { error: updateError } = await supabase
        .from('contractors')
        .update({
          company_name: companyName,
          phone,
          address,
          license,
          logo_url: finalLogoUrl,
        })
        .eq('email', email);

      if (updateError) throw updateError;

      setContractor({
  ...(contractor || {}),
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

  // ---------------- EXIT ----------------
  function handleExit() {
    localStorage.clear();
    fetch('/api/session', { method: 'DELETE' }).finally(() => {
      window.location.href = EXIT_URL;
    });
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* HEADER */}
     

      {/* PROFILE CARD */}
      <Card>
        <CardHeader>
  <div className="flex justify-between items-center">
    <CardTitle className="flex items-center gap-2 text-sm font-medium">
      <Building2 className="h-4 w-4" />
      Business Profile
    </CardTitle>

            <Badge variant={memberType === 'paid' ? 'default' : 'secondary'}>
              {memberType === 'paid' ? (
                <>
                  <Crown className="h-3 w-3 mr-1" />
                  Paid
                </>
              ) : (
                'Free Plan'
              )}
            </Badge>
          </div>

          <CardDescription>
            {email} • Plan ID: {planId}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">

          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>License</Label>
              <Input
                value={license}
                onChange={(e) => setLicense(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Upload Logo</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setLogoFile(e.target.files?.[0] || null)
              }
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {saved && (
            <p className="text-sm text-green-600">Profile saved</p>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* UPGRADE */}
      {memberType !== 'paid' && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Upgrade to Paid
              </h3>
              <p className="text-sm text-muted-foreground">
                Unlimited estimates and features.
              </p>
            </div>

            <Button onClick={() => (window.location.href = EXIT_URL)}>
              Upgrade
            </Button>
          </CardContent>
        </Card>
      )}

      {/* EXIT */}
      <Card className="border-destructive/30">
        <CardContent className="p-6 flex justify-between items-center">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <LogOut className="h-4 w-4 text-red-500" />
              Exit
            </h3>
            <p className="text-sm text-muted-foreground">
              Sign out and return to portal.
            </p>
          </div>

          <Button variant="destructive" onClick={handleExit}>
            Exit
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}
