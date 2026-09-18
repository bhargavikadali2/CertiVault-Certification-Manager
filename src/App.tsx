import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthPage from '@/pages/AuthPage';
import LandingPage from '@/pages/LandingPage';
import AppLayout, { Page } from '@/components/AppLayout';
import Dashboard from '@/pages/Dashboard';
import CertificatesPage from '@/pages/CertificatesPage';
import CertificateForm from '@/pages/CertificateForm';
import CertificateDetails from '@/pages/CertificateDetails';
import ProfilePage from '@/pages/ProfilePage';
import { FullPageLoader } from '@/components/ui';

type View =
  | { name: 'landing' }
  | { name: 'auth' }
  | { name: 'dashboard' }
  | { name: 'certificates' }
  | { name: 'add' }
  | { name: 'edit'; id: string }
  | { name: 'details'; id: string }
  | { name: 'profile' };

export default function App() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<View>({ name: 'landing' });

  if (loading) {
    return <FullPageLoader message="Loading CertiVault..." />;
  }

  // Not authenticated
  if (!user) {
    if (view.name === 'auth') {
      return <AuthPage />;
    }
    return <LandingPage onGetStarted={() => setView({ name: 'auth' })} />;
  }

  // Authenticated - determine current page and content
  const currentPage: Page = (() => {
    switch (view.name) {
      case 'dashboard': return 'dashboard';
      case 'certificates': return 'certificates';
      case 'add': return 'add';
      case 'edit': return 'add';
      case 'details': return 'certificates';
      case 'profile': return 'profile';
      default: return 'dashboard';
    }
  })();

  const handleNavigate = (page: Page) => {
    switch (page) {
      case 'dashboard': setView({ name: 'dashboard' }); break;
      case 'certificates': setView({ name: 'certificates' }); break;
      case 'add': setView({ name: 'add' }); break;
      case 'profile': setView({ name: 'profile' }); break;
    }
  };

  let content;
  switch (view.name) {
    case 'dashboard':
      content = <Dashboard onNavigate={handleNavigate} />;
      break;
    case 'certificates':
      content = (
        <CertificatesPage
          onNavigate={handleNavigate}
          onView={(id) => setView({ name: 'details', id })}
          onEdit={(id) => setView({ name: 'edit', id })}
        />
      );
      break;
    case 'add':
      content = (
        <CertificateForm
          onDone={() => setView({ name: 'certificates' })}
          onBack={() => setView({ name: 'certificates' })}
        />
      );
      break;
    case 'edit':
      content = (
        <CertificateForm
          editingId={view.id}
          onDone={() => setView({ name: 'details', id: view.id })}
          onBack={() => setView({ name: 'details', id: view.id })}
        />
      );
      break;
    case 'details':
      content = (
        <CertificateDetails
          certId={view.id}
          onBack={() => setView({ name: 'certificates' })}
          onEdit={(id) => setView({ name: 'edit', id })}
        />
      );
      break;
    case 'profile':
      content = <ProfilePage />;
      break;
    default:
      content = <Dashboard onNavigate={handleNavigate} />;
  }

  return (
    <AppLayout current={currentPage} onNavigate={handleNavigate}>
      {content}
    </AppLayout>
  );
}
