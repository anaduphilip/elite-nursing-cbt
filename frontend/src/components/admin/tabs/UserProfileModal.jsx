// src/components/admin/tabs/UserProfileModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const UserProfileModal = ({ userId, onClose, darkMode, headingColor, secondaryText, textColor, cardBg, token }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState('');
  const [buttonText, setButtonText] = useState('Learn More');
  const [buttonLink, setButtonLink] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState('');

  // ===== FETCH USER DATA =====
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(res.data.user);
        setStats(res.data.stats);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchUserData();
  }, [userId, token]);

  // ===== SEND PRIVATE MESSAGE =====
  const sendPrivateMessage = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }
    setSending(true);
    setSendResult('');
    try {
      const res = await axios.post(
        `/api/admin/users/${userId}/message`,
        {
          message: message.trim(),
          buttonText: buttonText.trim() || 'Learn More',
          buttonLink: buttonLink.trim() || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setSendResult('✅ Message sent successfully!');
        setMessage('');
        setButtonText('Learn More');
        setButtonLink('');
      }
    } catch (err) {
      setSendResult('❌ Failed to send message: ' + (err.response?.data?.error || err.message));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}>
        <div style={{ background: cardBg, borderRadius: 20, padding: 40, textAlign: 'center' }}>
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

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
        maxWidth: 700,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        {/* ===== CLOSE BUTTON ===== */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 16,
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: secondaryText,
            zIndex: 10
          }}
        >
          ✕
        </button>

        <h2 style={{ color: headingColor, fontSize: 22, marginBottom: 20 }}>User Profile</h2>

        {/* ===== USER INFO ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div><strong>Name:</strong> <span style={{ color: textColor }}>{userData.name || 'N/A'}</span></div>
          <div><strong>Email:</strong> <span style={{ color: textColor }}>{userData.email}</span></div>
          <div><strong>Premium:</strong> <span style={{ color: userData.isPremium ? '#2e7d32' : '#dc3545' }}>{userData.isPremium ? '✅ Active' : '❌ Inactive'}</span></div>
          {userData.isPremium && (
            <>
              <div><strong>Plan:</strong> <span style={{ color: textColor }}>{userData.premiumPlan?.toUpperCase() || 'N/A'}</span></div>
              <div><strong>Expires:</strong> <span style={{ color: textColor }}>{userData.premiumExpiry ? new Date(userData.premiumExpiry).toLocaleDateString() : 'N/A'}</span></div>
            </>
          )}
          <div><strong>Verified:</strong> <span style={{ color: userData.isVerified ? '#2e7d32' : '#ff9800' }}>{userData.isVerified ? '✅ Yes' : '⚠️ No'}</span></div>
          <div><strong>Joined:</strong> <span style={{ color: textColor }}>{new Date(userData.createdAt).toLocaleDateString()}</span></div>
        </div>

        {/* ===== STATS ===== */}
        {stats && (
          <div style={{ marginBottom: 20, padding: 16, background: darkMode ? '#1a1a2e' : '#f0f7f4', borderRadius: 12 }}>
            <h3 style={{ color: headingColor, fontSize: 16, marginBottom: 12 }}>📊 Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12 }}>
              <div><strong>Exams:</strong> <span style={{ color: textColor }}>{stats.totalExams || 0}</span></div>
              <div><strong>Pass Rate:</strong> <span style={{ color: '#ff9800', fontWeight: 'bold' }}>{stats.passRate || 0}%</span></div>
              <div><strong>Streak:</strong> <span style={{ color: '#ff9800', fontWeight: 'bold' }}>🔥 {stats.streak || 0} days</span></div>
              <div><strong>Badges:</strong> <span style={{ color: textColor }}>🏆 {stats.badgesCount || 0}</span></div>
            </div>
            {stats.badges && stats.badges.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {stats.badges.map((badge, idx) => (
                  <span key={idx} style={{ fontSize: 14 }} title={badge.name}>{badge.icon}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== SEND PRIVATE MESSAGE ===== */}
        <div style={{ marginBottom: 16, paddingTop: 16, borderTop: `1px solid ${darkMode ? '#444' : '#e0e0e0'}` }}>
          <h3 style={{ color: headingColor, fontSize: 16, marginBottom: 12 }}>Send Private Message</h3>
          <p style={{ color: secondaryText, fontSize: 13, marginBottom: 12 }}>
            This message will appear as a one‑time banner on the user's Home page.
          </p>
          <textarea
            placeholder="Enter your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows="3"
            style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: textColor, resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input
              type="text"
              placeholder="Button Text (e.g. Learn More)"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              style={{ padding: '10px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: textColor }}
            />
            <input
              type="text"
              placeholder="Button Link (e.g. /get-premium)"
              value={buttonLink}
              onChange={(e) => setButtonLink(e.target.value)}
              style={{ padding: '10px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: textColor }}
            />
          </div>
          {sendResult && (
            <p style={{ marginTop: 10, color: sendResult.includes('✅') ? '#2e7d32' : '#dc3545', fontSize: 13 }}>{sendResult}</p>
          )}
          <button
            onClick={sendPrivateMessage}
            disabled={sending || !message.trim()}
            style={{
              marginTop: 12,
              width: '100%',
              background: sending || !message.trim() ? '#ccc' : '#1e3c72',
              color: 'white',
              padding: '12px',
              border: 'none',
              borderRadius: 8,
              cursor: sending || !message.trim() ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: 14,
              opacity: sending || !message.trim() ? 0.7 : 1
            }}
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
};