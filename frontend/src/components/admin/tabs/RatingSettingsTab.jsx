// src/components/admin/tabs/RatingSettingsTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RatingSettingsTab = ({ token, darkMode, headingColor, textColor, secondaryText, cardBg }) => {
  const [settings, setSettings] = useState({
    showRatingModal: true,
    modalFrequency: 'afterExam',
    minExamsBeforePrompt: 3,
    customMessage: 'We value your feedback! Please rate your experience.',
    MarketingRatingsCount: 0,
    MarketingRatingsDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/admin/ratings/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
      alert('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(
        '/api/admin/ratings/settings',
        { ratingSettings: settings },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading settings...</p>;

  return (
    <div>
      <h3 style={{ color: headingColor }}>Rating Modal Settings</h3>
      <div style={{ maxWidth: 500 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: textColor, fontWeight: 'bold' }}>Show Rating Modal</label>
          <input
            type="checkbox"
            checked={settings.showRatingModal}
            onChange={(e) => setSettings({ ...settings, showRatingModal: e.target.checked })}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: textColor, fontWeight: 'bold' }}>Frequency</label>
          <select
            value={settings.modalFrequency}
            onChange={(e) => setSettings({ ...settings, modalFrequency: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: cardBg, color: textColor }}
          >
            <option value="always">Always</option>
            <option value="once">Once per user</option>
            <option value="afterExam">After X exams</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        {settings.modalFrequency === 'afterExam' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: textColor, fontWeight: 'bold' }}>Min Exams Before Prompt</label>
            <input
              type="number"
              min="1"
              value={settings.minExamsBeforePrompt}
              onChange={(e) => setSettings({ ...settings, minExamsBeforePrompt: parseInt(e.target.value) || 3 })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: cardBg, color: textColor }}
            />
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: textColor, fontWeight: 'bold' }}>Custom Message</label>
          <input
            type="text"
            value={settings.customMessage}
            onChange={(e) => setSettings({ ...settings, customMessage: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: cardBg, color: textColor }}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '10px 24px', background: '#1e3c72', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default RatingSettingsTab;