// src/components/admin/tabs/ContactsTab.jsx
import React from 'react';

export const ContactsTab = ({
  contacts,
  replyingTo,
  setReplyingTo,
  replyMessage,
  setReplyMessage,
  sendingReply,
  sendReply,
  darkMode,
  secondaryText
}) => {
  return (
    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
      {contacts.map(c => (
        <div key={c._id} style={{ background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: 20, borderRadius: 12, marginBottom: 16, border: '1px solid ' + (darkMode ? '#444' : '#e0e0e0') }}>
          <p><strong>From:</strong> {c.name} ({c.email})</p>
          <p><strong>Message:</strong> {c.message}</p>
          <p><strong>Received:</strong> {new Date(c.createdAt).toLocaleString()}</p>
          {replyingTo === c._id ? (
            <div style={{ marginTop: 16 }}>
              <textarea placeholder="Type your reply here..." value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} rows="4" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: 10, fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => sendReply(c.email, c.name, c.message)} disabled={sendingReply} style={{ background: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}>{sendingReply ? 'Sending...' : 'Send Reply'}</button>
                <button onClick={() => { setReplyingTo(null); setReplyMessage(''); }} style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setReplyingTo(c._id)} style={{ marginTop: 12, background: '#1e3c72', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}>Reply to Message</button>
          )}
        </div>
      ))}
    </div>
  );
};