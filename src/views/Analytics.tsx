import React from 'react';

export const AnalyticsView: React.FC = () => {
  return (
    <div className="analytics-container">
      <div className="section-header md-card md-card--filled">
        <h2>Cabinet Analytics</h2>
        <p>Analyze medicine spending over time and track dosage consumption compliance.</p>
      </div>

      <div className="md-card md-card--outlined text-center" style={{ padding: '32px' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="1.5" style={{ marginBottom: '16px' }}>
          <path d="M3 3v18h18" />
          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
        </svg>
        <h4>Dosage Charts & compliance stats are coming soon!</h4>
        <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem', marginTop: '8px' }}>
          Phase 3 and 4 will implement spending analyses, AI-powered price recommendations, OCR processing, and dosage tracking triggers.
        </p>
      </div>
    </div>
  );
};
