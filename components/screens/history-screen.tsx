'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Clock, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { supabase } from '@/lib/supabase-client';

interface HistoryProject {
  id: string;
  customer_name: string;
  customer_email: string;
  project_type: string;
  status: string;
  estimate_total: number;
  created_at: string;
}

export function HistoryScreen() {
  const router = useRouter();
  const { contractor } = useApp();
  const [projects, setProjects] = useState<HistoryProject[]>([]);
  const [filtered, setFiltered] = useState<HistoryProject[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contractor?.email) return;
    (async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, customer_name, customer_email, project_type, status, estimate_total, created_at')
        .eq('contractor_email', contractor.email)
        .order('created_at', { ascending: false });
      setProjects((data as HistoryProject[]) || []);
      setFiltered((data as HistoryProject[]) || []);
      setLoading(false);
    })();
  }, [contractor?.email]);

  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(projects.filter((p) =>
      p.customer_name?.toLowerCase().includes(q) ||
      p.project_type?.toLowerCase().includes(q) ||
      p.status?.toLowerCase().includes(q)
    ));
  }, [query, projects]);

  return (
    <div className="space-y-6 animate-in-fade max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Project History</h1>
        <p className="text-muted-foreground mt-1">Search and reopen previous estimates.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by customer, type, or status..."
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No projects found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.customer_name || 'Untitled'}</p>
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
                  <Badge variant={p.status === 'completed' ? 'default' : p.status === 'invoiced' ? 'outline' : 'secondary'} className="capitalize">{p.status}</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button variant="outline" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
    </div>
  );
}
