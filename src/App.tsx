import { useState } from 'react';
import { useDB } from './context/DBContext';
import { Layout } from './components/Layout';
import { Auth } from './views/Auth';
import { DashboardView } from './views/Dashboard';
import { OrdersView } from './views/Orders';
import { InventoryView } from './views/Inventory';
import { AnalyticsView } from './views/Analytics';
import { SettingsView } from './views/Settings';
import { ProfileView } from './views/Profile';

function App() {
  const { user, isLoading } = useDB();
  const [currentView, setCurrentView] = useState('dashboard');

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '16px',
        backgroundColor: 'var(--md-sys-color-background)',
        color: 'var(--md-sys-color-on-background)'
      }}>
        <div className="spinner" style={{
          width: '32px',
          height: '32px',
          borderWidth: '3px',
          borderStyle: 'solid',
          borderColor: 'color-mix(in srgb, var(--md-sys-color-primary) 30%, transparent)',
          borderRadius: '50%',
          borderTopColor: 'var(--md-sys-color-primary)',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>Loading cabinet state...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'orders':
        return <OrdersView />;
      case 'inventory':
        return <InventoryView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

export default App;
