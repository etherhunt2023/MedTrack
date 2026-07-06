import React, { useState } from 'react';
import { useDB } from '../context/DBContext';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, user } = useDB();
  const activeSetting = settings.find(s => s.profile_id === user?.id) || settings[0];

  const [threshold, setThreshold] = useState(activeSetting?.low_stock_threshold || 5);
  const [expiryWarning, setExpiryWarning] = useState(activeSetting?.expiry_warning_days || 30);
  const [reminders, setReminders] = useState(activeSetting?.enable_reminders ?? true);
  const [success, setSuccess] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    try {
      if (activeSetting) {
        await updateSettings({
          low_stock_threshold: Number(threshold),
          expiry_warning_days: Number(expiryWarning),
          enable_reminders: reminders
        });
        setSuccess('Cabinet configurations updated.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="settings-container">
      <div className="section-header md-card md-card--filled">
        <h2>Cabinet Settings</h2>
        <p>Configure reminder rules and low stock alert thresholds.</p>
      </div>

      <form onSubmit={handleSave} className="md-card md-card--elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {success && (
          <div className="md-alert md-alert--success">
            <span>{success}</span>
          </div>
        )}

        <div className="md-field-group">
          <label className="md-field-label">Low Stock Threshold (Units)</label>
          <input
            type="number"
            className="md-field"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            min="1"
          />
        </div>

        <div className="md-field-group">
          <label className="md-field-label">Expiry Warning Trigger (Days before)</label>
          <input
            type="number"
            className="md-field"
            value={expiryWarning}
            onChange={(e) => setExpiryWarning(Number(e.target.value))}
            min="1"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0 16px' }}>
          <input
            type="checkbox"
            id="reminders"
            checked={reminders}
            onChange={(e) => setReminders(e.target.checked)}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
          <label htmlFor="reminders" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
            Enable Medication Expiry Notifications
          </label>
        </div>

        <button type="submit" className="md-btn md-btn--filled" style={{ alignSelf: 'flex-start' }}>
          Save Configurations
        </button>
      </form>
    </div>
  );
};
