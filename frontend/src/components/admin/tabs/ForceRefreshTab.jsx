// src/components/admin/tabs/ForceRefreshTab.jsx
import React from 'react';

export const ForceRefreshTab = ({
  forceRefreshMessage,
  setForceRefreshMessage,
  forceRefreshLoading,
  forceRefreshResult,
  forceRefreshVersion,
  handleForceRefresh,
  handleDeactivateRefresh,
  loadForceRefresh,
  darkMode,
  headingColor,
  secondaryText,
  textColor,
  cardBg
}) => {
  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ color: headingColor, marginBottom: '20px' }}>🔄 Force Refresh</h3>
      <p style={{ color: secondaryText, marginBottom: '16px' }}>
        Trigger a force refresh for all active users. When enabled, every user will see a modal that forces them to refresh their page.
        This is useful when you deploy critical updates that require a clean page reload.
      </p>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          background: darkMode ? '#2d2d3d' : '#f5f5f5', 
          padding: '16px 20px', 
          borderRadius: '12px',
          marginBottom: '16px'
        }}>
          <strong style={{ color: textColor }}>Current Version:</strong>
          <span style={{ color: '#ff9800', fontWeight: 'bold', marginLeft: '8px' }}>
            {forceRefreshVersion || 0}
          </span>
          <span style={{ color: secondaryText, fontSize: '12px', marginLeft: '12px' }}>
            {forceRefreshVersion === 0 ? '(Inactive)' : '(Active)'}
          </span>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: textColor, fontWeight: 'bold' }}>
            Refresh Message
          </label>
          <textarea
            placeholder="Enter the message users will see when they need to refresh..."
            value={forceRefreshMessage}
            onChange={(e) => setForceRefreshMessage(e.target.value)}
            rows="3"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ccc',
              borderRadius: '8px',
              fontSize: '14px',
              background: darkMode ? '#1a1a2e' : '#f8f9fa',
              color: textColor,
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleForceRefresh}
            disabled={forceRefreshLoading}
            style={{
              background: '#dc3545',
              color: 'white',
              padding: '12px 32px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              opacity: forceRefreshLoading ? 0.7 : 1
            }}
          >
            {forceRefreshLoading ? 'Triggering...' : '🔴 Trigger Refresh'}
          </button>

          <button
            onClick={handleDeactivateRefresh}
            disabled={forceRefreshLoading}
            style={{
              background: '#6c757d',
              color: 'white',
              padding: '12px 32px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              opacity: forceRefreshLoading ? 0.7 : 1
            }}
          >
            Deactivate Refresh
          </button>

          <button
            onClick={loadForceRefresh}
            disabled={forceRefreshLoading}
            style={{
              background: '#1e3c72',
              color: 'white',
              padding: '12px 32px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              opacity: forceRefreshLoading ? 0.7 : 1
            }}
          >
            Load Current
          </button>
        </div>

        {forceRefreshResult && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: forceRefreshResult.includes('✅') ? (darkMode ? '#2d2d3d' : '#e8f5e9') : (darkMode ? '#2d2d3d' : '#ffebee'),
            borderRadius: '8px',
            borderLeft: `4px solid ${forceRefreshResult.includes('✅') ? '#2e7d32' : '#c62828'}`
          }}>
            <p style={{ color: forceRefreshResult.includes('✅') ? '#2e7d32' : '#c62828', margin: 0, fontSize: '14px' }}>
              {forceRefreshResult}
            </p>
          </div>
        )}

        <div style={{ marginTop: '20px', padding: '16px', background: darkMode ? '#2d2d3d' : '#fff3e0', borderRadius: '8px', borderLeft: '4px solid #ff9800' }}>
          <p style={{ margin: 0, fontSize: '13px', color: secondaryText }}>
            💡 <strong>How it works:</strong> When you trigger a refresh, the version increases. Users' browsers will detect this change and show a modal 
            with your message. They must click "Refresh Now" to continue using the app.
          </p>
        </div>
      </div>
    </div>
  );
};