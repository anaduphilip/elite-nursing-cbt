// src/components/admin/tabs/ManualResetTab.jsx
import React from 'react';

export const ManualResetTab = ({
  resetEmail,
  setResetEmail,
  generatingResetOtp,
  generateManualResetOtp,
  resetOtpResult,
  headingColor,
  secondaryText
}) => {
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ color: headingColor, marginBottom: 20 }}>Generate Password Reset Code</h3>
      <p style={{ marginBottom: 16, color: secondaryText }}>Use this when a user cannot receive password reset email. The code will be shown here and can be given to the user.</p>
      <div style={{ marginBottom: 16 }}><input type="email" placeholder="User's email address" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} style={{ width: '100%', padding: '14px 18px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} /></div>
      <button onClick={generateManualResetOtp} disabled={generatingResetOtp} style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>{generatingResetOtp ? 'Generating...' : 'Generate Reset Code'}</button>
      {resetOtpResult && <div style={{ marginTop: 16, padding: 12, background: '#e8f5e9', borderRadius: 8, borderLeft: '4px solid #2e7d32' }}><p style={{ margin: 0, color: '#2e7d32' }}>{resetOtpResult}</p></div>}
    </div>
  );
};