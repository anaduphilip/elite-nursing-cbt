// src/components/admin/tabs/BroadcastTab.jsx
import React from 'react';

export const BroadcastTab = ({
  broadcastSubject,
  setBroadcastSubject,
  broadcastMessage,
  setBroadcastMessage,
  broadcastTemplate,
  setBroadcastTemplate,
  broadcastLoading,
  handleBroadcast,
  broadcastResult,
  headingColor,
  secondaryText,
  darkMode
}) => {
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ color: headingColor, marginBottom: 20 }}>Send Email Broadcast to Free Users</h3>
      <p style={{ color: secondaryText, marginBottom: 16 }}>Send a promotional email to all free users who have opted in to marketing emails.</p>
      <div style={{ marginBottom: 16 }}><input type="text" placeholder="Email Subject" value={broadcastSubject} onChange={(e) => setBroadcastSubject(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', boxSizing: 'border-box' }} /></div>
      <div style={{ marginBottom: 16 }}><textarea placeholder="Custom Message (optional – if empty, uses template)" value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} rows="4" style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', resize: 'vertical', boxSizing: 'border-box' }} /></div>
      <div style={{ marginBottom: 16 }}>
        <select value={broadcastTemplate} onChange={(e) => setBroadcastTemplate(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : 'white', color: darkMode ? 'white' : '#333' }}>
          <option value="upgrade">Upgrade Reminder</option>
          <option value="reminder">Re-engagement</option>
          <option value="winback">Win-back</option>
        </select>
      </div>
      <button onClick={handleBroadcast} disabled={broadcastLoading} style={{ background: '#1e3c72', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', opacity: broadcastLoading ? 0.7 : 1 }}>{broadcastLoading ? 'Sending...' : 'Send Broadcast'}</button>
      {broadcastResult && <p style={{ marginTop: 16, color: '#2e7d32' }}>{broadcastResult}</p>}
    </div>
  );
};