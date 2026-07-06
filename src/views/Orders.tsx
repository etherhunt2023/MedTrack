import React from 'react';
import { useDB } from '../context/DBContext';

export const OrdersView: React.FC = () => {
  const { orders } = useDB();

  return (
    <div className="orders-container">
      <div className="section-header md-card md-card--filled">
        <h2>Order Records</h2>
        <p>View invoices and order histories imported from local/online pharmacies.</p>
      </div>

      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="md-card md-card--outlined order-card">
            <div className="order-row-header">
              <strong>Order #{order.order_number}</strong>
              <span className={`badge-status ${order.status}`}>
                {order.status}
              </span>
            </div>
            <div className="order-details">
              <p>Date: {new Date(order.order_date).toLocaleDateString()}</p>
              <p>Total Cost: ₹{order.total_amount}</p>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <p className="text-center" style={{ padding: '24px', color: 'var(--md-sys-color-on-surface-variant)' }}>
            No pharmacy orders logged yet.
          </p>
        )}
      </div>

      <style>{`
        .orders-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .order-card {
          padding: 16px;
          margin-bottom: 12px;
        }
        .order-row-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .badge-status {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: var(--md-shape-corner-full);
          text-transform: uppercase;
        }
        .badge-status.delivered {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        .badge-status.ordered {
          background-color: #e3f2fd;
          color: #1565c0;
        }
        .order-details {
          font-size: 0.875rem;
          color: var(--md-sys-color-on-surface-variant);
        }
        .order-details p {
          margin: 4px 0;
        }
      `}</style>
    </div>
  );
};
