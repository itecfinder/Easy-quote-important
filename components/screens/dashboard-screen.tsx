'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, FileText, Wrench, PaintRoller, Hammer, Zap, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { supabase } from '@/lib/supabase-client';
import { emptyProject } from '@/lib/estimate-utils';

interface RecentProject {
  id: string;
  customer_name: string;
  project_type: string;
  status: string;
  estimate_total: number;
  created_at: string;
}

const templates = [
  { label: 'Kitchen Remodel', icon: Wrench, type: 'Kitchen Remodel' },
  { label: 'Bathroom Reno', icon: PaintRoller, type: 'Bathroom Renovation' },
  { label: 'Roofing', icon: Hammer, type: 'Roofing' },
  { label: 'Electrical', icon: Zap, type: 'Electrical' },
];

export function DashboardScreen() {
  const router = useRouter();
  const { contractor, memberType, setProject, refreshKey } = useApp();
  const [recent, setRecent] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contractor?.email) return;
    (async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, customer_name, project_type, status, estimate_total, created_at')
        .eq('contractor_email', contractor.email)
        .order('created_at', { ascending: false })
        .limit(6);
      setRecent((data as RecentProject[]) || []);
      setLoading(false);
    })();
  }, [contractor?.email, refreshKey]);

  function startNew(type?: string) {
    setProject({ ...emptyProject, projectType: type || '' });
    router.push('/capture');
  }

  return (
    <div className="space-y-6 animate-in-fade">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{contractor?.companyName ? `, ${contractor.companyName}` : ''}.
        </h1>
        <p className="text-muted-foreground mt-1">
          {memberType === 'paid'
            ? 'Unlimited estimates — your paid membership is active.'
            : 'Free plan — you have one estimate included.'}
        </p>
      </div>

      <Card className="bg-gradient-to-br from-primary to-sky-600 text-primary-foreground border-0">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Start a New Project</h2>
            <p className="text-sky-100 text-sm mt-1">Capture photos, run AI analysis, and build an estimate.</p>
          </div>
          <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 shrink-0" onClick={() => startNew()}>
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Templates</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {templates.map((t) => (
            <button
              key={t.label}
              onClick={() => startNew(t.type)}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <t.icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent Projects</h3>
          <Button variant="ghost" size="sm" onClick={() => router.push('/history')}>
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : recent.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No projects yet. Start your first one above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recent.map((p) => (
              <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.customer_name || 'Untitled customer'}</p>
                      <p className="text-sm text-muted-foreground truncate">{p.project_type || 'General'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="font-semibold">${Number(p.estimate_total).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />{new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={p.status === 'completed' ? 'default' : 'secondary'} className="capitalize">{p.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
