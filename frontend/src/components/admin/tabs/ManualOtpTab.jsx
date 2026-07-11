// src/components/admin/tabs/ManualOtpTab.jsx
import React from 'react';

export const ManualOtpTab = ({
  manualOtpEmail,
  setManualOtpEmail,
  generatingOtp,
  generateManualOtp,
  manualOtpResult,
  headingColor,
  secondaryText
}) => {
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ color: headingColor, marginBottom: 20 }}>Generate Manual Verification Code</h3>
      <p style={{ marginBottom: 16, color: secondaryText }}>Use this only when a user cannot receive email. The code will be shown here and can be given to the user.</p>
      <div style={{ marginBottom: 16 }}><input type="email" placeholder="User's email address" value={manualOtpEmail} onChange={(e) => setManualOtpEmail(e.target.value)} style={{ width: '100%', padding: '14px 18px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} /></div>
      <button onClick={generateManualOtp} disabled={generatingOtp} style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>{generatingOtp ? 'Generating...' : 'Generate Code'}</button>
      {manualOtpResult && <div style={{ marginTop: 16, padding: 12, background: '#e8f5e9', borderRadius: 8, borderLeft: '4px solid #2e7d32' }}><p style={{ margin: 0, color: '#2e7d32' }}>{manualOtpResult}</p></div>}
    </div>
  );
};