import React, { useState } from 'react';
import { useDB } from '../context/DBContext';

export const InventoryView: React.FC = () => {
  const { user, inventory, medicines, consumeDose, settings, isLoading } = useDB();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'expired' | 'consumed'>('active');
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const [doseAmounts, setDoseAmounts] = useState<Record<string, number>>({});

  // Fetch active settings config
  const activeSettings = settings.find(s => s.profile_id === user?.id) || settings[0];
  const warningDays = activeSettings ? activeSettings.expiry_warning_days : 30;
  const lowStockThreshold = activeSettings ? activeSettings.low_stock_threshold : 5;

  const todayStr = new Date().toISOString().split('T')[0];

  // Expiry styling utility
  const getExpiryStatus = (itemStatus: string, expiryDate?: string | null) => {
    if (itemStatus === 'expired') {
      return { label: 'Expired', class: 'critical-expire', color: '#ba1a1a' };
    }
    if (!expiryDate) {
      return { label: 'No Expiry Date', class: 'safe-expire', color: '#2e7d32' };
    }
    if (expiryDate < todayStr) {
      return { label: `Expired (${expiryDate})`, class: 'critical-expire', color: '#ba1a1a' };
    }

    const expiryTime = new Date(expiryDate).getTime();
    const todayTime = new Date(todayStr).getTime();
    const diffDays = Math.ceil((expiryTime - todayTime) / (1000 * 60 * 60 * 24));

    if (diffDays <= warningDays) {
      return { label: `Expiring soon: ${diffDays} days left`, class: 'warning-expire', color: '#e65100' };
    }

    return { label: `Safe: Expires ${expiryDate}`, class: 'safe-expire', color: '#2e7d32' };
  };

  // Filter items
  const filteredInventory = inventory.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return item.status === 'active' && item.quantity_remaining > 0;
    if (activeTab === 'expired') return item.status === 'expired' || (item.status === 'active' && item.expiry_date && item.expiry_date < todayStr);
    if (activeTab === 'consumed') return item.status === 'consumed' || item.quantity_remaining === 0;
    return true;
  });

  const handleDoseChange = (id: string, val: number) => {
    setDoseAmounts({
      ...doseAmounts,
      [id]: val
    });
  };

  const handleTakeDose = async (id: string, currentStock: number, medName: string) => {
    setLocalError(null);
    setLocalSuccess(null);

    const amount = doseAmounts[id] || 1;

    if (amount <= 0) {
      setLocalError('Please specify a positive dose count.');
      return;
    }

    if (amount > currentStock) {
      setLocalError(`Insufficient quantity. Only ${currentStock} units remaining in stock.`);
      return;
    }

    try {
      await consumeDose(id, amount);
      setLocalSuccess(`Logged dose: took ${amount} unit(s) of ${medName}.`);
      // Reset input amount
      setDoseAmounts({
        ...doseAmounts,
        [id]: 1
      });
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to record medication dose.');
    }
  };

  return (
    <div className="inventory-view-container">
      {/* ALERTS */}
      {localSuccess && (
        <div className="md-alert md-alert--success">
          <span>{localSuccess}</span>
        </div>
      )}
      {localError && (
        <div className="md-alert md-alert--error">
          <span>{localError}</span>
        </div>
      )}

      <div className="section-header-row">
        <div>
          <h2 style={{ margin: 0 }}>Cabinet Stock</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
            Track medicine packages, take required doses, and manage safety conditions.
          </p>
        </div>
      </div>

      {/* Filter Chips/Tabs */}
      <div className="filter-chips-bar">
        <button 
          className={`md-btn ${activeTab === 'active' ? 'md-btn--tonal' : 'md-btn--text'}`}
          onClick={() => setActiveTab('active')}
        >
          🟢 Active Stock
        </button>
        <button 
          className={`md-btn ${activeTab === 'expired' ? 'md-btn--tonal' : 'md-btn--text'}`}
          onClick={() => setActiveTab('expired')}
        >
          🔴 Expired
        </button>
        <button 
          className={`md-btn ${activeTab === 'consumed' ? 'md-btn--tonal' : 'md-btn--text'}`}
          onClick={() => setActiveTab('consumed')}
        >
          ⚪ Consumed
        </button>
        <button 
          className={`md-btn ${activeTab === 'all' ? 'md-btn--tonal' : 'md-btn--text'}`}
          onClick={() => setActiveTab('all')}
        >
          📦 Show All
        </button>
      </div>

      {/* Inventory Grid */}
      <div className="inventory-grid">
        {filteredInventory.map(item => {
          const med = medicines.find(m => m.id === item.medicine_id);
          const exp = getExpiryStatus(item.status, item.expiry_date);
          const isLowStock = item.status === 'active' && item.quantity_remaining <= lowStockThreshold && item.quantity_remaining > 0;
          const currentDoseAmount = doseAmounts[item.id] || 1;

          return (
            <div key={item.id} className={`md-card md-card--outlined inventory-card ${item.status}`}>
              <div className="card-header-row">
                <div>
                  <h4 style={{ margin: 0 }}>{med?.brand || 'Generic Medicine'}</h4>
                  <span className="generic-subtitle">{med?.name} - {med?.strength}</span>
                </div>
                {item.location && <span className="location-tag">📍 {item.location}</span>}
              </div>

              {/* Expiry Color Banner */}
              <div className={`expiry-badge ${exp.class} mt-2`}>
                <span className="badge-dot" style={{ backgroundColor: exp.color }}></span>
                {exp.label}
              </div>

              {/* Low Stock Indicator */}
              {isLowStock && (
                <div className="low-stock-alert mt-1">
                  ⚠️ Low Stock! Only {item.quantity_remaining} left.
                </div>
              )}

              {/* Stock Details */}
              <div className="stock-info mt-2">
                <div className="info-row">
                  <span>Current Quantity:</span>
                  <strong>{item.quantity_remaining} / {item.quantity_original} units</strong>
                </div>
                {item.batch_number && (
                  <div className="info-row">
                    <span>Batch Reference:</span>
                    <span>{item.batch_number}</span>
                  </div>
                )}
                <div className="info-row">
                  <span>Usage Status:</span>
                  <span className="status-label-text">{item.status}</span>
                </div>
              </div>

              {/* Dose Log Controller */}
              {item.status === 'active' && item.quantity_remaining > 0 && (
                <div className="dose-action-row mt-4">
                  <div className="dose-input-group">
                    <label>Qty:</label>
                    <input
                      type="number"
                      value={currentDoseAmount}
                      onChange={(e) => handleDoseChange(item.id, Math.max(1, Number(e.target.value)))}
                      disabled={isLoading}
                      min="1"
                      className="md-field"
                      style={{ width: '60px', height: '36px', padding: '0 8px', textAlign: 'center' }}
                    />
                  </div>
                  <button
                    className="md-btn md-btn--filled dose-btn"
                    style={{ height: '36px', flex: 1 }}
                    onClick={() => handleTakeDose(item.id, item.quantity_remaining, med?.brand || 'medicine')}
                    disabled={isLoading}
                  >
                    Take Dose
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredInventory.length === 0 && (
          <div className="empty-inventory md-card md-card--filled text-center mt-2" style={{ gridColumn: '1 / -1', padding: '40px' }}>
            <span>📦</span>
            <p style={{ marginTop: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
              No medications matching this selection in the cabinet inventory.
            </p>
          </div>
        )}
      </div>

      <style>{`
        .inventory-view-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .filter-chips-bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }
        .filter-chips-bar .md-btn {
          height: 36px;
          padding: 0 16px;
          font-size: 0.8rem;
        }
        .inventory-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .inventory-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-width: 1px;
        }
        .inventory-card.expired {
          border-color: var(--md-sys-color-error-container);
          background-color: color-mix(in srgb, var(--md-sys-color-error-container) 10%, transparent);
        }
        .inventory-card.consumed {
          opacity: 0.7;
          border-style: dashed;
        }
        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        .generic-subtitle {
          font-size: 0.8rem;
          color: var(--md-sys-color-on-surface-variant);
          font-style: italic;
          display: block;
          margin-top: 2px;
        }
        .location-tag {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--md-sys-color-primary);
          background-color: var(--md-sys-color-primary-container);
          padding: 2px 6px;
          border-radius: var(--md-shape-corner-full);
          white-space: nowrap;
        }
        .expiry-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: var(--md-shape-corner-s);
          align-self: flex-start;
        }
        .expiry-badge.safe-expire {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        .expiry-badge.warning-expire {
          background-color: #fff3e0;
          color: #e65100;
        }
        .expiry-badge.critical-expire {
          background-color: var(--md-sys-color-error-container);
          color: var(--md-sys-color-on-error-container);
        }
        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .low-stock-alert {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--md-sys-color-error);
          background-color: var(--md-sys-color-error-container);
          padding: 4px 8px;
          border-radius: var(--md-shape-corner-s);
          align-self: flex-start;
        }
        .stock-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.8rem;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          color: var(--md-sys-color-on-surface-variant);
        }
        .info-row strong {
          color: var(--md-sys-color-on-surface);
        }
        .status-label-text {
          text-transform: capitalize;
          font-weight: 500;
        }
        .dose-action-row {
          display: flex;
          align-items: center;
          gap: 8px;
          border-top: 1px solid var(--md-sys-color-outline-variant);
          padding-top: 12px;
        }
        .dose-input-group {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }
        .dose-btn {
          font-size: 0.8rem;
          padding: 0 12px;
        }
        .empty-inventory {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .empty-inventory span {
          font-size: 2.5rem;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
};
