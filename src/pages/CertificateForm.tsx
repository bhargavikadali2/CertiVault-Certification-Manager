import { useState, useEffect, useCallback, FormEvent } from 'react';
import { ArrowLeft, Upload, FileText, Image as ImageIcon, X, Loader2, Save } from 'lucide-react';
import { supabase, Certificate, CertificateInput, CATEGORIES, ALLOWED_FILE_TYPES } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { uploadCertificateFile, deleteCertificateFile } from '@/lib/fileStorage';
import { Button, Input, Textarea, Select, LoadingSpinner } from '@/components/ui';
import { formatFileSize, classNames } from '@/lib/utils';

interface CertificateFormProps {
  editingId?: string;
  onDone: () => void;
  onBack: () => void;
}

export default function CertificateForm({ editingId, onDone, onBack }: CertificateFormProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(!!editingId);
  const [saving, setSaving] = useState(false);
  const [existingFile, setExistingFile] = useState<string | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);

  const [form, setForm] = useState<CertificateInput>({
    certificate_name: '',
    issuing_organization: '',
    category: 'Academic',
    issue_date: '',
    credential_id: '',
    credential_url: '',
    description: '',
    file_path: null,
    file_name: null,
    file_type: null,
    file_size: null,
  });

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadCertificate = useCallback(async () => {
    if (!editingId) return;
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', editingId)
      .maybeSingle();

    if (error || !data) {
      showToast('Certificate not found.', 'error');
      onBack();
      return;
    }

    const cert = data as Certificate;
    setForm({
      certificate_name: cert.certificate_name,
      issuing_organization: cert.issuing_organization,
      category: cert.category,
      issue_date: cert.issue_date,
      credential_id: cert.credential_id ?? '',
      credential_url: cert.credential_url ?? '',
      description: cert.description ?? '',
      file_path: cert.file_path,
      file_name: cert.file_name,
      file_type: cert.file_type,
      file_size: cert.file_size,
    });
    setExistingFile(cert.file_path);
    setExistingFileName(cert.file_name);
    setLoading(false);
  }, [editingId, showToast, onBack]);

  useEffect(() => {
    loadCertificate();
  }, [loadCertificate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ALLOWED_FILE_TYPES.includes(selected.type) && !ALLOWED_FILE_TYPES.includes(selected.name.toLowerCase())) {
      setErrors((prev) => ({ ...prev, file: 'Only PDF, JPG, and PNG files are allowed.' }));
      return;
    }

    setFile(selected);
    setErrors((prev) => ({ ...prev, file: '' }));

    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.certificate_name.trim()) e.certificate_name = 'Certificate name is required.';
    if (!form.issuing_organization.trim()) e.issuing_organization = 'Issuing organization is required.';
    if (!form.category) e.category = 'Category is required.';
    if (!form.issue_date) e.issue_date = 'Issue date is required.';
    if (!editingId && !file && !existingFile) e.file = 'Please upload a certificate file.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!validate()) return;

    setSaving(true);

    try {
      if (editingId) {
        // Update
        const updateData: Partial<CertificateInput> = {
          certificate_name: form.certificate_name.trim(),
          issuing_organization: form.issuing_organization.trim(),
          category: form.category,
          issue_date: form.issue_date,
          credential_id: form.credential_id?.trim() || null,
          credential_url: form.credential_url?.trim() || null,
          description: form.description?.trim() || null,
        };

        // If new file, upload and update file info
        if (file) {
          // Delete old file if exists
          if (existingFile) {
            await deleteCertificateFile(existingFile);
          }
          const { path, error: uploadError } = await uploadCertificateFile(user.id, file, editingId);
          if (uploadError) {
            showToast(`Upload failed: ${uploadError}`, 'error');
            setSaving(false);
            return;
          }
          updateData.file_path = path;
          updateData.file_name = file.name;
          updateData.file_type = file.type;
          updateData.file_size = file.size;
        }

        const { error: updateError } = await supabase
          .from('certificates')
          .update(updateData)
          .eq('id', editingId);

        if (updateError) throw updateError;
        showToast('Certificate updated successfully!', 'success');
      } else {
        // Create - first insert to get an ID, then upload file
        const insertData: Partial<CertificateInput> = {
          certificate_name: form.certificate_name.trim(),
          issuing_organization: form.issuing_organization.trim(),
          category: form.category,
          issue_date: form.issue_date,
          credential_id: form.credential_id?.trim() || null,
          credential_url: form.credential_url?.trim() || null,
          description: form.description?.trim() || null,
        };

        const { data: inserted, error: insertError } = await supabase
          .from('certificates')
          .insert(insertData)
          .select('id')
          .single();

        if (insertError || !inserted) throw insertError ?? new Error('Insert failed');

        const certId = inserted.id;

        if (file) {
          const { path, error: uploadError } = await uploadCertificateFile(user.id, file, certId);
          if (uploadError) {
            showToast(`Upload failed: ${uploadError}`, 'error');
            setSaving(false);
            return;
          }

          const { error: fileUpdateError } = await supabase
            .from('certificates')
            .update({
              file_path: path,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
            })
            .eq('id', certId);

          if (fileUpdateError) throw fileUpdateError;
        }

        showToast('Certificate added successfully!', 'success');
      }

      onDone();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      showToast(msg, 'error');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size={32} className="text-blue-600" />
      </div>
    );
  }

  const currentFileName = file?.name ?? existingFileName ?? '';
  const isImage = file ? file.type.startsWith('image/') : existingFileName && /\.(jpg|jpeg|png)$/i.test(existingFileName);

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">
        {editingId ? 'Edit Certificate' : 'Add Certificate'}
      </h1>
      <p className="text-slate-500 text-sm mb-8">
        {editingId ? 'Update your certificate details below.' : 'Fill in the details and upload your certificate file.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Certificate Name *"
          value={form.certificate_name}
          onChange={(e) => setForm({ ...form, certificate_name: e.target.value })}
          placeholder="e.g., AWS Certified Solutions Architect"
          error={errors.certificate_name}
        />

        <Input
          label="Issuing Organization *"
          value={form.issuing_organization}
          onChange={(e) => setForm({ ...form, issuing_organization: e.target.value })}
          placeholder="e.g., Amazon Web Services"
          error={errors.issuing_organization}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Select
            label="Category *"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            error={errors.category}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Select>

          <Input
            label="Issue Date *"
            type="date"
            value={form.issue_date}
            onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
            error={errors.issue_date}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="Credential ID"
            value={form.credential_id ?? ''}
            onChange={(e) => setForm({ ...form, credential_id: e.target.value })}
            placeholder="e.g., AWS-ASA-123456"
          />
          <Input
            label="Credential URL"
            type="url"
            value={form.credential_url ?? ''}
            onChange={(e) => setForm({ ...form, credential_url: e.target.value })}
            placeholder="https://verify.example.com/..."
          />
        </div>

        <Textarea
          label="Description"
          value={form.description ?? ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Add a brief description of this certificate..."
          rows={3}
        />

        {/* File upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Certificate File {!editingId && '*'}
          </label>
          {!file && !existingFile ? (
            <label
              className={classNames(
                'flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors',
                errors.file ? 'border-red-300 bg-red-50/30' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/30'
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <Upload size={24} className="text-slate-400" />
              </div>
              <p className="text-sm text-slate-600 font-medium">Click to upload your certificate</p>
              <p className="text-xs text-slate-400">PDF, JPG, or PNG (max 10MB)</p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  {isImage ? (
                    <ImageIcon size={22} className="text-blue-500" />
                  ) : (
                    <FileText size={22} className="text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{currentFileName}</p>
                  <p className="text-xs text-slate-400">
                    {file ? formatFileSize(file.size) : 'Existing file'}
                  </p>
                </div>
                {filePreview && (
                  <img src={filePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setFilePreview(null);
                    if (editingId) {
                      setExistingFile(null);
                      setExistingFileName(null);
                      setForm({ ...form, file_path: null, file_name: null, file_type: null, file_size: null });
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}
          {errors.file && <p className="mt-1 text-xs text-red-600">{errors.file}</p>}
          {editingId && existingFile && !file && (
            <p className="mt-2 text-xs text-slate-400">Upload a new file to replace the existing one, or leave as is.</p>
          )}
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {editingId ? 'Save Changes' : 'Add Certificate'}
          </Button>
          <Button type="button" variant="outline" onClick={onBack} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
