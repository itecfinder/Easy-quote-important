import { useEffect, useState } from 'react';

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);
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
    loggedIn: session?.loggedIn ?? false,
    loading,
  };
};
