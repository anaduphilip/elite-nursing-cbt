import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const ReferralTab = ({ token, darkMode, headingColor, secondaryText, textColor, cardBg }) => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [rewardDays, setRewardDays] = useState(1);
  const [actionResult, setActionResult] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/referral/stats', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/referral/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
    } catch (err) {
      console.error('Failed to fetch referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) return fetchData();
    try {
      const res = await axios.get(`/api/admin/referral/users?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.users);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const viewHistory = async (userId) => {
    try {
      const res = await axios.get(`/api/admin/referral/users/${userId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUser(res.data);
      setShowHistory(true);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const manualReward = async (userId) => {
    if (!window.confirm(`Add ${rewardDays} premium day(s) to this user?`)) return;
    setActionResult('');
    try {
      const res = await axios.post(
        `/api/admin/referral/users/${userId}/reward`,
        { days: rewardDays },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionResult(res.data.message);
      setTimeout(() => setActionResult(''), 3000);
      fetchData();
    } catch (err) {
      setActionResult('❌ Failed to reward user');
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: secondaryText }}>Loading referral data...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ color: headingColor, marginBottom: 20 }}>📊 Referral Program Dashboard</h3>

      {/* ===== Stats Cards ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: cardBg, borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#ff9800' }}>{stats?.totalReferrals || 0}</div>
          <div style={{ color: secondaryText, fontSize: 14 }}>Total Referrals</div>
        </div>
        <div style={{ background: cardBg, borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#ff9800' }}>{stats?.activeReferrers || 0}</div>
          <div style={{ color: secondaryText, fontSize: 14 }}>Active Referrers</div>
        </div>
        <div style={{ background: cardBg, borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#ff9800' }}>{stats?.totalPremiumDays || 0}</div>
          <div style={{ color: secondaryText, fontSize: 14 }}>Premium Days Given</div>
        </div>
      </div>

      {/* ===== Search & Actions ===== */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 Search by email, name, or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          style={{
            flex: 1,
            minWidth: 200,
            padding: '12px 16px',
            borderRadius: 8,
            border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
            background: darkMode ? '#2d2d3d' : 'white',
            color: textColor,
            fontSize: 14
          }}
        />
        <button
          onClick={handleSearch}
          style={{ padding: '12px 24px', background: '#1e3c72', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
        >
          Search
        </button>
        <button
          onClick={fetchData}
          style={{ padding: '12px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
        >
          🔄 Refresh
        </button>
        <button
          onClick={() => alert('Export CSV coming soon!')}
          style={{ padding: '12px 24px', background: '#ff9800', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
        >
          📥 Export CSV
        </button>
      </div>

      {actionResult && (
        <div style={{ padding: 12, background: '#e8f5e9', borderRadius: 8, marginBottom: 16, color: '#2e7d32' }}>
          {actionResult}
        </div>
      )}

      {/* ===== Users Table ===== */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: darkMode ? '#2d2d3d' : '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: `2px solid ${darkMode ? '#444' : '#ddd'}` }}>User</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: `2px solid ${darkMode ? '#444' : '#ddd'}` }}>Referral Code</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: `2px solid ${darkMode ? '#444' : '#ddd'}` }}>Friends Referred</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: `2px solid ${darkMode ? '#444' : '#ddd'}` }}>Rewards Earned</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: `2px solid ${darkMode ? '#444' : '#ddd'}` }}>Premium Days</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: `2px solid ${darkMode ? '#444' : '#ddd'}` }}>Joined</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: `2px solid ${darkMode ? '#444' : '#ddd'}` }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: secondaryText }}>No users found.</td>
              </tr>
            ) : (
              users.map((user, idx) => {
                const totalRewardDays = user.referralRewards?.reduce((sum, r) => sum + (r.value || 0), 0) || 0;
                const rewardCount = user.referralRewards?.length || 0;
                const isPremium = user.isPremium && new Date(user.premiumExpiry) > new Date();
                return (
                  <tr key={user._id} style={{ borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}` }}>
                    <td style={{ padding: '12px' }}>
                      <div><strong style={{ color: textColor }}>{user.name || 'Anonymous'}</strong></div>
                      <div style={{ fontSize: 12, color: secondaryText }}>{user.email}</div>
                      {isPremium && <span style={{ fontSize: 11, color: '#ff9800', fontWeight: 'bold' }}>⭐ Premium</span>}
                    </td>
                    <td style={{ padding: '12px', color: textColor }}>{user.referralCode || '—'}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#ff9800' }}>{user.referralCount || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: textColor }}>{rewardCount}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#28a745' }}>{totalRewardDays}</td>
                    <td style={{ padding: '12px', color: secondaryText, fontSize: 13 }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => viewHistory(user._id)}
                          style={{ padding: '6px 12px', background: '#1e3c72', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                          title="View history"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => { setSelectedUser(user._id); setRewardDays(1); /* show reward modal */ }}
                          style={{ padding: '6px 12px', background: '#ff9800', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                          title="Manual reward"
                        >
                          🎁
                        </button>
                        <button
                          onClick={() => alert('Email feature coming soon!')}
                          style={{ padding: '6px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                          title="Send email"
                        >
                          📧
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ===== History Modal ===== */}
      {showHistory && selectedUser && (
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
            maxWidth: 600,
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowHistory(false)}
              style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: secondaryText }}
            >
              ✕
            </button>
            <h3 style={{ color: headingColor, marginBottom: 16 }}>📋 Referral History</h3>
            <div style={{ marginBottom: 16 }}>
              <p><strong>Name:</strong> {selectedUser.user?.name || 'N/A'}</p>
              <p><strong>Email:</strong> {selectedUser.user?.email}</p>
              <p><strong>Referral Code:</strong> {selectedUser.user?.referralCode || '—'}</p>
              <p><strong>Total Referrals:</strong> {selectedUser.user?.referralCount || 0}</p>
              <p><strong>Rewards Earned:</strong> {selectedUser.user?.referralRewards?.length || 0}</p>
            </div>
            <h4 style={{ color: headingColor, fontSize: 16, marginBottom: 12 }}>Friends Referred</h4>
            {selectedUser.referredUsers?.length === 0 ? (
              <p style={{ color: secondaryText }}>No friends referred.</p>
            ) : (
              selectedUser.referredUsers?.map((u, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}` }}>
                  <span style={{ color: textColor }}>{u.name || 'Anonymous'}</span>
                  <span style={{ color: secondaryText, fontSize: 12, marginLeft: 12 }}>{u.email}</span>
                  <span style={{ color: secondaryText, fontSize: 12, marginLeft: 12 }}>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};