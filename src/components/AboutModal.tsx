import { Shield, Code2, X, Award, Lock, Eye, Download, Search, GraduationCap, User as UserIcon, Sparkles } from 'lucide-react';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  if (!open) return null;

  const features = [
    { icon: Lock, label: 'Secure Storage' },
    { icon: Eye, label: 'Instant Preview' },
    { icon: Download, label: 'One-Click Download' },
    { icon: Search, label: 'Smart Search' },
    { icon: Award, label: 'Category Management' },
    { icon: Shield, label: 'Private & Protected' },
  ];

  const techStack = ['React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Vite'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in-up max-h-[90vh] overflow-y-auto">
        {/* Header banner */}
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 px-8 pt-10 pb-8 text-center text-white">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-300/10 rounded-full blur-2xl translate-y-8 -translate-x-8"></div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={18} className="text-white" />
          </button>

          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mx-auto mb-4">
              <Shield size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">CertiVault</h2>
            <p className="text-blue-100 text-sm mt-1">Personal Certification Manager</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed text-center mb-6">
            CertiVault is a personal certification management platform designed to help users
            securely store, organize, view, and download their certificates.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {features.map((feat) => (
              <div
                key={feat.label}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-50 text-center"
              >
                <feat.icon size={20} className="text-blue-600" />
                <span className="text-xs font-medium text-slate-600 leading-tight">{feat.label}</span>
              </div>
            ))}
          </div>

          {/* Developer section */}
          <div className="rounded-xl border border-slate-200 overflow-hidden mb-6">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <div className="inline-flex items-center gap-2 text-slate-500">
                <Code2 size={16} />
                <span className="text-xs font-semibold uppercase tracking-wide">Developer</span>
              </div>
            </div>
            <div className="px-5 py-5 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-3">
                <UserIcon size={28} className="text-white" />
              </div>
              <p className="text-lg font-bold text-slate-900">Kadali Bhargavi</p>
              <div className="inline-flex items-center gap-1.5 mt-2 text-sm text-slate-500">
                <GraduationCap size={15} className="text-blue-600" />
                B.Tech – Computer Science and Engineering
              </div>
              <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                <Sparkles size={12} />
                Creator &amp; Developer of CertiVault
              </div>
            </div>
          </div>

          {/* Tech stack */}
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2 text-center">
              Built With
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 pt-5 text-center">
            <span className="text-xs text-slate-400">
              © 2026 CertiVault. Created &amp; Developed by Kadali Bhargavi.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
