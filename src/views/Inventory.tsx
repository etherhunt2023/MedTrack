import React from 'react';
import { useDB } from '../context/DBContext';

export const InventoryView: React.FC = () => {
  const { inventory, medicines } = useDB();

  return (
    <div className="inventory-container">
      <div className="section-header md-card md-card--filled">
        <h2>Cabinet Inventory</h2>
        <p>Browse current medicine shelf quantities, batch codes, and shelf lives.</p>
      </div>

      <div className="inventory-grid">
        {inventory.map(item => {
          const med = medicines.find(m => m.id === item.medicine_id);
          return (
            <div key={item.id} className="md-card md-card--elevated inventory-card">
              <h4>{med?.name || 'Unknown Medicine'}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-primary)', margin: '2px 0 8px' }}>
                {med?.brand} - {med?.strength}
              </p>
              <div className="inv-stats">
                <div className="qty-row">
                  <span>Stock:</span>
                  <strong className={item.quantity_remaining <= 5 ? 'low-stock' : ''}>
                    {item.quantity_remaining} units
                  </strong>
                </div>
                {item.expiry_date && (
                  <div className="expiry-row">
                    <span>Expires:</span>
                    <span className={item.status === 'expired' ? 'expired' : ''}>
                      {item.expiry_date}
                    </span>
                  </div>
                )}
                {item.location && (
                  <div className="loc-row">
                    <span>Location:</span>
                    <span>{item.location}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {inventory.length === 0 && (
          <p className="text-center" style={{ padding: '24px', color: 'var(--md-sys-color-on-surface-variant)' }}>
            No medicine packages present in active stock.
          </p>
        )}
      </div>

      <style>{`
        .inventory-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .inventory-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }
        .inventory-card {
          padding: 16px;
        }
        .inventory-card h4 {
          margin: 0;
        }
        .inv-stats {
          font-size: 0.85rem;
          color: var(--md-sys-color-on-surface-variant);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .qty-row, .expiry-row, .loc-row {
          display: flex;
          justify-content: space-between;
        }
        .low-stock {
          color: var(--md-sys-color-error);
          font-weight: 700;
        }
        .expired {
          color: var(--md-sys-color-error);
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
};
