// src/components/admin/components/AdjustPremiumModal.jsx
import React from 'react';

export const AdjustPremiumModal = ({
  showAdjustModal,
  setShowAdjustModal,
  adjustUserId,
  adjustPlanType,
  setAdjustPlanType,
  adjustCustomDays,
  setAdjustCustomDays,
  adjustCustomHours,
  setAdjustCustomHours,
  adjustLoading,
  adjustResult,
  handleAdjustPremium,
  cardBg,
  headingColor,
  textColor,
  secondaryText,
  darkMode
}) => {
  if (!showAdjustModal) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: 20
    }}>
      <div style={{
        background: cardBg,
        borderRadius: 20,
        padding: 28,
        maxWidth: 500,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{ color: headingColor, marginBottom: 20 }}>Adjust Premium Time</h3>
        <p style={{ color: secondaryText, marginBottom: 16 }}>Add extra time to this user's premium subscription.</p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Add by Plan Type</label>
          <select
            value={adjustPlanType}
            onChange={(e) => setAdjustPlanType(e.target.value)}
            style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333' }}
          >
            <option value="daily">Daily (1 day)</option>
            <option value="monthly">Monthly (30 days)</option>
            <option value="yearly">Yearly (365 days)</option>
          </select>
          <button
            onClick={() => handleAdjustPremium(adjustUserId, adjustPlanType, null, null)}
            disabled={adjustLoading}
            style={{ marginTop: 10, background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
          >
            {adjustLoading ? 'Adding...' : `Add ${adjustPlanType} plan`}
          </button>
        </div>

        <div style={{ marginBottom: 16, borderTop: `1px solid ${darkMode ? '#444' : '#ddd'}`, paddingTop: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Or add custom time</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <input
                type="number"
                placeholder="Days"
                value={adjustCustomDays}
                onChange={(e) => setAdjustCustomDays(e.target.value)}
                style={{ flex: 2, minWidth: 120, maxWidth: 200, padding: '10px 29px', border: '2px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#2d2d3d' : 'white', color: textColor }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="number"
                placeholder="Hours"
                value={adjustCustomHours}
                onChange={(e) => setAdjustCustomHours(e.target.value)}
                style={{ flex: 2, minWidth: 120, maxWidth: 200, padding: '10px 29px', border: '2px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#2d2d3d' : 'white', color: textColor }}
              />
            </div>
          </div>
          <button
            onClick={() => {
              const days = parseInt(adjustCustomDays) || 0;
              const hours = parseInt(adjustCustomHours) || 0;
              if (!days && !hours) {
                alert('Please enter at least one value');
                return;
              }
              handleAdjustPremium(adjustUserId, null, days, hours);
            }}
            disabled={adjustLoading}
            style={{ marginTop: 10, background: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
          >
            {adjustLoading ? 'Adding...' : 'Add Custom Time'}
          </button>
        </div>

        {adjustResult && <p style={{ marginTop: 16, color: adjustResult.includes('✅') ? '#2e7d32' : '#dc3545' }}>{adjustResult}</p>}

        <button
          onClick={() => {
            setShowAdjustModal(false);
            setAdjustUserId(null);
            setAdjustResult('');
            setAdjustCustomDays('');
            setAdjustCustomHours('');
          }}
          style={{ marginTop: 16, background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
        >
          Close
        </button>
      </div>
    </div>
  );
};