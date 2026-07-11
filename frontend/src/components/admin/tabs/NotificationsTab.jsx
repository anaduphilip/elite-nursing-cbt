// src/components/admin/tabs/NotificationsTab.jsx
import React from 'react';

export const NotificationsTab = ({
  notificationTitle,
  setNotificationTitle,
  notificationMessage,
  setNotificationMessage,
  sendingNotification,
  sendNotification,
  notificationStatus,
  headingColor
}) => {
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ color: headingColor, marginBottom: 20 }}>Send Push Notification to All Users</h3>
      <div style={{ marginBottom: 16 }}><input type="text" placeholder="Notification Title" value={notificationTitle} onChange={(e) => setNotificationTitle(e.target.value)} style={{ width: '100%', padding: '14px 18px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} /></div>
      <div style={{ marginBottom: 16 }}><textarea placeholder="Notification Message" value={notificationMessage} onChange={(e) => setNotificationMessage(e.target.value)} rows="4" style={{ width: '100%', padding: '14px 18px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} /></div>
      <button onClick={sendNotification} disabled={sendingNotification} style={{ background: '#ff9800', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>{sendingNotification ? 'Sending...' : 'Send Notification'}</button>
      {notificationStatus && <p style={{ marginTop: 16, color: '#2e7d32' }}>{notificationStatus}</p>}
    </div>
  );
};