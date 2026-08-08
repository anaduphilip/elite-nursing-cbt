// src/components/admin/tabs/UsersTab.jsx
import React, { useState } from 'react';
import { UserProfileModal } from './UserProfileModal';

export const UsersTab = ({
  users,
  filteredUsers,
  searchQuery,
  setSearchQuery,
  userFilter,
  setUserFilter,
  selectedPlan,
  setSelectedPlan,
  applyPlan,
  deleteUser,
  setAdjustUserId,
  setShowAdjustModal,
  darkMode,
  headingColor,
  secondaryText,
  textColor,
  cardBg,
  token,
  onRestoreHistory,
  onAwardBadge,
  availableBadges = [],
  restoringUserId = null,
  awardingUserId = null,
  deletedHistoryCount = {}
}) => {
  const [profileUserId, setProfileUserId] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const openProfileModal = (userId) => {
    setProfileUserId(userId);
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setProfileUserId(null);
    setShowProfileModal(false);
  };

  // ===== NEW: handle badge selection per user =====
  const [selectedBadge, setSelectedBadge] = useState({});

  return (
    <>
      {/* SEARCH & FILTER (UNCHANGED) */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="🔍 Search by email..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          style={{ width: '100%', maxWidth: 400, padding: '10px 16px', borderRadius: 30, border: `1px solid ${darkMode ? '#444' : '#ddd'}`, background: darkMode ? '#2d2d3d' : 'white', color: textColor, fontSize: 14, outline: 'none' }} 
        />
        <select 
          value={userFilter} 
          onChange={(e) => setUserFilter(e.target.value)} 
          style={{ padding: '10px 16px', borderRadius: 30, border: `1px solid ${darkMode ? '#444' : '#ddd'}`, background: darkMode ? '#2d2d3d' : 'white', color: textColor, fontSize: 14, outline: 'none' }}
        >
          <option value="all">All Users</option>
          <option value="premium">Premium Users</option>
          <option value="free">Free Users</option>
        </select>
      </div>

      {/* USER CARDS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }}>
        {Array.isArray(filteredUsers) && filteredUsers.length > 0 ? (
          filteredUsers.map(u => {
            const currentPlan = u.isPremium ? (u.premiumPlan || 'monthly') : 'none';
            const hasDeleted = (deletedHistoryCount && deletedHistoryCount[u._id] > 0);
            return (
              <div key={u._id} style={{ width: '350px', background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: 20, borderRadius: 12, border: '1px solid ' + (darkMode ? '#444' : '#e0e0e0'), color: textColor }}>
                {/* USER INFO (UNCHANGED) */}
                <p><strong>Name:</strong> {u.name || 'N/A'}</p>
                <p><strong>Email:</strong> {u.email}</p>
                <p><strong>Premium:</strong> {u.isPremium ? '✅ Yes' : '❌ No'}</p>
                {u.isPremium && <p><strong>Plan:</strong> {u.premiumPlan ? u.premiumPlan.toUpperCase() : 'N/A'}</p>}
                {u.isPremium && u.premiumExpiry && <p><strong>Expires:</strong> {new Date(u.premiumExpiry).toLocaleDateString()}</p>}
                <p><strong>Verified:</strong> {u.isVerified ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Joined:</strong> {new Date(u.createdAt).toLocaleDateString()}</p>

                {/* PLAN MANAGEMENT (UNCHANGED) */}
                <div style={{ marginTop: 15 }}>
                  <label style={{ fontSize: 13, fontWeight: 'bold', display: 'block', marginBottom: 4, color: textColor }}>Set Premium Plan:</label>
                  <select 
                    value={selectedPlan[u._id] || currentPlan} 
                    onChange={(e) => setSelectedPlan(prev => ({ ...prev, [u._id]: e.target.value }))} 
                    style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #ccc', background: cardBg, fontSize: 14, color: textColor }}
                  >
                    <option value="none">None (Remove Premium)</option>
                    <option value="daily">Daily (₦500)</option>
                    <option value="monthly">Monthly (₦2000)</option>
                    <option value="yearly">Yearly (₦10000)</option>
                  </select>
                  <button 
                    onClick={() => applyPlan(u._id)} 
                    style={{ width: '100%', marginTop: 6, background: '#1e3c72', color: 'white', border: 'none', padding: '8px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}
                  >
                    Apply Plan
                  </button>
                </div>

                {/* ===== NEW: ADMIN EXTRA ACTIONS ===== */}
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Restore History button (only if deleted history exists) */}
                  {onRestoreHistory && hasDeleted && (
                    <button
                      onClick={() => onRestoreHistory(u._id)}
                      disabled={restoringUserId === u._id}
                      style={{
                        width: '100%',
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: 'none',
                        background: restoringUserId === u._id ? '#ccc' : '#28a745',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: 13,
                        cursor: restoringUserId === u._id ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {restoringUserId === u._id ? 'Restoring...' : '↩️ Restore Deleted History'}
                    </button>
                  )}

                  {/* Award Badge dropdown + button */}
                  {onAwardBadge && availableBadges.length > 0 && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select
                        value={selectedBadge[u._id] || (availableBadges[0]?._id || '')}
                        onChange={(e) => setSelectedBadge(prev => ({ ...prev, [u._id]: e.target.value }))}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: '1px solid #ccc',
                          background: darkMode ? '#2d2d3d' : 'white',
                          color: textColor,
                          fontSize: 13
                        }}
                      >
                        {availableBadges.map(b => (
                          <option key={b._id} value={b._id}>{b.icon} {b.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const badgeId = selectedBadge[u._id] || availableBadges[0]?._id;
                          if (badgeId) onAwardBadge(u._id, badgeId);
                        }}
                        disabled={awardingUserId === u._id}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 6,
                          border: 'none',
                          background: awardingUserId === u._id ? '#ccc' : '#ff9800',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: 13,
                          cursor: awardingUserId === u._id ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {awardingUserId === u._id ? '...' : '🏅 Award'}
                      </button>
                    </div>
                  )}
                </div>

                {/* ACTION BUTTONS (UNCHANGED) */}
                <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => openProfileModal(u._id)} 
                    style={{ 
                      flex: 1,
                      background: '#17a2b8', 
                      color: 'white', 
                      padding: '8px 16px', 
                      border: 'none', 
                      borderRadius: 6, 
                      cursor: 'pointer', 
                      fontSize: 13, 
                      fontWeight: 'bold' 
                    }}
                  >
                    View Profile
                  </button>

                  <button 
                    onClick={() => deleteUser(u._id)} 
                    style={{ 
                      flex: 1,
                      background: '#dc3545', 
                      color: 'white', 
                      padding: '8px 16px', 
                      border: 'none', 
                      borderRadius: 6, 
                      cursor: 'pointer', 
                      fontSize: 13, 
                      fontWeight: 'bold' 
                    }}
                  >
                    Delete User
                  </button>

                  <button 
                    onClick={() => { setAdjustUserId(u._id); setShowAdjustModal(true); }} 
                    style={{ 
                      flex: 1,
                      background: '#ff9800', 
                      color: 'white', 
                      padding: '8px 16px', 
                      border: 'none', 
                      borderRadius: 6, 
                      cursor: 'pointer', 
                      fontSize: 13, 
                      fontWeight: 'bold' 
                    }}
                  >
                    Adjust Premium
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p style={{ textAlign: 'center', color: secondaryText, marginTop: 20 }}>No users found.</p>
        )}
      </div>

      {/* USER PROFILE MODAL (UNCHANGED) */}
      {showProfileModal && profileUserId && (
        <UserProfileModal
          userId={profileUserId}
          onClose={closeProfileModal}
          darkMode={darkMode}
          headingColor={headingColor}
          secondaryText={secondaryText}
          textColor={textColor}
          cardBg={cardBg}
          token={token}
        />
      )}
    </>
  );
};