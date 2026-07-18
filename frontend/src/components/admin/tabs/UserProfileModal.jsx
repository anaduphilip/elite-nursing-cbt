// src/components/admin/tabs/UserProfileModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const UserProfileModal = ({ userId, onClose, darkMode, headingColor, secondaryText, textColor, cardBg, token }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [buttonText, setButtonText] = useState('Learn More');
  const [buttonLink, setButtonLink] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState('');

  // ===== NEW: Admin Action States =====
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

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
        setTransactions(res.data.transactions || []);
        setQuizHistory(res.data.quizHistory || []);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchUserData();
  }, [userId, token]);

  // ===== SEND PRIVATE MESSAGE (EXISTING - UNCHANGED) =====
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

  // ===== NEW: FORCE LOGOUT =====
  const handleForceLogout = async () => {
    if (!window.confirm('Force logout this user from all devices?')) return;
    setActionLoading(true);
    setActionResult('');
    try {
      const res = await axios.post(
        `/api/admin/users/${userId}/force-logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionResult('✅ User logged out from all devices.');
    } catch (err) {
      setActionResult('❌ Failed to force logout: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // ===== NEW: RESET STREAK =====
  const handleResetStreak = async () => {
    if (!window.confirm('Reset this user\'s streak to 0?')) return;
    setActionLoading(true);
    setActionResult('');
    try {
      const res = await axios.post(
        `/api/admin/users/${userId}/reset-streak`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setActionResult('✅ Streak reset to 0.');
        setStats(prev => ({ ...prev, streak: 0 }));
      }
    } catch (err) {
      setActionResult('❌ Failed to reset streak: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // ===== NEW: BAN / UNBAN =====
  const handleToggleBan = async () => {
    const action = userData?.isBanned ? 'unban' : 'ban';
    if (!window.confirm(`${action} this user?`)) return;
    setActionLoading(true);
    setActionResult('');
    try {
      const res = await axios.post(
        `/api/admin/users/${userId}/toggle-ban`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setActionResult(`✅ User ${res.data.isBanned ? 'banned' : 'unbanned'}.`);
        setUserData(prev => ({ ...prev, isBanned: res.data.isBanned }));
      }
    } catch (err) {
      setActionResult('❌ Failed to toggle ban: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // ===== NEW: SOFT DELETE / RESTORE =====
  const handleToggleDelete = async () => {
    const action = userData?.isDeleted ? 'restore' : 'delete';
    if (!window.confirm(`${action} this user? This can be undone.`)) return;
    setActionLoading(true);
    setActionResult('');
    try {
      const res = await axios.post(
        `/api/admin/users/${userId}/toggle-delete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setActionResult(`✅ User ${res.data.isDeleted ? 'deleted' : 'restored'}.`);
        setUserData(prev => ({ ...prev, isDeleted: res.data.isDeleted }));
      }
    } catch (err) {
      setActionResult('❌ Failed to toggle delete: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // ===== NEW: RESEND VERIFICATION EMAIL =====
  const handleResendVerification = async () => {
    setActionLoading(true);
    setActionResult('');
    try {
      await axios.post('/api/send-verification', {
        email: userData.email,
        name: userData.name
      });
      setActionResult('✅ Verification email sent successfully!');
    } catch (err) {
      setActionResult('❌ Failed to send verification: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // ===== NEW: SEND DIRECT EMAIL =====
  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert('Please enter both subject and message.');
      return;
    }
    setSendingEmail(true);
    try {
      const res = await axios.post(
        `/api/admin/users/${userId}/send-email`,
        {
          subject: emailSubject.trim(),
          body: emailBody.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        alert('✅ Email sent successfully!');
        setShowEmailModal(false);
        setEmailSubject('');
        setEmailBody('');
      }
    } catch (err) {
      alert('❌ Failed to send email: ' + (err.response?.data?.error || err.message));
    } finally {
      setSendingEmail(false);
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

  const isBanned = userData.isBanned || false;
  const isDeleted = userData.isDeleted || false;

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
        maxWidth: 800,
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

        {/* ===== USER INFO (EXISTING - UNCHANGED) ===== */}
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
          {/* ===== NEW: Ban & Delete Status ===== */}
          <div><strong>Status:</strong> <span style={{ color: isDeleted ? '#dc3545' : (isBanned ? '#ff9800' : '#2e7d32') }}>
            {isDeleted ? '🗑️ Deleted' : (isBanned ? '🚫 Banned' : '✅ Active')}
          </span></div>
        </div>

        {/* ===== STATS (EXISTING - UNCHANGED) ===== */}
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

        {/* ===== NEW: TRANSACTION HISTORY ===== */}
        {transactions.length > 0 && (
          <div style={{ marginBottom: 20, padding: 16, background: darkMode ? '#1a1a2e' : '#f0f7f4', borderRadius: 12 }}>
            <h3 style={{ color: headingColor, fontSize: 16, marginBottom: 12 }}>💰 Transaction History</h3>
            <div style={{ maxHeight: 150, overflowY: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${darkMode ? '#444' : '#ddd'}` }}>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Plan</th>
                    <th style={{ textAlign: 'right', padding: '4px 8px' }}>Amount</th>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}` }}>
                      <td style={{ padding: '4px 8px', color: textColor }}>{new Date(t.date).toLocaleDateString()}</td>
                      <td style={{ padding: '4px 8px', color: textColor }}>{t.planType || 'N/A'}</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', color: '#ff9800' }}>₦{t.amount}</td>
                      <td style={{ padding: '4px 8px', color: t.status === 'completed' ? '#2e7d32' : '#ff9800' }}>
                        {t.status === 'completed' ? '✅ Completed' : '⏳ Pending'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== NEW: QUIZ HISTORY ===== */}
        {quizHistory.length > 0 && (
          <div style={{ marginBottom: 20, padding: 16, background: darkMode ? '#1a1a2e' : '#f0f7f4', borderRadius: 12 }}>
            <h3 style={{ color: headingColor, fontSize: 16, marginBottom: 12 }}>📝 Quiz History</h3>
            <div style={{ maxHeight: 150, overflowY: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${darkMode ? '#444' : '#ddd'}` }}>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Quiz</th>
                    <th style={{ textAlign: 'center', padding: '4px 8px' }}>Score</th>
                    <th style={{ textAlign: 'center', padding: '4px 8px' }}>%</th>
                    <th style={{ textAlign: 'center', padding: '4px 8px' }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {quizHistory.map((q, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}` }}>
                      <td style={{ padding: '4px 8px', color: textColor }}>{new Date(q.date).toLocaleDateString()}</td>
                      <td style={{ padding: '4px 8px', color: textColor }}>{q.quizTitle || q.quizId || 'Unknown'}</td>
                      <td style={{ padding: '4px 8px', textAlign: 'center', color: textColor }}>{q.score}/{q.total}</td>
                      <td style={{ padding: '4px 8px', textAlign: 'center', color: q.percentage >= 70 ? '#2e7d32' : '#dc3545' }}>
                        {q.percentage?.toFixed(0)}%
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center', color: q.percentage >= 70 ? '#2e7d32' : '#dc3545' }}>
                        {q.percentage >= 70 ? '✅ Pass' : '❌ Fail'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== NEW: ADMIN ACTIONS SECTION ===== */}
        <div style={{ marginBottom: 16, paddingTop: 16, borderTop: `1px solid ${darkMode ? '#444' : '#e0e0e0'}` }}>
          <h3 style={{ color: headingColor, fontSize: 16, marginBottom: 12 }}>Admin Actions</h3>
          {actionResult && (
            <p style={{ marginBottom: 10, color: actionResult.includes('✅') ? '#2e7d32' : '#dc3545', fontSize: 13 }}>
              {actionResult}
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {/* Force Logout */}
            <button
              onClick={handleForceLogout}
              disabled={actionLoading}
              style={{ padding: '10px', borderRadius: 8, border: 'none', cursor: actionLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: 13, background: '#dc3545', color: 'white' }}
            >
              Force Logout
            </button>

            {/* Reset Streak */}
            <button
              onClick={handleResetStreak}
              disabled={actionLoading}
              style={{ padding: '10px', borderRadius: 8, border: 'none', cursor: actionLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: 13, background: '#ff9800', color: 'white' }}
            >
              Reset Streak
            </button>

            {/* Ban / Unban */}
            <button
              onClick={handleToggleBan}
              disabled={actionLoading}
              style={{ padding: '10px', borderRadius: 8, border: 'none', cursor: actionLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: 13, background: isBanned ? '#28a745' : '#dc3545', color: 'white' }}
            >
              {isBanned ? 'Unban User' : 'Ban User'}
            </button>

            {/* Soft Delete / Restore */}
            <button
              onClick={handleToggleDelete}
              disabled={actionLoading}
              style={{ padding: '10px', borderRadius: 8, border: 'none', cursor: actionLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: 13, background: isDeleted ? '#28a745' : '#6c757d', color: 'white' }}
            >
              {isDeleted ? 'Restore User' : 'Soft Delete'}
            </button>

            {/* Resend Verification */}
            <button
              onClick={handleResendVerification}
              disabled={actionLoading}
              style={{ padding: '10px', borderRadius: 8, border: 'none', cursor: actionLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: 13, background: '#1e3c72', color: 'white' }}
            >
              Resend Verification
            </button>

            {/* Send Direct Email */}
            <button
              onClick={() => setShowEmailModal(true)}
              style={{ padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 13, background: '#ff9800', color: 'white' }}
            >
              Send Email
            </button>
          </div>
        </div>

        {/* ===== SEND PRIVATE MESSAGE (EXISTING - UNCHANGED) ===== */}
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

      {/* ===== NEW: EMAIL MODAL ===== */}
      {showEmailModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: 20
        }}>
          <div style={{
            background: cardBg,
            borderRadius: 20,
            padding: 28,
            maxWidth: 550,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ color: headingColor, fontSize: 18, marginBottom: 20 }}>📧 Send Email to {userData.name}</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Subject</label>
              <input
                type="text"
                placeholder="Email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: textColor }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Message</label>
              <textarea
                placeholder="Your email message..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows="6"
                style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: textColor, resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowEmailModal(false)}
                style={{ flex: 1, background: '#6c757d', color: 'white', padding: '12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                style={{ flex: 1, background: sendingEmail ? '#ccc' : '#ff9800', color: 'white', padding: '12px', border: 'none', borderRadius: 8, cursor: sendingEmail ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: sendingEmail ? 0.7 : 1 }}
              >
                {sendingEmail ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};