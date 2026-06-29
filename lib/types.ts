export type MemberType = 'paid' | 'free' | 'new';

export interface SessionPayload {
  email: string;
  planId: number;
  memberType: MemberType;
}

export interface LineItem {
  id: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
  category: 'material' | 'labor' | 'other';
}

export interface ScanResult {
  roomType: string;
  dimensions: string;
  materials: string[];
  fixtures: string[];
  labor: string[];
  demolition: string[];
  suggestedLineItems: LineItem[];
}

export interface ProjectData {
  customerName: string;
  customerEmail: string;
  projectType: string;
  images: string[];
  scanResults?: ScanResult;
}

export interface Estimate {
  id?: string;
  projectId?: string;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  markup: number;
  grandTotal: number;
  createdAt?: string;
}

export interface Invoice {
  id?: string;
  projectId?: string;
  invoiceNumber: string;
  data: Estimate & { customerName: string; customerEmail: string; companyName: string };
  createdAt?: string;
}

export interface Contractor {
  id?: string;
  email: string;
  companyName?: string;
  phone?: string;
  address?: string;
  license?: string;
  website?: string;
  logoUrl?: string;
  membershipPlan: number;
  createdAt?: string;
}
