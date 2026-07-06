import React from 'react';
import { useDB } from '../context/DBContext';

export const DashboardView: React.FC = () => {
  const { user, inventory, notifications, orders, prescriptions, markNotificationAsRead, isLoading, settings } = useDB();

  // 1. Calculate Active Medications
  const activeMeds = inventory.filter(item => item.status === 'active' && item.quantity_remaining > 0);

  // 2. Calculate Low Stock Count
  const activeSettings = settings.find(s => s.profile_id === user?.id) || settings[0];
  const lowStockThreshold = activeSettings ? activeSettings.low_stock_threshold : 5;
  const lowStockMeds = activeMeds.filter(item => item.quantity_remaining <= lowStockThreshold);

  // 3. Calculate Expired Count
  const todayStr = new Date().toISOString().split('T')[0];
  const expiredMeds = inventory.filter(item => 
    item.status === 'expired' || 
    (item.status === 'active' && item.expiry_date && item.expiry_date < todayStr)
  );

  // 4. Calculate Total Spent This Month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
  // End of month ISO string
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();

  const spentThisMonth = orders
    .filter(o => o.order_date >= startOfMonth && o.order_date <= endOfMonth && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total_amount, 0);

  // Get active notifications (unread)
  const unreadNotifications = notifications.filter(n => !n.is_read);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <div className="welcome-banner md-card md-card--filled">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name} className="welcome-avatar" />
          ) : (
            <div className="welcome-avatar-placeholder">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
          )}
          <div>
            <h2 style={{ margin: 0 }}>Good Day, {user?.full_name?.split(' ')[0]}!</h2>
            <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '0.9rem' }}>
              Your medicine cabinet is synced and up to date.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="stats-grid">
        <div className="md-card md-card--elevated stat-card">
          <div className="stat-icon">💊</div>
          <span className="stat-num">{activeMeds.length}</span>
          <span className="stat-label">Active Medicines</span>
        </div>

        <div className={`md-card md-card--elevated stat-card ${lowStockMeds.length > 0 ? 'warning' : ''}`}>
          <div className="stat-icon">⚠️</div>
          <span className="stat-num">{lowStockMeds.length}</span>
          <span className="stat-label">Low Stock Items</span>
        </div>

        <div className={`md-card md-card--elevated stat-card ${expiredMeds.length > 0 ? 'critical' : ''}`}>
          <div className="stat-icon">⏰</div>
          <span className="stat-num">{expiredMeds.length}</span>
          <span className="stat-label">Expired Packages</span>
        </div>

        <div className="md-card md-card--elevated stat-card spend">
          <div className="stat-icon">₹</div>
          <span className="stat-num">₹{spentThisMonth.toFixed(0)}</span>
          <span className="stat-label">Spent This Month</span>
        </div>
      </div>

      {/* Two Column Layout: Notifications vs Dosing Schedules */}
      <div className="dashboard-cols grid-2 mt-4">
        {/* Active Alerts */}
        <div className="md-card md-card--outlined dashboard-col-card">
          <h3>Active Warnings & Alerts</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '16px' }}>
            Unread cabinet warnings that need attention.
          </p>

          <div className="alerts-list">
            {unreadNotifications.map(notif => (
              <div key={notif.id} className={`alert-item-card ${notif.type}`}>
                <div className="alert-content-row">
                  <div className="alert-text">
                    <strong>{notif.title}</strong>
                    <p>{notif.message}</p>
                  </div>
                  <button 
                    className="md-btn md-btn--text alert-action-btn"
                    onClick={() => handleMarkAsRead(notif.id)}
                    disabled={isLoading}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}

            {unreadNotifications.length === 0 && (
              <div className="empty-state text-center">
                <span>✅</span>
                <p style={{ marginTop: '8px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  All clear! No pending shelf alerts.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Dosing Schedules / Alarms */}
        <div className="md-card md-card--outlined dashboard-col-card">
          <h3>Active Dosing Schedule</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)', marginBottom: '16px' }}>
            Medication schedules extracted from your doctor prescriptions.
          </p>

          <div className="schedule-list">
            {prescriptions.map(presc => (
              <div key={presc.id} className="schedule-item-card">
                <div className="schedule-header">
                  <strong>🩺 {presc.doctor_name}</strong>
                  {presc.clinic_name && <span className="clinic-tag">{presc.clinic_name}</span>}
                </div>
                <p className="schedule-notes">{presc.notes}</p>
                <div className="schedule-meta">
                  <span>Prescribed: {new Date(presc.prescription_date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}

            {prescriptions.length === 0 && (
              <div className="empty-state text-center">
                <span>📋</span>
                <p style={{ marginTop: '8px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  No prescribed dosing schedules recorded yet.
                </p>
              </div>
            )}
          </div>
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
        }
        .welcome-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2px solid var(--md-sys-color-primary);
        }
        .welcome-avatar-placeholder {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background-color: var(--md-sys-color-primary-container);
          color: var(--md-sys-color-on-primary-container);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 12px;
        }
        .stat-card {
          display: flex;
          flex-direction: column;
          padding: 16px;
          position: relative;
          min-height: 110px;
          justify-content: space-between;
        }
        .stat-icon {
          position: absolute;
          top: 12px;
          right: 12px;
          font-size: 1.25rem;
          opacity: 0.7;
        }
        .stat-num {
          font-size: 1.85rem;
          font-weight: 700;
          color: var(--md-sys-color-primary);
          line-height: 1.2;
          margin-top: 12px;
        }
        .stat-label {
          font-size: 0.75rem;
          color: var(--md-sys-color-on-surface-variant);
          font-weight: 500;
          margin-top: 4px;
        }
        .stat-card.warning .stat-num {
          color: #e65100;
        }
        .stat-card.critical .stat-num {
          color: var(--md-sys-color-error);
        }
        .stat-card.spend .stat-num {
          color: #2e7d32;
        }
        .dashboard-col-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          min-height: 320px;
        }
        .dashboard-col-card h3 {
          margin: 0;
        }
        .alerts-list, .schedule-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }
        .alert-item-card {
          border-radius: var(--md-shape-corner-s);
          padding: 12px;
          border-left: 4px solid var(--md-sys-color-outline);
        }
        .alert-item-card.expiry_warning {
          background-color: var(--md-sys-color-error-container);
          color: var(--md-sys-color-on-error-container);
          border-left-color: var(--md-sys-color-error);
        }
        .alert-item-card.low_stock {
          background-color: #fff3e0;
          color: #e65100;
          border-left-color: #f57c00;
        }
        .alert-content-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .alert-text {
          flex: 1;
        }
        .alert-text strong {
          font-size: 0.85rem;
          display: block;
        }
        .alert-text p {
          font-size: 0.75rem;
          margin: 4px 0 0 0;
          line-height: 1.3;
        }
        .alert-action-btn {
          height: 28px;
          padding: 0 8px;
          font-size: 0.75rem;
        }
        .schedule-item-card {
          background-color: var(--md-sys-color-surface-variant);
          padding: 12px;
          border-radius: var(--md-shape-corner-s);
          border: 1px solid var(--md-sys-color-outline-variant);
        }
        .schedule-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
        }
        .clinic-tag {
          font-size: 0.7rem;
          background-color: var(--md-sys-color-secondary-container);
          color: var(--md-sys-color-on-secondary-container);
          padding: 2px 6px;
          border-radius: var(--md-shape-corner-full);
        }
        .schedule-notes {
          font-size: 0.8rem;
          margin: 6px 0;
          line-height: 1.4;
        }
        .schedule-meta {
          font-size: 0.7rem;
          color: var(--md-sys-color-on-surface-variant);
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          color: var(--md-sys-color-on-surface-variant);
          padding: 32px 0;
        }
        .empty-state span {
          font-size: 2rem;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
};
