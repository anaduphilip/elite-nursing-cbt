// src/components/admin/tabs/RatingSettingsTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RatingSettingsTab = ({ token, darkMode, headingColor, textColor, secondaryText, cardBg }) => {
  const [settings, setSettings] = useState({
    // ---- Modal settings ----
    showRatingModal: true,
    modalFrequency: 'afterExam',
    minExamsBeforePrompt: 3,
    customMessage: 'We value your feedback! Please rate your experience.',

    // ---- Feedback list settings ----
    showFeedbackList: true,
    feedbackListLimit: 5,
    showSeeAllLink: true,

    // ---- Rating widget visibility ----
    showRatingOnHome: true,
    showRatingOnAbout: true,

    // ---- Marketing reactions ----
    enableMarketingReactions: true,
    allowedReactionEmojis: '👍,❤️,👏,😊,🔥,💯,🌟,🙌',

    // ---- Marketing counts (for stats) ----
    fakeRatingsCount: 0,
    fakeRatingsDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
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
        // Merge with defaults to avoid missing fields
        setSettings(prev => ({
          ...prev,
          ...res.data.settings
        }));
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

  if (loading) {
    return <p style={{ color: secondaryText }}>Loading settings...</p>;
  }

  return (
    <div>
      <h3 style={{ color: headingColor, marginBottom: 20 }}>Rating & Feedback Settings</h3>

      {/* ===== SECTION 1: Rating Modal ===== */}
      <div style={{
        background: cardBg,
        borderRadius: 12,
        padding: 20,
        border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
        marginBottom: 24
      }}>
        <h4 style={{ color: headingColor, marginBottom: 12 }}>⭐ Rating Modal</h4>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: textColor }}>
            <input
              type="checkbox"
              checked={settings.showRatingModal}
              onChange={(e) => setSettings({ ...settings, showRatingModal: e.target.checked })}
            />
            Show rating modal to users
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', color: textColor, fontWeight: 'bold', marginBottom: 4 }}>
            Modal Frequency
          </label>
          <select
            value={settings.modalFrequency}
            onChange={(e) => setSettings({ ...settings, modalFrequency: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
              background: cardBg,
              color: textColor
            }}
          >
            <option value="always">Always</option>
            <option value="once">Once per user</option>
            <option value="afterExam">After X exams</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        {settings.modalFrequency === 'afterExam' && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', color: textColor, fontWeight: 'bold', marginBottom: 4 }}>
              Minimum exams before prompting
            </label>
            <input
              type="number"
              min="1"
              value={settings.minExamsBeforePrompt}
              onChange={(e) => setSettings({ ...settings, minExamsBeforePrompt: parseInt(e.target.value) || 3 })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
                background: cardBg,
                color: textColor
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', color: textColor, fontWeight: 'bold', marginBottom: 4 }}>
            Custom modal message
          </label>
          <input
            type="text"
            value={settings.customMessage}
            onChange={(e) => setSettings({ ...settings, customMessage: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
              background: cardBg,
              color: textColor
            }}
          />
        </div>
      </div>

      {/* ===== SECTION 2: Feedback Display ===== */}
      <div style={{
        background: cardBg,
        borderRadius: 12,
        padding: 20,
        border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
        marginBottom: 24
      }}>
        <h4 style={{ color: headingColor, marginBottom: 12 }}>📝 Feedback List (HomePage)</h4>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: textColor }}>
            <input
              type="checkbox"
              checked={settings.showFeedbackList}
              onChange={(e) => setSettings({ ...settings, showFeedbackList: e.target.checked })}
            />
            Show "What Our Users Say" on homepage
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', color: textColor, fontWeight: 'bold', marginBottom: 4 }}>
            Number of feedbacks to display
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={settings.feedbackListLimit}
            onChange={(e) => setSettings({ ...settings, feedbackListLimit: parseInt(e.target.value) || 5 })}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
              background: cardBg,
              color: textColor
            }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: textColor }}>
            <input
              type="checkbox"
              checked={settings.showSeeAllLink}
              onChange={(e) => setSettings({ ...settings, showSeeAllLink: e.target.checked })}
            />
            Show "See all reviews" link
          </label>
        </div>
      </div>

      {/* ===== SECTION 3: Rating Widget Visibility ===== */}
      <div style={{
        background: cardBg,
        borderRadius: 12,
        padding: 20,
        border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
        marginBottom: 24
      }}>
        <h4 style={{ color: headingColor, marginBottom: 12 }}>📍 Rating Widget Visibility</h4>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: textColor }}>
            <input
              type="checkbox"
              checked={settings.showRatingOnHome}
              onChange={(e) => setSettings({ ...settings, showRatingOnHome: e.target.checked })}
            />
            Show rating summary on HomePage
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: textColor }}>
            <input
              type="checkbox"
              checked={settings.showRatingOnAbout}
              onChange={(e) => setSettings({ ...settings, showRatingOnAbout: e.target.checked })}
            />
            Show detailed rating stats on About Us
          </label>
        </div>
      </div>

      {/* ===== SECTION 4: Marketing Reactions ===== */}
      <div style={{
        background: cardBg,
        borderRadius: 12,
        padding: 20,
        border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
        marginBottom: 24
      }}>
        <h4 style={{ color: headingColor, marginBottom: 12 }}>🎭 Marketing Reactions</h4>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: textColor }}>
            <input
              type="checkbox"
              checked={settings.enableMarketingReactions}
              onChange={(e) => setSettings({ ...settings, enableMarketingReactions: e.target.checked })}
            />
            Enable admin‑controlled marketing reactions (counts and emojis)
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', color: textColor, fontWeight: 'bold', marginBottom: 4 }}>
            Allowed reaction emojis (comma separated)
          </label>
          <input
            type="text"
            value={settings.allowedReactionEmojis}
            onChange={(e) => setSettings({ ...settings, allowedReactionEmojis: e.target.value })}
            placeholder="e.g. 👍,❤️,👏,😊,🔥,💯,🌟,🙌"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
              background: cardBg,
              color: textColor
            }}
          />
          <p style={{ fontSize: 12, color: secondaryText, marginTop: 4 }}>
            These emojis will be available in the reaction picker on the frontend.
          </p>
        </div>
      </div>

      {/* ===== Save Button ===== */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: '10px 32px',
          background: '#1e3c72',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: 16,
          opacity: saving ? 0.7 : 1
        }}
      >
        {saving ? 'Saving...' : 'Save All Settings'}
      </button>
    </div>
  );
};

export default RatingSettingsTab;