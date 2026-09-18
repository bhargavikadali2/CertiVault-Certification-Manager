import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Eye, Download, Edit, Trash2, ExternalLink, FileText, Image as ImageIcon, Award, Building2, Calendar, Hash, Link as LinkIcon, AlignLeft, Loader2 } from 'lucide-react';
import { supabase, Certificate, CERTIFICATES_BUCKET } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { downloadCertificateFile, deleteCertificateFile } from '@/lib/fileStorage';
import { formatDate, isImageFile, isPdfFile } from '@/lib/utils';
import { Button, CategoryBadge, LoadingSpinner } from '@/components/ui';

interface CertificateDetailsProps {
  certId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}

export default function CertificateDetails({ certId, onBack, onEdit }: CertificateDetailsProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadCertificate = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', certId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      showToast('Certificate not found.', 'error');
      onBack();
      return;
    }
    setCert(data as Certificate);
    setLoading(false);

    // Get signed URL for preview
    if ((data as Certificate).file_path) {
      const { data: urlData, error: urlError } = await supabase.storage
        .from(CERTIFICATES_BUCKET)
        .createSignedUrl((data as Certificate).file_path!, 3600);

      if (urlError || !urlData?.signedUrl) {
        console.error('Error getting file URL:', urlError?.message);
      } else {
        setFileUrl(urlData.signedUrl);
      }
    }
    setFileLoading(false);
  }, [user, certId, showToast, onBack]);

  useEffect(() => {
    loadCertificate();
  }, [loadCertificate]);

  const handleDownload = async () => {
    if (!cert) return;
    setDownloading(true);
    const { error } = await downloadCertificateFile(cert);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Certificate downloaded.', 'success');
    }
    setDownloading(false);
  };

  const handleDelete = async () => {
    if (!cert) return;
    setDeleting(true);
    try {
      if (cert.file_path) {
        await deleteCertificateFile(cert.file_path);
      }
      const { error } = await supabase.from('certificates').delete().eq('id', cert.id);
      if (error) throw error;
      showToast('Certificate deleted successfully.', 'success');
      onBack();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete certificate.';
      showToast(msg, 'error');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size={32} className="text-blue-600" />
      </div>
    );
  }

  if (!cert) return null;

  const isImg = isImageFile(cert.file_type, cert.file_name);
  const isPdf = isPdfFile(cert.file_type, cert.file_name);

  const details = [
    { icon: Building2, label: 'Issuing Organization', value: cert.issuing_organization },
    { icon: Calendar, label: 'Issue Date', value: formatDate(cert.issue_date) },
    { icon: Hash, label: 'Credential ID', value: cert.credential_id },
    { icon: LinkIcon, label: 'Credential URL', value: cert.credential_url, isLink: true },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft size={16} /> Back to My Certificates
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="mb-4">
              <CategoryBadge category={cert.category} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight mb-1">
              {cert.certificate_name}
            </h1>
            <p className="text-sm text-slate-500">{cert.issuing_organization}</p>

            <div className="mt-6 space-y-4">
              {details.map((d) => (
                <div key={d.label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <d.icon size={18} className="text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-400 font-medium">{d.label}</p>
                    {d.isLink && d.value ? (
                      <a
                        href={d.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline truncate block"
                      >
                        {d.value}
                      </a>
                    ) : (
                      <p className="text-sm text-slate-900 break-words">{d.value || '—'}</p>
                    )}
                  </div>
                </div>
              ))}

              {cert.description && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <AlignLeft size={18} className="text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-400 font-medium">Description</p>
                    <p className="text-sm text-slate-900 whitespace-pre-wrap">{cert.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-2">
              <Button onClick={handleDownload} disabled={downloading || !cert.file_path} fullWidth>
                {downloading ? <LoadingSpinner size={16} /> : <Download size={16} />}
                Download Certificate
              </Button>
              {cert.credential_url && (
                <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="outline" fullWidth>
                    <ExternalLink size={16} /> Verify Certificate
                  </Button>
                </a>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onEdit(cert.id)} fullWidth>
                  <Edit size={16} /> Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(true)}
                  fullWidth
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 size={16} /> Delete
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-slate-100">
              <Eye size={18} className="text-slate-400" />
              <h2 className="font-semibold text-slate-900 text-sm">Certificate Preview</h2>
            </div>
            <div className="p-4">
              {fileLoading ? (
                <div className="flex items-center justify-center py-24">
                  <LoadingSpinner size={28} className="text-blue-600" />
                </div>
              ) : !cert.file_path ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                  <Award size={40} className="mb-3" />
                  <p className="text-sm">No file attached to this certificate.</p>
                </div>
              ) : !fileUrl ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                  <FileText size={40} className="mb-3" />
                  <p className="text-sm">Unable to load file preview.</p>
                  <Button variant="outline" onClick={handleDownload} className="mt-4">
                    <Download size={16} /> Download instead
                  </Button>
                </div>
              ) : isImg ? (
                <div className="flex items-center justify-center bg-slate-50 rounded-lg p-4">
                  <img
                    src={fileUrl}
                    alt={cert.certificate_name}
                    className="max-w-full max-h-[600px] rounded-lg shadow-sm"
                  />
                </div>
              ) : isPdf ? (
                <div className="bg-slate-50 rounded-lg overflow-hidden">
                  <iframe
                    src={fileUrl}
                    title={cert.certificate_name}
                    className="w-full h-[600px] border-0"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                  <FileText size={40} className="mb-3" />
                  <p className="text-sm">Preview not available for this file type.</p>
                  <Button variant="outline" onClick={handleDownload} className="mt-4">
                    <Download size={16} /> Download File
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !deleting && setDeleteConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-fade-in-up">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete certificate?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete "{cert.certificate_name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="danger" onClick={handleDelete} disabled={deleting} fullWidth>
                {deleting ? <LoadingSpinner size={16} /> : <Trash2 size={16} />}
                Delete
              </Button>
              <Button variant="outline" onClick={() => setDeleteConfirm(false)} disabled={deleting} fullWidth>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
