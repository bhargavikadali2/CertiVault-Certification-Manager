import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, PlusCircle, Award, Eye, Download, Edit, Trash2, FileText, Image as ImageIcon, SlidersHorizontal, X } from 'lucide-react';
import { supabase, Certificate, CATEGORIES } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { downloadCertificateFile, deleteCertificateFile } from '@/lib/fileStorage';
import { formatDate, isImageFile, isPdfFile, classNames } from '@/lib/utils';
import { LoadingSpinner, Button, CategoryBadge, EmptyState, Select } from '@/components/ui';
import { Page } from '@/components/AppLayout';

interface CertificatesPageProps {
  onNavigate: (page: Page) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc';

export default function CertificatesPage({ onNavigate, onView, onEdit }: CertificatesPageProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Certificate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCertificates = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading certificates:', error.message);
      setLoading(false);
      return;
    }
    setCertificates((data as Certificate[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  const filtered = useMemo(() => {
    let result = [...certificates];

    // Search by name or organization
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.certificate_name.toLowerCase().includes(q) ||
          c.issuing_organization.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (category !== 'all') {
      result = result.filter((c) => c.category === category);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'name_asc':
        result.sort((a, b) => a.certificate_name.localeCompare(b.certificate_name));
        break;
      case 'name_desc':
        result.sort((a, b) => b.certificate_name.localeCompare(a.certificate_name));
        break;
    }

    return result;
  }, [certificates, search, category, sortBy]);

  const handleDownload = async (cert: Certificate) => {
    setDownloadingId(cert.id);
    const { error } = await downloadCertificateFile(cert);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Certificate downloaded.', 'success');
    }
    setDownloadingId(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);

    try {
      // Delete file from storage
      if (deleteConfirm.file_path) {
        await deleteCertificateFile(deleteConfirm.file_path);
      }
      // Delete record
      const { error } = await supabase
        .from('certificates')
        .delete()
        .eq('id', deleteConfirm.id);

      if (error) throw error;

      showToast('Certificate deleted successfully.', 'success');
      setCertificates((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete certificate.';
      showToast(msg, 'error');
    }
    setDeleting(false);
  };

  const hasFilters = search.trim() || category !== 'all';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size={32} className="text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Certificates</h1>
          <p className="text-slate-500 text-sm mt-1">
            {certificates.length} {certificates.length === 1 ? 'certificate' : 'certificates'} in your vault
          </p>
        </div>
        <Button onClick={() => onNavigate('add')}>
          <PlusCircle size={18} />
          Add Certificate
        </Button>
      </div>

      {/* Search and filters */}
      {certificates.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or organization..."
                className="w-full rounded-lg border border-slate-300 bg-white pl-11 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <Select value={category} onChange={(e) => setCategory(e.target.value)} className="min-w-[150px]">
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="min-w-[150px]">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
              </Select>
            </div>
          </div>
          {hasFilters && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <SlidersHorizontal size={14} />
              Showing {filtered.length} of {certificates.length}
              <button
                onClick={() => { setSearch(''); setCategory('all'); }}
                className="text-blue-600 hover:text-blue-700 font-medium ml-2"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Certificates grid */}
      {certificates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <EmptyState
            icon={<Award size={28} />}
            title="No certificates yet"
            description="Upload your first certificate to start building your vault."
            action={<Button onClick={() => onNavigate('add')}><PlusCircle size={16} />Add Certificate</Button>}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <EmptyState
            icon={<Search size={28} />}
            title="No results found"
            description="Try adjusting your search or filters."
            action={<Button variant="outline" onClick={() => { setSearch(''); setCategory('all'); }}>Clear filters</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((cert) => {
            const isImg = isImageFile(cert.file_type, cert.file_name);
            const isPdf = isPdfFile(cert.file_type, cert.file_name);
            return (
              <div
                key={cert.id}
                className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-200 flex flex-col"
              >
                {/* File indicator header */}
                <button
                  onClick={() => onView(cert.id)}
                  className="relative h-32 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center overflow-hidden"
                >
                  {isImg ? (
                    <div className="flex flex-col items-center gap-1 text-slate-400">
                      <ImageIcon size={36} />
                      <span className="text-xs font-medium">Image File</span>
                    </div>
                  ) : isPdf ? (
                    <div className="flex flex-col items-center gap-1 text-red-400">
                      <FileText size={36} />
                      <span className="text-xs font-medium">PDF Document</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-400">
                      <Award size={36} />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <CategoryBadge category={cert.category} />
                  </div>
                </button>

                {/* Card body */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 mb-1">
                    {cert.certificate_name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-2 truncate">{cert.issuing_organization}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                    <span>{formatDate(cert.issue_date)}</span>
                    {cert.credential_id && (
                      <>
                        <span>·</span>
                        <span className="truncate">ID: {cert.credential_id}</span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" onClick={() => onView(cert.id)} className="w-full">
                      <Eye size={14} /> View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(cert)}
                      disabled={downloadingId === cert.id}
                      className="w-full"
                    >
                      {downloadingId === cert.id ? <LoadingSpinner size={14} /> : <Download size={14} />}
                      Download
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onEdit(cert.id)} className="w-full">
                      <Edit size={14} /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteConfirm(cert)}
                      className="w-full text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !deleting && setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-fade-in-up">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete certificate?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete "{deleteConfirm.certificate_name}"? This will permanently remove the certificate and its file. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="danger" onClick={handleDelete} disabled={deleting} fullWidth>
                {deleting ? <LoadingSpinner size={16} /> : <Trash2 size={16} />}
                Delete
              </Button>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting} fullWidth>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
