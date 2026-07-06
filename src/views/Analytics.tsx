import React, { useState } from 'react';
import { useDB } from '../context/DBContext';

export const AnalyticsView: React.FC = () => {
  const { orders, orderItems, medicines, priceHistory, platforms } = useDB();

  // Selected medicine for price comparison dropdown
  const [selectedMedId, setSelectedMedId] = useState<string>(
    medicines.length > 0 ? medicines[0].id : ''
  );

  // 1. Calculate Monthly Spending for the last 6 months
  const monthlySpending = (() => {
    interface MonthSpend {
      label: string;
      year: number;
      month: number;
      amount: number;
    }
    const list: MonthSpend[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const tempDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({
        label: tempDate.toLocaleString('default', { month: 'short' }),
        year: tempDate.getFullYear(),
        month: tempDate.getMonth(),
        amount: 0
      });
    }

    orders.forEach(order => {
      if (order.status === 'cancelled') return;
      const orderDate = new Date(order.order_date);
      const oMonth = orderDate.getMonth();
      const oYear = orderDate.getFullYear();

      const match = list.find(m => m.month === oMonth && m.year === oYear);
      if (match) {
        match.amount += order.total_amount;
      }
    });

    return list;
  })();

  const maxMonthlyAmount = Math.max(...monthlySpending.map(m => m.amount), 500);

  // 2. Calculate Spending by Category (Dosage Form)
  const categorySpending = (() => {
    const map: Record<string, number> = {};
    orderItems.forEach(item => {
      const order = orders.find(o => o.id === item.order_id);
      if (!order || order.status === 'cancelled') return;
      const med = medicines.find(m => m.id === item.medicine_id);
      const category = med?.dosage_form || 'Other';
      map[category] = (map[category] || 0) + item.total_price;
    });

    return Object.entries(map).map(([name, amount]) => ({ name, amount }));
  })();

  const totalCatSpending = categorySpending.reduce((sum, c) => sum + c.amount, 0);

  // 3. Price comparison for selected medicine
  const priceComparisonData = (() => {
    if (!selectedMedId) return [];
    
    // Filter price histories
    const medHistory = priceHistory.filter(ph => ph.medicine_id === selectedMedId);
    
    // Find latest price recorded for each platform
    const platformPriceMap: Record<string, { price: number; date: string; platformName: string }> = {};
    
    medHistory.forEach(ph => {
      const platform = platforms.find(p => p.id === ph.platform_id);
      const platformName = platform?.name || 'Pharmacy';
      
      if (!platformPriceMap[ph.platform_id] || platformPriceMap[ph.platform_id].date < ph.recorded_at) {
        platformPriceMap[ph.platform_id] = {
          price: ph.price_per_unit,
          date: ph.recorded_at,
          platformName
        };
      }
    });

    return Object.values(platformPriceMap);
  })();

  // Find lowest price
  const lowestUnitPrice = priceComparisonData.length > 0 
    ? Math.min(...priceComparisonData.map(d => d.price)) 
    : 0;

  // 4. Export all orders as CSV file
  const handleCSVExport = () => {
    const headers = ['Order Number', 'Date', 'Pharmacy', 'Subtotal (INR)', 'Discount (INR)', 'Tax (INR)', 'Delivery (INR)', 'Total (INR)', 'Status'];
    
    const rows = orders.map(order => {
      const platformName = platforms.find(p => p.id === order.platform_id)?.name || 'Unknown';
      return [
        order.order_number,
        new Date(order.order_date).toLocaleDateString(),
        platformName,
        order.subtotal,
        order.discount,
        order.tax,
        order.delivery_charges,
        order.total_amount,
        order.status
      ];
    });

    // Format safely wrapping in double quotes
    const csvContent = "data:text/csv;charset=utf-8," 
      + [
          headers.join(','), 
          ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `orders_expense_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="analytics-view-container">
      {/* Print Only Header Banner */}
      <div className="print-header-banner">
        <h2>MedTrack Cabinet Analytics & Expense Report</h2>
        <p>Generated on: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="section-header-row no-print">
        <div>
          <h2 style={{ margin: 0 }}>Analytics & Reports</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
            Monitor monthly expenses, price histories across stores, and export data audits.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="md-btn md-btn--outlined" onClick={handleCSVExport}>
            📥 Export CSV
          </button>
          <button className="md-btn md-btn--tonal" onClick={handlePrint}>
            🖨️ Print Report
          </button>
        </div>
      </div>

      {/* Grid: Charts */}
      <div className="analytics-grid">
        {/* 1. Monthly Spending Trends */}
        <div className="md-card md-card--outlined chart-card">
          <h3>Monthly Spending Trends</h3>
          <p className="card-subtext no-print">Total expenses logged over the last 6 months (INR).</p>
          
          <div className="svg-chart-container mt-4">
            <svg viewBox="0 0 500 220" width="100%" height="100%">
              {/* Axes lines */}
              <line x1="40" y1="180" x2="480" y2="180" stroke="var(--md-sys-color-outline-variant)" strokeWidth="1.5" />
              <line x1="40" y1="20" x2="40" y2="180" stroke="var(--md-sys-color-outline-variant)" strokeWidth="1.5" />
              
              {/* Bars */}
              {monthlySpending.map((month, idx) => {
                const barWidth = 45;
                const gap = 24;
                const x = 55 + idx * (barWidth + gap);
                const barHeight = maxMonthlyAmount > 0 ? (month.amount / maxMonthlyAmount) * 140 : 0;
                const y = 180 - barHeight;

                return (
                  <g key={idx} className="chart-bar-group">
                    {/* Hover tooltip for amount */}
                    <title>₹{month.amount.toFixed(2)}</title>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="4"
                      fill="var(--md-sys-color-primary)"
                      className="svg-bar"
                    />
                    {/* Label amount on top of bar */}
                    {month.amount > 0 && (
                      <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--md-sys-color-on-background)">
                        ₹{month.amount.toFixed(0)}
                      </text>
                    )}
                    {/* X axis labels */}
                    <text x={x + barWidth / 2} y="196" textAnchor="middle" fontSize="11" fontWeight="500" fill="var(--md-sys-color-on-surface-variant)">
                      {month.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* 2. Category Dosage Form Breakdown */}
        <div className="md-card md-card--outlined chart-card">
          <h3>Category Breakdown</h3>
          <p className="card-subtext no-print">Spending distribution grouped by medicine dosage forms.</p>

          <div className="category-breakdown-list mt-4">
            {categorySpending.map((cat, idx) => {
              const percentage = totalCatSpending > 0 ? (cat.amount / totalCatSpending) * 100 : 0;
              return (
                <div key={idx} className="category-progress-row">
                  <div className="category-label-row justify-between">
                    <strong>{cat.name}</strong>
                    <span>₹{cat.amount.toFixed(2)} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="progress-bar-track">
                    <div 
                      className="progress-bar-fill"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: `var(--md-sys-color-primary)`
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}

            {categorySpending.length === 0 && (
              <div className="empty-state text-center mt-4">
                <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>No categorization data available.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Pharmacy Price Comparison Card */}
      <div className="md-card md-card--outlined price-comparison-card mt-4">
        <div className="section-header justify-between">
          <div>
            <h3 style={{ margin: 0 }}>Pharmacy Price Comparison</h3>
            <p className="card-subtext no-print">Compare recorded unit prices for a medicine across platforms.</p>
          </div>
          
          <div className="no-print">
            <select
              value={selectedMedId}
              onChange={(e) => setSelectedMedId(e.target.value)}
              className="md-field"
              style={{ width: 'auto', height: '40px', padding: '0 8px' }}
            >
              {medicines.map(m => (
                <option key={m.id} value={m.id}>{m.brand} ({m.name})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="price-comparison-content mt-4">
          {priceComparisonData.length > 0 ? (
            <div className="price-bars-container">
              {priceComparisonData.map((data, idx) => {
                const isLowest = data.price === lowestUnitPrice;
                const maxPrice = Math.max(...priceComparisonData.map(d => d.price), 1);
                const widthPercent = (data.price / maxPrice) * 100;

                return (
                  <div key={idx} className={`price-comp-bar-row ${isLowest ? 'lowest' : ''}`}>
                    <div className="price-comp-label justify-between">
                      <strong>{data.platformName}</strong>
                      <span className="price-tag">
                        ₹{data.price.toFixed(2)}/unit {isLowest && <span className="lowest-badge">Lowest Price</span>}
                      </span>
                    </div>
                    <div className="progress-bar-track flex-1">
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${widthPercent}%`,
                          backgroundColor: isLowest ? '#2e7d32' : 'var(--md-sys-color-outline)'
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state text-center py-4" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
              <span>🔍</span>
              <p style={{ marginTop: '8px' }}>No pricing history records found for this medicine.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .analytics-view-container {
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
        .analytics-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 800px) {
          .analytics-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .chart-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
        }
        .chart-card h3 {
          margin: 0;
        }
        .card-subtext {
          font-size: 0.75rem;
          color: var(--md-sys-color-on-surface-variant);
          margin: 4px 0 0 0;
        }
        .svg-chart-container {
          height: 220px;
          width: 100%;
        }
        .svg-bar {
          transition: fill 0.2s, height 0.3s cubic-bezier(0.2, 0, 0, 1), y 0.3s cubic-bezier(0.2, 0, 0, 1);
        }
        .svg-bar:hover {
          fill: color-mix(in srgb, var(--md-sys-color-primary) 85%, black);
        }
        .category-breakdown-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .category-progress-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .category-label-row {
          font-size: 0.8rem;
          color: var(--md-sys-color-on-surface);
        }
        .progress-bar-track {
          height: 12px;
          background-color: var(--md-sys-color-surface-variant);
          border-radius: var(--md-shape-corner-full);
          overflow: hidden;
          position: relative;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: var(--md-shape-corner-full);
          transition: width 0.4s cubic-bezier(0.2, 0, 0, 1);
        }
        .price-comparison-card {
          padding: 24px;
        }
        .price-comparison-card h3 {
          margin: 0;
        }
        .price-bars-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .price-comp-bar-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .price-comp-label {
          font-size: 0.85rem;
        }
        .price-tag {
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lowest-badge {
          font-size: 0.7rem;
          color: #ffffff;
          background-color: #2e7d32;
          padding: 2px 6px;
          border-radius: var(--md-shape-corner-full);
          font-weight: 700;
        }
        .price-comp-bar-row.lowest strong {
          color: #2e7d32;
        }
        .print-header-banner {
          display: none;
        }
        
        /* Print Optimized Media Queries */
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print, .layout-header, .md-bottom-nav, select, button {
            display: none !important;
          }
          .print-header-banner {
            display: block !important;
            border-bottom: 2px solid #000000;
            padding-bottom: 12px;
            margin-bottom: 24px;
          }
          .analytics-grid {
            grid-template-columns: 1fr !important;
          }
          .md-card {
            border: 1px solid #000000 !important;
            box-shadow: none !important;
            break-inside: avoid;
            margin-bottom: 24px;
          }
        }
        .justify-between {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      `}</style>
    </div>
  );
};
