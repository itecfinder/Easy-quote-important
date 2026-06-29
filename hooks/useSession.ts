'use client';

import { useEffect, useState } from 'react';

export function useSession() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();

        setEmail(data?.email ?? null);
      } catch {
        setEmail(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { email, loading };
}
