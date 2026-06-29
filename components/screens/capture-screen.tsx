'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, X, Upload, ArrowRight, User } from 'lucide-react';
import { useApp } from '@/context/app-context';

const projectTypes = [
  'Kitchen Remodel', 'Bathroom Renovation', 'Roofing', 'Electrical',
  'Plumbing', 'Flooring', 'Painting', 'Drywall', 'Deck / Patio', 'Other',
];

export function CaptureScreen() {
  const router = useRouter();
  const { project, setProject } = useApp();
  const [customerName, setCustomerName] = useState(project.customerName || '');
  const [customerEmail, setCustomerEmail] = useState(project.customerEmail || '');
  const [projectType, setProjectType] = useState(project.projectType || '');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>(project.images || []);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setImages((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleContinue() {
    setProject({ ...project, customerName, customerEmail, projectType, images });
    router.push('/scan');
  }

  const canContinue = customerName && projectType && images.length > 0;

  return (
    <div className="space-y-6 animate-in-fade max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Project Capture</h1>
        <p className="text-muted-foreground mt-1">Enter customer details and upload project photos for AI analysis.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cn">Customer Name *</Label>
              <Input id="cn" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="John Smith" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ce">Customer Email</Label>
              <Input id="ce" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="john@example.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pt">Project Type *</Label>
            <div className="flex flex-wrap gap-2">
              {projectTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setProjectType(t)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    projectType === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-secondary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Project Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Scope details, special requests..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Camera className="h-5 w-5 text-primary" /> Project Photos *</CardTitle>
          <CardDescription>Upload photos of the project site for AI analysis.</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed rounded-xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Click to upload photos</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB each</p>
          </button>
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
              {images.map((img, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border">
                  <img src={img} alt={`Project ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>Back</Button>
        <Button onClick={handleContinue} disabled={!canContinue}>
          Run AI Analysis <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
