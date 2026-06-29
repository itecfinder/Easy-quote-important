'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { Contractor, Estimate, ProjectData, ScanResult } from '@/lib/types';
import { emptyProject, emptyEstimate } from '@/lib/estimate-utils';

interface AppContextValue {
  contractor: Contractor | null;
  setContractor: (c: Contractor | null) => void;
  memberType: 'paid' | 'free' | 'new';
  planId: number;
  project: ProjectData;
  setProject: (p: ProjectData) => void;
  scanResult: ScanResult | null;
  setScanResult: (s: ScanResult | null) => void;
  estimate: Estimate;
  setEstimate: (e: Estimate) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: { email: string; planId: number; memberType: 'paid' | 'free' | 'new' };
}) {
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [project, setProject] = useState<ProjectData>(emptyProject);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [estimate, setEstimate] = useState<Estimate>(emptyEstimate);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <AppContext.Provider
      value={{
        contractor,
        setContractor,
        memberType: session.memberType,
        planId: session.planId,
        project,
        setProject,
        scanResult,
        setScanResult,
        estimate,
        setEstimate,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
