// src/components/admin/tabs/SystemSettingsTab.jsx
import React from 'react';

export const SystemSettingsTab = ({
  config,
  setConfig,
  configLoading,
  handleSaveConfig,
  configResult,
  headingColor,
  secondaryText,
  textColor,
  darkMode,
  cardBg
}) => {
  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ color: headingColor, marginBottom: 24 }}>⚙️ System Settings</h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', 
        gap: '24px 32px',
        background: darkMode ? '#1a1a2e' : '#f8f9fa',
        padding: 24,
        borderRadius: 12,
      }}>
        {/* Premium Prices */}
        <div style={{ minWidth: 0 }}>
          <label style={{ color: textColor, fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Daily Premium Price (₦)</label>
          <input type="number" value={config.premiumDailyPrice || 500} onChange={(e) => setConfig({...config, premiumDailyPrice: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <label style={{ color: textColor, fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Monthly Premium Price (₦)</label>
          <input type="number" value={config.premiumMonthlyPrice || 2000} onChange={(e) => setConfig({...config, premiumMonthlyPrice: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <label style={{ color: textColor, fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Yearly Premium Price (₦)</label>
          <input type="number" value={config.premiumYearlyPrice || 10000} onChange={(e) => setConfig({...config, premiumYearlyPrice: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <label style={{ color: textColor, fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Free Exam Limit</label>
          <input type="number" value={config.freeExamLimit || 1} onChange={(e) => setConfig({...config, freeExamLimit: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <label style={{ color: textColor, fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Default Passing Score (%)</label>
          <input type="number" value={config.defaultPassingScore || 70} onChange={(e) => setConfig({...config, defaultPassingScore: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <label style={{ color: textColor, fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Default Time Limit (minutes)</label>
          <input type="number" value={config.defaultTimeLimit || 20} onChange={(e) => setConfig({...config, defaultTimeLimit: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
        </div>

        {/* Feature Toggles */}
        <div style={{ gridColumn: 'span 2', display: 'flex', gap: 32, padding: '16px 20px', background: darkMode ? '#2d2d3d' : 'white', borderRadius: 8, marginTop: 4 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: textColor, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={config.showWeeklyQuiz || false} onChange={(e) => setConfig({...config, showWeeklyQuiz: e.target.checked})} style={{ width: 18, height: 18, cursor: 'pointer' }} />
            Show Weekly Quiz
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: textColor, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={config.showLeaderboard || false} onChange={(e) => setConfig({...config, showLeaderboard: e.target.checked})} style={{ width: 18, height: 18, cursor: 'pointer' }} />
            Show Leaderboard
          </label>
        </div>

        {/* Contact Info */}
        <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px 32px', paddingTop: 8 }}>
          <div>
            <label style={{ color: textColor, fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Contact Email</label>
            <input type="email" value={config.contactEmail || ''} onChange={(e) => setConfig({...config, contactEmail: e.target.value})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ color: textColor, fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Contact Phone</label>
            <input type="text" value={config.contactPhone || ''} onChange={(e) => setConfig({...config, contactPhone: e.target.value})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* App Name */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ color: textColor, fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>App Name</label>
          <input type="text" value={config.appName || ''} onChange={(e) => setConfig({...config, appName: e.target.value})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
        </div>

        {/* Maintenance Mode */}
        <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: darkMode ? '#2d2d3d' : 'white', borderRadius: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: textColor, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={config.maintenanceMode || false} onChange={(e) => setConfig({...config, maintenanceMode: e.target.checked})} style={{ width: 18, height: 18, cursor: 'pointer' }} />
            Maintenance Mode
          </label>
          {config.maintenanceMode && (
            <div style={{ flex: 1 }}>
              <input type="text" placeholder="Maintenance message" value={config.maintenanceMessage || ''} onChange={(e) => setConfig({...config, maintenanceMessage: e.target.value})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
            </div>
          )}
        </div>

        {/* Save Button */}
        <div style={{ gridColumn: 'span 2', display: 'flex', gap: 12, marginTop: 8 }}>
          <button onClick={handleSaveConfig} disabled={configLoading} style={{ background: '#1e3c72', color: 'white', padding: '12px 32px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 16, opacity: configLoading ? 0.7 : 1, transition: 'opacity 0.2s' }}>{configLoading ? 'Saving...' : 'Save Settings'}</button>
          {configResult && <p style={{ marginLeft: 16, alignSelf: 'center', color: configResult.includes('✅') ? '#2e7d32' : '#dc3545' }}>{configResult}</p>}
        </div>
      </div>
    </div>
  );
};