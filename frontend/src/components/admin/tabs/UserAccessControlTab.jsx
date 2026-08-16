// src/components/admin/tabs/UserAccessControlTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const UserAccessControlTab = ({ token, darkMode, headingColor, secondaryText, textColor, cardBg }) => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [lockedUsers, setLockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeView, setActiveView] = useState('blocked');

  // ---- Countdown tick ----
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Block Modal states
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockEmail, setBlockEmail] = useState('');
  const [blockDuration, setBlockDuration] = useState('1h');
  const [blockReason, setBlockReason] = useState('');
  const [blockLoading, setBlockLoading] = useState(false);

  // Duration options
  const durationOptions = [
    { label: '1 minute', value: '1m' },
    { label: '5 minutes', value: '5m' },
    { label: '15 minutes', value: '15m' },
    { label: '30 minutes', value: '30m' },
    { label: '1 hour', value: '1h' },
    { label: '12 hours', value: '12h' },
    { label: '24 hours', value: '24h' },
    { label: '7 days', value: '7d' },
    { label: '30 days', value: '30d' },
    { label: 'Forever', value: 'forever' },
  ];

  const fetchData = async () => {
    setLoading(true);
    setMessage('');
    try {
      const [blockedRes, lockedRes] = await Promise.all([
        axios.get('/api/admin/blocked-users', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/admin/locked-users', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setBlockedUsers(blockedRes.data.users || []);
      setLockedUsers(lockedRes.data.users || []);
    } catch (err) {
      setMessage('❌ Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleUnblock = async (email) => {
    if (!window.confirm(`Unblock ${email}?`)) return;
    setActionLoading(true);
    try {
      const res = await axios.post('/api/admin/unblock-user',
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`✅ ${res.data.message}`);
      fetchData();
    } catch (err) {
      setMessage(`❌ Failed to unblock: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlock = async (email) => {
    if (!window.confirm(`Unlock ${email}?`)) return;
    setActionLoading(true);
    try {
      const res = await axios.post('/api/admin/unlock-user',
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`✅ ${res.data.message}`);
      fetchData();
    } catch (err) {
      setMessage(`❌ Failed to unlock: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlock = async (e) => {
    e.preventDefault();
    if (!blockEmail.trim()) {
      setMessage('❌ Please enter an email');
      return;
    }
    setBlockLoading(true);
    try {
      const res = await axios.post('/api/admin/block-user',
        {
          email: blockEmail.trim(),
          duration: blockDuration,
          reason: blockReason.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`✅ ${res.data.message}`);
      setShowBlockModal(false);
      setBlockEmail('');
      setBlockReason('');
      fetchData();
    } catch (err) {
      setMessage(`❌ Failed to block: ${err.response?.data?.error || err.message}`);
    } finally {
      setBlockLoading(false);
    }
  };

  const formatExpiry = (date) => {
    if (!date) return 'Never';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ---- Live remaining time (uses tick to recalc) ----
  const formatRemaining = (expiryDate) => {
    if (!expiryDate) return 'Never';
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - now;
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(' ');
  };

  const getDurationLabel = (value) => {
    const option = durationOptions.find(o => o.value === value);
    return option ? option.label : value;
  };

  const renderBlockedUsers = () => {
    if (blockedUsers.length === 0) {
      return <p style={{ color: secondaryText }}>No manually blocked users.</p>;
    }
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${darkMode ? '#444' : '#ddd'}` }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: headingColor }}>Name</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: headingColor }}>Email</th>
              <th style={{ textAlign: 'center', padding: '12px 8px', color: headingColor }}>Reason</th>
              <th style={{ textAlign: 'center', padding: '12px 8px', color: headingColor }}>Expires</th>
              <th style={{ textAlign: 'center', padding: '12px 8px', color: headingColor }}>Remaining</th>
              <th style={{ textAlign: 'center', padding: '12px 8px', color: headingColor }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {blockedUsers.map((user) => (
              <tr key={user._id} style={{ borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}` }}>
                <td style={{ padding: '12px 8px', color: textColor }}>{user.name || 'N/A'}</td>
                <td style={{ padding: '12px 8px', color: textColor }}>{user.email}</td>
                <td style={{ padding: '12px 8px', color: textColor, textAlign: 'center' }}>
                  {user.manualBlockReason || 'No reason provided'}
                </td>
                <td style={{ padding: '12px 8px', color: textColor, textAlign: 'center' }}>
                  {formatExpiry(user.manualBlockExpiry)}
                </td>
                <td style={{ padding: '12px 8px', color: '#ff9800', textAlign: 'center', fontWeight: 'bold' }}>
                  {formatRemaining(user.manualBlockExpiry)}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleUnblock(user.email)}
                    disabled={actionLoading}
                    style={{
                      background: '#28a745',
                      color: 'white',
                      padding: '6px 16px',
                      border: 'none',
                      borderRadius: 6,
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      opacity: actionLoading ? 0.7 : 1
                    }}
                  >
                    Unblock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 12, fontSize: 12, color: secondaryText }}>
          Total blocked: {blockedUsers.length} users
        </p>
      </div>
    );
  };

  const renderLockedUsers = () => {
    if (lockedUsers.length === 0) {
      return <p style={{ color: secondaryText }}>No temporarily locked users.</p>;
    }
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${darkMode ? '#444' : '#ddd'}` }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: headingColor }}>Name</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: headingColor }}>Email</th>
              <th style={{ textAlign: 'center', padding: '12px 8px', color: headingColor }}>Attempts</th>
              <th style={{ textAlign: 'center', padding: '12px 8px', color: headingColor }}>Locked Until</th>
              <th style={{ textAlign: 'center', padding: '12px 8px', color: headingColor }}>Remaining</th>
              <th style={{ textAlign: 'center', padding: '12px 8px', color: headingColor }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {lockedUsers.map((user) => (
              <tr key={user._id} style={{ borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}` }}>
                <td style={{ padding: '12px 8px', color: textColor }}>{user.name || 'N/A'}</td>
                <td style={{ padding: '12px 8px', color: textColor }}>{user.email}</td>
                <td style={{ padding: '12px 8px', color: '#ff9800', textAlign: 'center', fontWeight: 'bold' }}>
                  {user.loginAttempts}
                </td>
                <td style={{ padding: '12px 8px', color: textColor, textAlign: 'center' }}>
                  {formatExpiry(user.lockedUntil)}
                </td>
                <td style={{ padding: '12px 8px', color: '#ff9800', textAlign: 'center', fontWeight: 'bold' }}>
                  {formatRemaining(user.lockedUntil)}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleUnlock(user.email)}
                    disabled={actionLoading}
                    style={{
                      background: '#17a2b8',
                      color: 'white',
                      padding: '6px 16px',
                      border: 'none',
                      borderRadius: 6,
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      opacity: actionLoading ? 0.7 : 1
                    }}
                  >
                    Unlock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 12, fontSize: 12, color: secondaryText }}>
          Total locked: {lockedUsers.length} users
        </p>
      </div>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ color: headingColor, margin: 0 }}>User Access Control</h3>
        <button
          onClick={() => setShowBlockModal(true)}
          style={{
            background: '#dc3545',
            color: 'white',
            padding: '10px 24px',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 14
          }}
        >
          Block User
        </button>
      </div>

      {message && (
        <div style={{
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          background: message.includes('✅') ? '#e8f5e9' : '#ffebee',
          color: message.includes('✅') ? '#2e7d32' : '#c62828',
          border: `1px solid ${message.includes('✅') ? '#4caf50' : '#ef5350'}`
        }}>
          {message}
        </div>
      )}

      {/* View Toggle */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: `1px solid ${darkMode ? '#444' : '#ddd'}`, paddingBottom: 12 }}>
        <button
          onClick={() => setActiveView('blocked')}
          style={{
            padding: '8px 20px',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 'bold',
            background: activeView === 'blocked' ? '#1e3c72' : 'transparent',
            color: activeView === 'blocked' ? 'white' : textColor,
            borderBottom: activeView === 'blocked' ? `3px solid #1e3c72` : 'none'
          }}
        >
          Blocked Users ({blockedUsers.length})
        </button>
        <button
          onClick={() => setActiveView('locked')}
          style={{
            padding: '8px 20px',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 'bold',
            background: activeView === 'locked' ? '#1e3c72' : 'transparent',
            color: activeView === 'locked' ? 'white' : textColor,
            borderBottom: activeView === 'locked' ? `3px solid #1e3c72` : 'none'
          }}
        >
          Locked Users ({lockedUsers.length})
        </button>
      </div>

      {loading ? (
        <p style={{ color: secondaryText }}>Loading...</p>
      ) : (
        activeView === 'blocked' ? renderBlockedUsers() : renderLockedUsers()
      )}

      {/* Block User Modal */}
      {showBlockModal && (
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
            maxWidth: 450,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ color: headingColor, marginBottom: 20 }}>Block User</h3>

            <form onSubmit={handleBlock}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Email</label>
                <input
                  type="email"
                  placeholder="Enter user email"
                  value={blockEmail}
                  onChange={(e) => setBlockEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                    borderRadius: 8,
                    background: darkMode ? '#1a1a2e' : '#f8f9fa',
                    color: textColor,
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Duration</label>
                <select
                  value={blockDuration}
                  onChange={(e) => setBlockDuration(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                    borderRadius: 8,
                    background: darkMode ? '#1a1a2e' : '#f8f9fa',
                    color: textColor,
                    fontSize: 14
                  }}
                >
                  {durationOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Reason (optional)</label>
                <textarea
                  placeholder="Why is this user being blocked?"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  rows="2"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                    borderRadius: 8,
                    background: darkMode ? '#1a1a2e' : '#f8f9fa',
                    color: textColor,
                    fontSize: 14,
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  style={{
                    flex: 1,
                    background: '#6c757d',
                    color: 'white',
                    padding: '12px',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={blockLoading}
                  style={{
                    flex: 1,
                    background: '#dc3545',
                    color: 'white',
                    padding: '12px',
                    border: 'none',
                    borderRadius: 8,
                    cursor: blockLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    opacity: blockLoading ? 0.7 : 1
                  }}
                >
                  {blockLoading ? 'Blocking...' : 'Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};