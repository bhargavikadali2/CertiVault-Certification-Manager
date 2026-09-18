import { supabase, CERTIFICATES_BUCKET, Certificate } from '@/lib/supabase';

export async function uploadCertificateFile(
  userId: string,
  file: File,
  certId: string
): Promise<{ path: string; error: string | null }> {
  const ext = file.name.split('.').pop();
  const filePath = `${userId}/${certId}.${ext}`;

  const { error } = await supabase.storage
    .from(CERTIFICATES_BUCKET)
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) return { path: '', error: error.message };
  return { path: filePath, error: null };
}

export async function deleteCertificateFile(filePath: string): Promise<{ error: string | null }> {
  const { error } = await supabase.storage
    .from(CERTIFICATES_BUCKET)
    .remove([filePath]);
  return { error: error?.message ?? null };
}

export async function getFileSignedUrl(filePath: string): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.storage
    .from(CERTIFICATES_BUCKET)
    .createSignedUrl(filePath, 3600);
  if (error) return { url: null, error: error.message };
  return { url: data.signedUrl, error: null };
}

export async function downloadCertificateFile(
  cert: Certificate
): Promise<{ error: string | null }> {
  if (!cert.file_path) return { error: 'No file attached to this certificate.' };

  const { data, error } = await supabase.storage
    .from(CERTIFICATES_BUCKET)
    .createSignedUrl(cert.file_path, 3600);

  if (error || !data?.signedUrl) {
    return { error: error?.message ?? 'Failed to generate download link.' };
  }

  try {
    const response = await fetch(data.signedUrl);
    if (!response.ok) return { error: 'Failed to download file.' };
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cert.file_name || `${cert.certificate_name}.${cert.file_type === 'application/pdf' ? 'pdf' : 'file'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return { error: null };
  } catch {
    return { error: 'Failed to download file.' };
  }
}
