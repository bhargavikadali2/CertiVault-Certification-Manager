import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const CERTIFICATES_BUCKET = 'certificates';

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

export const CATEGORIES = [
  'Academic',
  'Professional',
  'Technical',
  'Online Course',
  'Workshop',
  'Bootcamp',
  'Competition',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Certificate {
  id: string;
  user_id: string;
  certificate_name: string;
  issuing_organization: string;
  category: string;
  issue_date: string;
  credential_id: string | null;
  credential_url: string | null;
  description: string | null;
  file_path: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type CertificateInput = Omit<
  Certificate,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>;
