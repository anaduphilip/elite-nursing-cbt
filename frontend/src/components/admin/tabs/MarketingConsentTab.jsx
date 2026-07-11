// src/components/admin/tabs/MarketingConsentTab.jsx
import React from 'react';

export const MarketingConsentTab = ({
  consentMessage,
  setConsentMessage,
  consentButtonText,
  setConsentButtonText,
  consentActive,
  setConsentActive,
  consentVersion,
  consentLoading,
  handleSaveConsent,
  handleDeactivateConsent,
  loadConsent,
  consentResult,
  headingColor,
  secondaryText,
  textColor,
  darkMode
}) => {
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ color: headingColor, marginBottom: 20 }}>Marketing Consent Banner</h3>
      <p style={{ color: secondaryText, marginBottom: 16 }}>Show a one‑time consent banner on the Home page to ask users to opt in for promotional emails. Users who have already opted in will not see it.</p>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Message</label>
        <textarea placeholder="e.g., Stay updated! Get special offers and new exam notifications via email." value={consentMessage} onChange={(e) => setConsentMessage(e.target.value)} rows="3" style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', resize: 'vertical', boxSizing: 'border-box' }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Button Text</label>
        <input type="text" placeholder="e.g., Yes, Opt me in!" value={consentButtonText} onChange={(e) => setConsentButtonText(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', boxSizing: 'border-box' }} />
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: textColor, fontSize: 14 }}>
          <input type="checkbox" checked={consentActive} onChange={(e) => setConsentActive(e.target.checked)} /> Active (banner will be shown to users who haven't opted in)
        </label>
        <span style={{ color: secondaryText, fontSize: 13 }}>Version: {consentVersion}</span>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={handleSaveConsent} disabled={consentLoading} style={{ background: '#1e3c72', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', opacity: consentLoading ? 0.7 : 1 }}>{consentLoading ? 'Saving...' : 'Publish Consent Banner'}</button>
        <button onClick={handleDeactivateConsent} style={{ background: '#dc3545', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Deactivate Banner</button>
        <button onClick={loadConsent} style={{ background: '#6c757d', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Load Current</button>
      </div>
      {consentResult && <p style={{ marginTop: 16, color: '#2e7d32' }}>{consentResult}</p>}
    </div>
  );
};