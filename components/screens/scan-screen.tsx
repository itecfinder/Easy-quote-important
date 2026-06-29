'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScanLine, Loader2, Ruler, Package, Wrench, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/app-context';
import type { ScanResult } from '@/lib/types';

export function ScanScreen() {
  const router = useRouter();
  const { project, setScanResult, memberType } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function runAnalysis() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/estimates/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: project.images }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setScanResult(data.scanResult as ScanResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }

  const scan = project.scanResults as ScanResult | undefined;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in-fade">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <ScanLine className="h-10 w-10 text-primary animate-pulse" />
          </div>
        </div>
        <h2 className="text-xl font-semibold mt-6">Analyzing project photos...</h2>
        <p className="text-muted-foreground mt-2 text-sm">Detecting room type, dimensions, materials, and labor.</p>
        <div className="flex gap-2 mt-6">
          {['Room type', 'Dimensions', 'Materials', 'Labor'].map((s, i) => (
            <Loader2 key={s} className="h-4 w-4 text-primary animate-spin" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto animate-in-fade">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive font-medium mb-2">{error}</p>
            <p className="text-sm text-muted-foreground mb-4">
              {memberType === 'free' ? 'Your free estimate may have been used.' : 'Please try again.'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => router.push('/capture')}>Back</Button>
              <Button onClick={runAnalysis}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="max-w-md mx-auto text-center py-12 animate-in-fade">
        <ScanLine className="h-16 w-16 mx-auto text-primary mb-4" />
        <h2 className="text-xl font-semibold mb-2">Ready to Scan</h2>
        <p className="text-muted-foreground mb-6">{project.images.length} photo(s) ready for AI analysis.</p>
        <Button size="lg" onClick={runAnalysis}>
          <ScanLine className="mr-2 h-4 w-4" /> Start AI Analysis
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in-fade max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-success">
        <CheckCircle2 className="h-5 w-5" />
        <span className="font-medium">Analysis Complete</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Ruler className="h-5 w-5 text-primary" /> Detected Scope</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-sm text-muted-foreground">Room Type</span>
            <p className="font-medium">{scan.roomType}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Dimensions</span>
            <p className="font-medium">{scan.dimensions}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Materials</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {scan.materials.map((m, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{m}</li>)}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> Labor</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {scan.labor.map((l, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{l}</li>)}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Fixtures</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {scan.fixtures.map((f, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{f}</li>)}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Trash2 className="h-4 w-4 text-primary" /> Demolition</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {scan.demolition.map((d, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{d}</li>)}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Suggested Line Items</CardTitle>
          <CardDescription>{scan.suggestedLineItems.length} items detected. Review and edit in the estimate builder.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {scan.suggestedLineItems.map((li) => (
              <div key={li.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <p className="text-sm font-medium">{li.description}</p>
                  <p className="text-xs text-muted-foreground">{li.qty} {li.unit} @ ${li.unitPrice.toFixed(2)}</p>
                </div>
                <Badge variant={li.category === 'material' ? 'default' : 'secondary'} className="capitalize">{li.category}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push('/capture')}>Back</Button>
        <Button onClick={() => router.push('/estimate')}>
          Build Estimate <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
