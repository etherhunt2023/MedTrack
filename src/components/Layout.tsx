import React, { useEffect, useState } from 'react';
import { useDB } from '../context/DBContext';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  const { user, signOut, notifications, settings, updateSettings } = useDB();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load initial theme from settings or preferences
  useEffect(() => {
    const activeSetting = settings.find(s => s.profile_id === user?.id) || settings[0];
    const initialTheme = activeSetting?.theme === 'dark' ? 'dark' : 'light';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, [settings, user?.id]);

  const handleThemeToggle = async () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    
    // Save to settings db
    try {
      const activeSetting = settings.find(s => s.profile_id === user?.id) || settings[0];
      if (activeSetting) {
        await updateSettings({ theme: nextTheme });
      }
    } catch (e) {
      console.error('Failed to save theme setting:', e);
    }
  };

  const unreadNotifCount = notifications.filter(n => !n.is_read).length;

  // Custom inline SVG icons for crisp presentation
  const iconHome = (
    <svg className="md-bottom-nav__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  );

  const iconOrders = (
    <svg className="md-bottom-nav__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" width="20" height="24" rx="2" stroke="currentColor" fill="none" />
      <path d="M6 6h12M6 10h12M6 14h8M6 18h12" stroke="currentColor" />
    </svg>
  );

  const iconInventory = (
    <svg className="md-bottom-nav__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  );

  const iconAnalytics = (
    <svg className="md-bottom-nav__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  );

  const iconSettings = (
    <svg className="md-bottom-nav__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  );

  const iconOCR = (
    <svg className="md-bottom-nav__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  );

  const iconAI = (
    <svg className="md-bottom-nav__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 0 1 7.54 16.59c-.44.54-.73 1.22-.73 1.91V21a1 1 0 0 1-1 1H6.19a1 1 0 0 1-1-1v-.5c0-.69-.29-1.37-.73-1.91A10 10 0 0 1 12 2z"></path>
      <line x1="9" y1="10" x2="15" y2="10"></line>
    </svg>
  );

  const navItems = [
    { view: 'dashboard', label: 'Dashboard', icon: iconHome },
    { view: 'orders', label: 'Orders', icon: iconOrders },
    { view: 'ocr-scan', label: 'Scan Invoice', icon: iconOCR },
    { view: 'inventory', label: 'Inventory', icon: iconInventory },
    { view: 'ai-insights', label: 'AI Insights', icon: iconAI },
    { view: 'analytics', label: 'Analytics', icon: iconAnalytics },
    { view: 'settings', label: 'Settings', icon: iconSettings }
  ];

  return (
    <div className="layout-wrapper">
      {/* App Header */}
      <header className="layout-header">
        <div className="layout-header__brand" style={{ cursor: 'pointer' }} onClick={() => onViewChange('dashboard')}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span style={{ letterSpacing: '0.5px' }}>MedTrack</span>
        </div>

        <div className="layout-header__actions">
          {/* Theme Toggle */}
          <button className="md-btn md-btn--text" style={{ padding: '0 8px', minWidth: '40px', width: '40px', borderRadius: '50%' }} onClick={handleThemeToggle} title="Toggle theme">
            {theme === 'light' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>

          {/* Notifications Alert Indicator */}
          <button className="md-btn md-btn--text" style={{ padding: '0 8px', minWidth: '40px', width: '40px', borderRadius: '50%', position: 'relative' }} onClick={() => onViewChange('settings')} title="View Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadNotifCount > 0 && (
              <span className="md-badge">{unreadNotifCount}</span>
            )}
          </button>

          {/* User Profile Access */}
          {user && (
            <>
              <button 
                className={`md-btn ${currentView === 'profile' ? 'md-btn--tonal' : 'md-btn--text'}`}
                style={{ padding: '0 12px', gap: '6px' }}
                onClick={() => onViewChange('profile')}
              >
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.full_name} 
                    style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }} className="desktop-only">{user.full_name.split(' ')[0]}</span>
              </button>

              <button className="md-btn md-btn--outlined" style={{ padding: '0 12px', height: '36px' }} onClick={() => signOut()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                <span className="desktop-only" style={{ marginLeft: '4px' }}>Sign Out</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Navigation for both mobile and desktop */}
      <nav className="md-bottom-nav">
        {navItems.map(item => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              className={`md-bottom-nav__item ${isActive ? 'md-bottom-nav__item--active' : ''}`}
              onClick={() => onViewChange(item.view)}
            >
              <div className="md-bottom-nav__icon-wrapper">
                {item.icon}
              </div>
              <span className="md-bottom-nav__label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Viewport Content Area */}
      <main className="layout-main">
        {children}
      </main>

      <style>{`
        .desktop-only {
          display: none;
        }
        @media (min-width: 600px) {
          .desktop-only {
            display: inline-block;
          }
        }
      `}</style>
    </div>
  );
};
