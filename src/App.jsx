import { useCallback, useEffect, useState } from 'react';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import {
  loadRecords,
  supabase,
  verifyPortfolioOwner,
} from './lib/portfolioStore';

export default function App() {
  const [records, setRecords] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [authError, setAuthError] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  const refreshRecords = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setRecords(await loadRecords());
    } catch (error) {
      setLoadError(error.message || 'Could not load portfolio data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setAuthError(`Could not restore owner session: ${error.message}`);
        setSession(data?.session ?? null);
      })
      .catch((error) => {
        if (active) setAuthError(error.message || 'Could not restore owner session.');
      });

    const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (active) {
        setSession(currentSession);
        setIsOwner(false);
        setAuthError('');
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!session) {
      setIsOwner(false);
      return undefined;
    }
    verifyPortfolioOwner()
      .then((owner) => {
        if (active) setIsOwner(owner);
      })
      .catch((error) => {
        if (active) setAuthError(error.message || 'Could not verify owner access.');
      });
    return () => {
      active = false;
    };
  }, [session]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    loadRecords()
      .then((items) => {
        if (active) setRecords(items);
      })
      .catch((error) => {
        if (active) setLoadError(error.message || 'Could not load portfolio data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session]);

  const isDashboardPath = ['/dashboard', '/admin'].includes(
    window.location.pathname.replace(/\/+$/, '') || '/'
  );

  if (isDashboardPath) {
    return (
      <DashboardPage
        records={records}
        session={session}
        refreshRecords={refreshRecords}
        onSessionChange={setSession}
        isOwner={isOwner}
        loadError={loadError}
        authError={authError}
        loading={loading}
      />
    );
  }

  return (
    <HomePage
      records={records}
    />
  );
}
