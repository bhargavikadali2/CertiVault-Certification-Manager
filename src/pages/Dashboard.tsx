import { useState, useEffect, useCallback } from 'react';
import { Award, PlusCircle, FolderTree, TrendingUp, Clock, ArrowRight, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase, Certificate, CATEGORIES } from '@/lib/supabase';
import { formatDate, isImageFile, isPdfFile, getFileExtension, initials } from '@/lib/utils';
import { LoadingSpinner, Button, CategoryBadge, EmptyState } from '@/components/ui';
import { Page } from '@/components/AppLayout';

export default function Dashboard({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const { user, profile } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

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

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = certificates.filter((c) => c.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  const recentCerts = certificates.slice(0, 5);

  const stats = [
    {
      label: 'Total Certificates',
      value: certificates.length,
      icon: Award,
      color: 'blue',
    },
    {
      label: 'Categories Used',
      value: Object.values(categoryCounts).filter((c) => c > 0).length,
      icon: FolderTree,
      color: 'emerald',
    },
    {
      label: 'This Month',
      value: certificates.filter((c) => {
        const d = new Date(c.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length,
      icon: TrendingUp,
      color: 'purple',
    },
  ];

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size={32} className="text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Here's an overview of your certificates.</p>
        </div>
        <Button onClick={() => onNavigate('add')}>
          <PlusCircle size={18} />
          Add Certificate
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[stat.color]}`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent certificates */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-slate-400" />
              <h2 className="font-semibold text-slate-900">Recent Certificates</h2>
            </div>
            {certificates.length > 0 && (
              <button
                onClick={() => onNavigate('certificates')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View all <ArrowRight size={14} />
              </button>
            )}
          </div>
          {recentCerts.length === 0 ? (
            <EmptyState
              icon={<Award size={28} />}
              title="No certificates yet"
              description="Upload your first certificate to get started."
              action={<Button onClick={() => onNavigate('add')}><PlusCircle size={16} />Add Certificate</Button>}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {recentCerts.map((cert) => (
                <button
                  key={cert.id}
                  onClick={() => onNavigate('certificates')}
                  className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {isImageFile(cert.file_type, cert.file_name) ? (
                      <span className="text-xs font-bold text-slate-500">IMG</span>
                    ) : isPdfFile(cert.file_type, cert.file_name) ? (
                      <span className="text-xs font-bold text-red-500">PDF</span>
                    ) : (
                      <Award size={20} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{cert.certificate_name}</p>
                    <p className="text-xs text-slate-500 truncate">{cert.issuing_organization}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                    <CategoryBadge category={cert.category} />
                    <span className="text-xs text-slate-400">{formatDate(cert.issue_date)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FolderTree size={20} className="text-slate-400" />
              <h2 className="font-semibold text-slate-900">By Category</h2>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat] ?? 0;
              const pct = certificates.length > 0 ? (count / certificates.length) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">{cat}</span>
                    <span className="text-slate-400 font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick search */}
      {certificates.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Search size={20} className="text-slate-400" />
            <h2 className="font-semibold text-slate-900">Quick Search</h2>
          </div>
          <p className="text-sm text-slate-500 mb-3">Find certificates by name, organization, or category.</p>
          <Button variant="outline" onClick={() => onNavigate('certificates')}>
            Go to My Certificates <ArrowRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
