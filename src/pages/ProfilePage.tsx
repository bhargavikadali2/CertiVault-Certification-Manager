import { useState, useRef, useEffect, FormEvent } from 'react';
import { User as UserIcon, Mail, Award, Camera, Save, Loader2, X } from 'lucide-react';
import { supabase, Certificate } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatDate, initials } from '@/lib/utils';
import { Button, Input, LoadingSpinner } from '@/components/ui';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(true);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('certificates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCertificates((data as Certificate[]) ?? []);
        setLoadingCerts(false);
      });
  }, [user]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Profile updated successfully!', 'success');
      await refreshProfile();
    }
    setSaving(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file.', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be under 2MB.', 'error');
      return;
    }

    setUploadingPhoto(true);

    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${ext}`;

    // Upload to certificates bucket (reusing for avatars under same user folder)
    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      showToast(uploadError.message, 'error');
      setUploadingPhoto(false);
      return;
    }

    // Get public URL — bucket is private, use signed URL for display
    const { data: urlData } = await supabase.storage
      .from('certificates')
      .createSignedUrl(filePath, 31536000);

    const avatarUrl = urlData?.signedUrl ?? null;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      showToast(updateError.message, 'error');
    } else {
      showToast('Profile photo updated!', 'success');
      await refreshProfile();
    }
    setUploadingPhoto(false);
  };

  if (!user) return null;

  const memberSince = formatDate(profile?.created_at ?? user.created_at);

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Profile</h1>
      <p className="text-slate-500 text-sm mb-8">Manage your account information.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
            {/* Avatar */}
            <div className="relative inline-block mb-4">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md">
                  {initials(profile?.full_name ?? user.email)}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors disabled:opacity-50"
              >
                {uploadingPhoto ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <h2 className="font-semibold text-slate-900 text-lg">
              {profile?.full_name || 'Unnamed User'}
            </h2>
            <p className="text-sm text-slate-500">{user.email}</p>

            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-slate-400" />
                <span className="text-slate-600 truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Award size={16} className="text-slate-400" />
                <span className="text-slate-600">
                  {loadingCerts ? '...' : certificates.length} certificates
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <UserIcon size={16} className="text-slate-400" />
                <span className="text-slate-600">Member since {memberSince}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Edit Profile</h3>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <Input
                  value={user.email ?? ''}
                  disabled
                  className="bg-slate-50 text-slate-400"
                />
                <p className="mt-1 text-xs text-slate-400">Email cannot be changed.</p>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Stats card */}
          {!loadingCerts && certificates.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Certificate Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-blue-50">
                  <p className="text-2xl font-bold text-blue-700">{certificates.length}</p>
                  <p className="text-xs text-blue-600 mt-1">Total</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-emerald-50">
                  <p className="text-2xl font-bold text-emerald-700">
                    {new Set(certificates.map((c) => c.category)).size}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">Categories</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-50">
                  <p className="text-2xl font-bold text-purple-700">
                    {certificates.filter((c) => c.credential_url).length}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Verifiable</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
