import { ReactNode, useState } from 'react';
import { LayoutDashboard, Award, PlusCircle, User, LogOut, Shield, Menu, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { initials } from '@/lib/utils';
import AboutModal from '@/components/AboutModal';

export type Page = 'dashboard' | 'certificates' | 'add' | 'profile';

interface LayoutProps {
  current: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

export default function AppLayout({ current, onNavigate, children }: LayoutProps) {
  const { profile, user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const navItems: { key: Page; label: string; icon: typeof LayoutDashboard }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'certificates', label: 'My Certificates', icon: Award },
    { key: 'add', label: 'Add Certificate', icon: PlusCircle },
    { key: 'profile', label: 'Profile', icon: User },
  ];

  const handleNav = (page: Page) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-30">
        <SidebarContent
          current={current}
          navItems={navItems}
          onNav={handleNav}
          onSignOut={handleSignOut}
          profileName={profile?.full_name ?? user?.email ?? ''}
          profileAvatar={profile?.avatar_url ?? null}
          userEmail={user?.email ?? ''}
          onAbout={() => setAboutOpen(true)}
        />
      </aside>

      {/* Sidebar - mobile drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col animate-slide-in">
            <SidebarContent
              current={current}
              navItems={navItems}
              onNav={handleNav}
              onSignOut={handleSignOut}
              profileName={profile?.full_name ?? user?.email ?? ''}
              profileAvatar={profile?.avatar_url ?? null}
              userEmail={user?.email ?? ''}
              onAbout={() => setAboutOpen(true)}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-900">CertiVault</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 -mr-2 text-slate-600 hover:text-slate-900">
            <Menu size={22} />
          </button>
        </header>

        <main className="flex-1">{children}</main>
      </div>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}

function SidebarContent({
  current,
  navItems,
  onNav,
  onSignOut,
  profileName,
  profileAvatar,
  userEmail,
  onAbout,
}: {
  current: Page;
  navItems: { key: Page; label: string; icon: typeof LayoutDashboard }[];
  onNav: (page: Page) => void;
  onSignOut: () => void;
  profileName: string;
  profileAvatar: string | null;
  userEmail: string;
  onAbout: () => void;
}) {
  return (
    <>
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-100">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0">
          <Shield size={20} className="text-white" />
        </div>
        <span className="text-lg font-bold text-slate-900">CertiVault</span>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = current === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNav(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={20} className={active ? 'text-blue-600' : 'text-slate-400'} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <button
          onClick={onNav.bind(null, 'profile')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left mb-1"
        >
          {profileAvatar ? (
            <img src={profileAvatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {initials(profileName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900 truncate">{profileName || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
          </div>
        </button>
        <button
          onClick={onAbout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors mb-1"
        >
          <Info size={18} className="text-slate-400" />
          About / Credits
        </button>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut size={20} className="text-slate-400" />
          Logout
        </button>
      </div>
    </>
  );
}
