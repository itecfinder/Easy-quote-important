/*
# Contractor Estimator - Core Schema

1. Overview
Creates the full data model for a contractor estimating platform. The app uses a
custom signed session cookie (NOT Supabase Auth), so the browser talks to
Supabase with the anon key. All policies therefore allow `anon, authenticated`
and ownership is scoped by the contractor's email (stored in the session cookie
and threaded through every insert/query by the app).

2. New Tables
- `contractors`: business profile + membership plan for each contractor (keyed by email).
  - id (uuid pk), email (unique), company_name, phone, address, license, website,
    logo_url, membership_plan (int), created_at.
- `estimate_usage`: tracks the single free-estimate limit for plan 8 contractors.
  - id (uuid pk), email (unique), free_estimate_used (bool), estimate_count (int),
    last_estimate_date (timestamptz).
- `projects`: a contractor's project (customer + type + status + totals + json blob).
  - id (uuid pk), contractor_email, customer_name, customer_email, project_type,
    status, estimate_total (numeric), project_data_json (jsonb), created_at, updated_at.
- `estimates`: line items + totals for a project.
  - id (uuid pk), project_id (fk -> projects), line_items_json (jsonb), subtotal,
    tax, markup, grand_total, created_at.
- `invoices`: invoice document for a project.
  - id (uuid pk), project_id (fk -> projects), invoice_number, invoice_json (jsonb),
    created_at.

3. Security
- RLS enabled on every table.
- Policies allow anon + authenticated full CRUD (the app is single-tenant by
  email and gates access via the signed session cookie at the Next.js layer;
  the database itself is intentionally shared across the anon client).

4. Notes
- All tables are idempotent (IF NOT EXISTS).
- Policies are dropped before recreate to stay idempotent.
*/

-- contractors
CREATE TABLE IF NOT EXISTS contractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  company_name text,
  phone text,
  address text,
  license text,
  website text,
  logo_url text,
  membership_plan integer NOT NULL DEFAULT 8,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_contractors" ON contractors;
CREATE POLICY "anon_select_contractors" ON contractors FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_contractors" ON contractors;
CREATE POLICY "anon_insert_contractors" ON contractors FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_contractors" ON contractors;
CREATE POLICY "anon_update_contractors" ON contractors FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_contractors" ON contractors;
CREATE POLICY "anon_delete_contractors" ON contractors FOR DELETE TO anon, authenticated USING (true);

-- estimate_usage
CREATE TABLE IF NOT EXISTS estimate_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  free_estimate_used boolean NOT NULL DEFAULT false,
  estimate_count integer NOT NULL DEFAULT 0,
  last_estimate_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE estimate_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_estimate_usage" ON estimate_usage;
CREATE POLICY "anon_select_estimate_usage" ON estimate_usage FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_estimate_usage" ON estimate_usage;
CREATE POLICY "anon_insert_estimate_usage" ON estimate_usage FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_estimate_usage" ON estimate_usage;
CREATE POLICY "anon_update_estimate_usage" ON estimate_usage FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_estimate_usage" ON estimate_usage;
CREATE POLICY "anon_delete_estimate_usage" ON estimate_usage FOR DELETE TO anon, authenticated USING (true);

-- projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_email text NOT NULL,
  customer_name text,
  customer_email text,
  project_type text,
  status text NOT NULL DEFAULT 'draft',
  estimate_total numeric(12,2) NOT NULL DEFAULT 0,
  project_data_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS projects_contractor_email_idx ON projects (contractor_email);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects (created_at DESC);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_projects" ON projects;
CREATE POLICY "anon_select_projects" ON projects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
CREATE POLICY "anon_insert_projects" ON projects FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_projects" ON projects;
CREATE POLICY "anon_update_projects" ON projects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
CREATE POLICY "anon_delete_projects" ON projects FOR DELETE TO anon, authenticated USING (true);

-- estimates
CREATE TABLE IF NOT EXISTS estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  line_items_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  markup numeric(12,2) NOT NULL DEFAULT 0,
  grand_total numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS estimates_project_id_idx ON estimates (project_id);
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_estimates" ON estimates;
CREATE POLICY "anon_select_estimates" ON estimates FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_estimates" ON estimates;
CREATE POLICY "anon_insert_estimates" ON estimates FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_estimates" ON estimates;
CREATE POLICY "anon_update_estimates" ON estimates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_estimates" ON estimates;
CREATE POLICY "anon_delete_estimates" ON estimates FOR DELETE TO anon, authenticated USING (true);

-- invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  invoice_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoices_project_id_idx ON invoices (project_id);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_invoices" ON invoices;
CREATE POLICY "anon_select_invoices" ON invoices FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_invoices" ON invoices;
CREATE POLICY "anon_insert_invoices" ON invoices FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_invoices" ON invoices;
CREATE POLICY "anon_update_invoices" ON invoices FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_invoices" ON invoices;
CREATE POLICY "anon_delete_invoices" ON invoices FOR DELETE TO anon, authenticated USING (true);

-- updated_at trigger for projects
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_touch_updated_at ON projects;
CREATE TRIGGER projects_touch_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
