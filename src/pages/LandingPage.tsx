import { useState } from 'react';
import { Shield, ArrowRight, Lock, FolderTree, Download, Eye, Search, Info } from 'lucide-react';
import AboutModal from '@/components/AboutModal';

export default function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">CertiVault</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onGetStarted}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2"
            >
              Login
            </button>
            <button
              onClick={onGetStarted}
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-white"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-200/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium mb-6">
            <Shield size={14} />
            Secure Certificate Management
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
            Store, Manage and Access Your{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Certificates
            </span>{' '}
            Anywhere
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            CertiVault is your personal certification manager. Upload, organize, and access
            all your certificates in one secure place — with built-in preview, download, and verification.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium px-6 py-3 rounded-lg text-base hover:bg-blue-700 transition-colors shadow-sm"
            >
              Get Started Free
              <ArrowRight size={18} />
            </button>
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 bg-white text-slate-700 font-medium px-6 py-3 rounded-lg text-base hover:bg-slate-50 transition-colors border border-slate-200"
            >
              Login to Your Account
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-900">Everything you need to manage certificates</h2>
          <p className="mt-3 text-slate-600">A complete toolkit for storing and organizing your credentials.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Lock, title: 'Secure Storage', desc: 'Upload PDFs and images with bank-grade security. Only you can access your files.' },
            { icon: FolderTree, title: 'Smart Organization', desc: 'Categorize, search, and filter your certificates by name, organization, or category.' },
            { icon: Eye, title: 'Instant Preview', desc: 'View your certificates directly in the browser before downloading them.' },
            { icon: Download, title: 'One-Click Download', desc: 'Download any certificate in its original format with a single click.' },
            { icon: Search, title: 'Powerful Search', desc: 'Find any certificate instantly with smart search and sorting capabilities.' },
            { icon: Shield, title: 'Verify Credentials', desc: 'Link to external credential URLs for instant verification of your certificates.' },
          ].map((feat) => (
            <div
              key={feat.title}
              className="group p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 bg-white"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <feat.icon size={24} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
        <div className="relative rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 px-8 py-14 lg:px-16 lg:py-20 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-300/10 rounded-full blur-3xl"></div>
          <div className="relative">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to organize your certificates?</h2>
            <p className="text-blue-100 mb-8 max-w-xl mx-auto">
              Join CertiVault today and keep all your professional credentials in one secure, accessible place.
            </p>
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-lg text-base hover:bg-blue-50 transition-colors shadow-lg"
            >
              Create Your Free Account
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <span>© 2026 CertiVault. Store, Manage and Access Your Certificates Anywhere.</span>
          <button
            onClick={() => setAboutOpen(true)}
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors font-medium"
          >
            <Info size={14} />
            About / Credits
          </button>
        </div>
      </footer>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
