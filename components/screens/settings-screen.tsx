'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useApp } from '@/context/app-context';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/lib/supabase-client';

export function SettingsScreen() {
  const router = useRouter();

  const { contractor, setContractor, memberType } = useApp();
  const { email, loading } = useSession();

  const isNewLead = memberType === 'new';

  // ---------------- FORM STATE ----------------
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [license, setLicense] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  // ---------------- SYNC contractor → form ----------------
  useEffect(() => {
    if (!contractor) return;

    setCompanyName(contractor.companyName || '');
    setPhone(contractor.phone || '');
    setAddress(contractor.address || '');
    setLicense(contractor.license || '');
    setFirstName(contractor.firstName || '');
    setLastName(contractor.lastName || '');
  }, [contractor]);

  // ---------------- SYNC session → contractor ----------------
  useEffect(() => {
    if (!email) return;

    setContractor((prev: any) => ({
      ...(prev || {}),
      email,
    }));
  }, [email, setContractor]);

  // ---------------- GUARD ----------------
  if (loading) return <p>Loading session...</p>;

  if (!email) {
    return (
      <div>
        <p>Session not found.</p>
        <button onClick={() => router.push('/login')}>
          Go to Login
        </button>
      </div>
    );
  }

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
    setError('');
    setSaved(false);

    try {
      let finalLogoUrl = contractor?.logoUrl || '';

      if (logoFile) {
        finalLogoUrl = await uploadLogo(logoFile);
      }

      // ---------------- NEW LEAD ----------------
      if (isNewLead) {
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

        if (!res.ok) {
          throw new Error(data?.error || 'Failed to create member');
        }

        setContractor({
          email,
          companyName,
          phone,
          address,
          license,
          firstName,
          lastName,
          logoUrl: finalLogoUrl,
          membershipPlan: 8,
        });

        setSaved(true);

        setTimeout(() => router.push('/dashboard'), 1000);
        return;
      }

      // ---------------- EXISTING USER UPDATE ----------------
      const { error: updateError } = await supabase
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

      if (updateError) throw updateError;

      setContractor((prev: any) => ({
        ...(prev || {}),
        companyName,
        phone,
        address,
        license,
        firstName,
        lastName,
        logoUrl: finalLogoUrl,
      }));

      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  // ---------------- UI ----------------
  return (
    <div>
      <h1>Business Profile</h1>

      <input
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder="Company Name"
      />

      <input value={email} disabled />

      <button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {saved && <p style={{ color: 'green' }}>Saved!</p>}
    </div>
  );
}
