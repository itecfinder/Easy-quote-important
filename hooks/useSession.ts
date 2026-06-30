import { useEffect, useState } from 'react';
import type { SessionPayload } from '@/lib/types';

export const useSession = () => {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = document.cookie
      .split('; ')
      .find((row) => row.startsWith('session='))
      ?.split('=')[1];

    if (!raw) {
      setSession(null);
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      setSession(parsed);
    } catch {
      setSession(null);
    }

    setLoading(false);
  }, []);

  return {
    session,
    email: session?.email ?? null,
    loggedIn: !!session,
    loading,
  };
};
