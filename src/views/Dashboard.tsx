import React from 'react';
import { useDB } from '../context/DBContext';

export const DashboardView: React.FC = () => {
  const { user, inventory, notifications } = useDB();

  const activeMeds = inventory.filter(item => item.status === 'active');
  const lowStockMeds = inventory.filter(item => item.quantity_remaining <= 5 && item.status === 'active');

  return (
    <div className="dashboard-container">
      <div className="welcome-banner md-card md-card--filled">
        <h2>Hello, {user?.full_name || 'User'}!</h2>
        <p>Welcome to MedTrack. Here is your family health cabinet status at a glance.</p>
      </div>

      <div className="grid-2">
        <div className="md-card md-card--elevated stat-card">
          <span className="stat-num">{activeMeds.length}</span>
          <span className="stat-label">Active Medicines</span>
        </div>

        <div className="md-card md-card--elevated stat-card warning">
          <span className="stat-num">{lowStockMeds.length}</span>
          <span className="stat-label">Running Low</span>
        </div>
      </div>

      <div className="md-card md-card--outlined mt-4">
        <h3>Recent Alerts</h3>
        <div className="alerts-list">
          {notifications.slice(0, 3).map(notif => (
            <div key={notif.id} className={`alert-item ${notif.type}`}>
              <strong>{notif.title}</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>{notif.message}</p>
            </div>
          ))}
          {notifications.length === 0 && (
            <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>No active warning alerts.</p>
          )}
        </div>
      </div>

      <style>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .welcome-banner {
          padding: 24px;
          border-radius: var(--md-shape-corner-m);
        }
        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          text-align: center;
        }
        .stat-num {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--md-sys-color-primary);
        }
        .stat-card.warning .stat-num {
          color: var(--md-sys-color-error);
        }
        .stat-label {
          font-size: 0.875rem;
          color: var(--md-sys-color-on-surface-variant);
          margin-top: 8px;
        }
        .alert-item {
          padding: 12px;
          border-radius: var(--md-shape-corner-s);
          margin-bottom: 8px;
          border-left: 4px solid var(--md-sys-color-outline);
          background-color: var(--md-sys-color-surface);
        }
        .alert-item.expiry_warning {
          border-left-color: var(--md-sys-color-error);
          background-color: var(--md-sys-color-error-container);
        }
        .alert-item.low_stock {
          border-left-color: #f57c00;
          background-color: #fff3e0;
        }
      `}</style>
    </div>
  );
};
