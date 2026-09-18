/*
# CertiVault: Create profiles and certificates tables + storage bucket

## Overview
Sets up the full database backend for CertiVault, a personal certification manager.
Users sign up, log in, and manage their own certificates (upload, view, download, edit, delete).
Each user only ever sees their own data — enforced at the database level via RLS.

## New Tables

### profiles
- `id` (uuid, PK) — matches auth.users.id
- `full_name` (text) — display name
- `avatar_url` (text) — profile photo URL (from storage)
- `created_at` (timestamptz) — when the profile was created
- `updated_at` (timestamptz) — when the profile was last updated

### certificates
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL, DEFAULT auth.uid()) — owner, FK to auth.users, CASCADE on delete
- `certificate_name` (text, NOT NULL)
- `issuing_organization` (text, NOT NULL)
- `category` (text, NOT NULL)
- `issue_date` (date, NOT NULL)
- `credential_id` (text)
- `credential_url` (text)
- `description` (text)
- `file_path` (text) — storage path within the certificates bucket
- `file_name` (text) — original uploaded file name
- `file_type` (text) — MIME type of the uploaded file
- `file_size` (bigint) — file size in bytes
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

## Storage
- Creates a `certificates` storage bucket (private).
- Policies ensure users can only manage files under their own user-id folder.

## Security (RLS)
- profiles: owner-scoped CRUD (a user can read/update only their own profile row).
- certificates: owner-scoped CRUD (a user can only access rows where user_id = auth.uid()).
- Storage: users can read/write/delete only objects in their own folder path `auth.uid()/...`.
*/

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON public.profiles;
CREATE POLICY "delete_own_profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- =============================================
-- CERTIFICATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_name text NOT NULL,
  issuing_organization text NOT NULL,
  category text NOT NULL,
  issue_date date NOT NULL,
  credential_id text,
  credential_url text,
  description text,
  file_path text,
  file_name text,
  file_type text,
  file_size bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_certificates" ON public.certificates;
CREATE POLICY "select_own_certificates"
  ON public.certificates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_certificates" ON public.certificates;
CREATE POLICY "insert_own_certificates"
  ON public.certificates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_certificates" ON public.certificates;
CREATE POLICY "update_own_certificates"
  ON public.certificates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_certificates" ON public.certificates;
CREATE POLICY "delete_own_certificates"
  ON public.certificates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast owner-scoped queries
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_created_at ON public.certificates(created_at DESC);

-- =============================================
-- STORAGE BUCKET
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: each user can only manage their own folder (auth.uid()/...)
DROP POLICY IF EXISTS "Storage: users can read own files" ON storage.objects;
CREATE POLICY "Storage: users can read own files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Storage: users can upload own files" ON storage.objects;
CREATE POLICY "Storage: users can upload own files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Storage: users can update own files" ON storage.objects;
CREATE POLICY "Storage: users can update own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Storage: users can delete own files" ON storage.objects;
CREATE POLICY "Storage: users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text);
