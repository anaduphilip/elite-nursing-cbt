// src/components/admin/tabs/AnnouncementTab.jsx
import React from 'react';

export const AnnouncementTab = ({
  announcementMessage,
  setAnnouncementMessage,
  announcementButtonText,
  setAnnouncementButtonText,
  announcementButtonLink,
  setAnnouncementButtonLink,
  announcementActive,
  setAnnouncementActive,
  announcementVersion,
  announcementLoading,
  handleSaveAnnouncement,
  handleDeactivateAnnouncement,
  loadAnnouncement,
  announcementResult,
  headingColor,
  secondaryText,
  textColor,
  darkMode
}) => {
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ color: headingColor, marginBottom: 20 }}>One-Time Home Page Banner</h3>
      <p style={{ color: secondaryText, marginBottom: 16 }}>Create a banner that each user sees once on the home page. Update it anytime – it will reappear for all users with the new version.</p>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Message</label>
        <textarea placeholder="Enter the banner message" value={announcementMessage} onChange={(e) => setAnnouncementMessage(e.target.value)} rows="3" style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', resize: 'vertical', boxSizing: 'border-box' }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Button Text</label>
        <input type="text" placeholder="e.g., Get Premium Now" value={announcementButtonText} onChange={(e) => setAnnouncementButtonText(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', boxSizing: 'border-box' }} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Button Link</label>
        <input type="text" placeholder="/get-premium, /weekly-quiz, /contact, etc." value={announcementButtonLink} onChange={(e) => setAnnouncementButtonLink(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', boxSizing: 'border-box' }} />
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: textColor, fontSize: 14 }}>
          <input type="checkbox" checked={announcementActive} onChange={(e) => setAnnouncementActive(e.target.checked)} /> Active (banner will be shown)
        </label>
        <span style={{ color: secondaryText, fontSize: 13 }}>Version: {announcementVersion}</span>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={handleSaveAnnouncement} disabled={announcementLoading} style={{ background: '#1e3c72', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', opacity: announcementLoading ? 0.7 : 1 }}>{announcementLoading ? 'Saving...' : 'Publish Banner'}</button>
        <button onClick={handleDeactivateAnnouncement} style={{ background: '#dc3545', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Deactivate Banner</button>
        <button onClick={loadAnnouncement} style={{ background: '#6c757d', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Load Current</button>
      </div>
      {announcementResult && <p style={{ marginTop: 16, color: '#2e7d32' }}>{announcementResult}</p>}
    </div>
  );
};