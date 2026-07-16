// src/components/admin/tabs/HomePageControlTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const HomePageControlTab = ({ token, config, setConfig, darkMode, headingColor, secondaryText, textColor, cardBg }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [localConfig, setLocalConfig] = useState({
    showFreeMode: true,
    showPremiumMode: true,
    showStudyMode: true,
    showProgressSnapshot: true,
    showDownloadApp: true,
    showWeeklyQuiz: true,
    showGetPremium: true      // ← NEW: Get Premium toggle
  });

  useEffect(() => {
    if (config) {
      setLocalConfig({
        showFreeMode: config.showFreeMode !== undefined ? config.showFreeMode : true,
        showPremiumMode: config.showPremiumMode !== undefined ? config.showPremiumMode : true,
        showStudyMode: config.showStudyMode !== undefined ? config.showStudyMode : true,
        showProgressSnapshot: config.showProgressSnapshot !== undefined ? config.showProgressSnapshot : true,
        showDownloadApp: config.showDownloadApp !== undefined ? config.showDownloadApp : true,
        showWeeklyQuiz: config.showWeeklyQuiz !== undefined ? config.showWeeklyQuiz : true,
        showGetPremium: config.showGetPremium !== undefined ? config.showGetPremium : true   // ← NEW
      });
    }
  }, [config]);

  const handleToggle = (field) => {
    setLocalConfig(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    setLoading(true);
    setResult('');
    try {
      const updatedConfig = { ...config, ...localConfig };
      const res = await axios.put('/api/admin/config', updatedConfig, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setConfig(res.data.config);
        setResult('✅ Home page settings updated successfully!');
      }
    } catch (error) {
      setResult('❌ Failed to update: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const ToggleRow = ({ label, field, description }) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 18px',
      background: darkMode ? '#1a1a2e' : '#f8f9fa',
      borderRadius: 10,
      borderBottom: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
      flexWrap: 'wrap',
      gap: 12
    }}>
      <div>
        <div style={{ fontWeight: 'bold', color: headingColor }}>{label}</div>
        {description && <div style={{ fontSize: 13, color: secondaryText }}>{description}</div>}
      </div>
      <button
        onClick={() => handleToggle(field)}
        style={{
          padding: '6px 18px',
          borderRadius: 30,
          border: 'none',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: 13,
          background: localConfig[field] ? '#4caf50' : '#dc3545',
          color: 'white',
          minWidth: '80px',
          transition: 'background 0.2s'
        }}
      >
        {localConfig[field] ? '✅ Show' : '❌ Hide'}
      </button>
    </div>
  );

  return (
    <div>
      <h3 style={{ color: headingColor, marginBottom: 20 }}>🏠 Home Page Control</h3>
      <p style={{ color: secondaryText, marginBottom: 16 }}>
        Toggle which sections appear on the home page. Changes take effect immediately after saving.
      </p>

      {result && (
        <div style={{
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          background: result.includes('✅') ? '#e8f5e9' : '#ffebee',
          color: result.includes('✅') ? '#2e7d32' : '#c62828'
        }}>
          {result}
        </div>
      )}

      <div style={{
        background: darkMode ? '#16213e' : 'white',
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${darkMode ? '#444' : '#ddd'}`
      }}>
        <ToggleRow
          label="🆓 Free Mode"
          field="showFreeMode"
          description="Show the Free Mode button on the home page"
        />
        <ToggleRow
          label="⭐ Premium Mode"
          field="showPremiumMode"
          description="Show the Premium Mode button on the home page"
        />
        <ToggleRow
          label="📖 Study Mode"
          field="showStudyMode"
          description="Show the Study Mode button on the home page"
        />
        <ToggleRow
          label="📅 Weekly Quiz"
          field="showWeeklyQuiz"
          description="Show the Weekly Quiz button on the home page"
        />
        {/* ===== NEW Toggle Row ===== */}
        <ToggleRow
          label="⭐ Get Premium"
          field="showGetPremium"
          description="Show the Get Premium button on the home page"
        />
        <ToggleRow
          label="📊 Progress Snapshot"
          field="showProgressSnapshot"
          description="Show the progress snapshot section on the home page"
        />
        <ToggleRow
          label="📱 Download App"
          field="showDownloadApp"
          description="Show the download app button on the home page"
        />
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            background: '#1e3c72',
            color: 'white',
            padding: '12px 32px',
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: 16,
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Saving...' : '💾 Save Home Page Settings'}
        </button>
      </div>
    </div>
  );
};