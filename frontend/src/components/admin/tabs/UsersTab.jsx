// src/components/admin/tabs/UsersTab.jsx
import React, { useState } from 'react';
import { UserProfileModal } from './UserProfileModal'; // We'll create this next

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
  token // ← NEW: passed from AdminPanel
}) => {
  // ===== NEW: State for Profile Modal =====
  const [profileUserId, setProfileUserId] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // ===== NEW: Open Profile Modal =====
  const openProfileModal = (userId) => {
    setProfileUserId(userId);
    setShowProfileModal(true);
  };

  // ===== NEW: Close Profile Modal =====
  const closeProfileModal = () => {
    setProfileUserId(null);
    setShowProfileModal(false);
  };

  return (
    <>
      {/* ===== SEARCH & FILTER (UNCHANGED) ===== */}
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

      {/* ===== USER CARDS ===== */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }}>
        {Array.isArray(filteredUsers) && filteredUsers.length > 0 ? (
          filteredUsers.map(u => {
            const currentPlan = u.isPremium ? (u.premiumPlan || 'monthly') : 'none';
            return (
              <div key={u._id} style={{ width: '350px', background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: 20, borderRadius: 12, border: '1px solid ' + (darkMode ? '#444' : '#e0e0e0'), color: textColor }}>
                {/* ===== USER INFO (UNCHANGED) ===== */}
                <p><strong>Name:</strong> {u.name || 'N/A'}</p>
                <p><strong>Email:</strong> {u.email}</p>
                <p><strong>Premium:</strong> {u.isPremium ? '✅ Yes' : '❌ No'}</p>
                {u.isPremium && <p><strong>Plan:</strong> {u.premiumPlan ? u.premiumPlan.toUpperCase() : 'N/A'}</p>}
                {u.isPremium && u.premiumExpiry && <p><strong>Expires:</strong> {new Date(u.premiumExpiry).toLocaleDateString()}</p>}
                <p><strong>Verified:</strong> {u.isVerified ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Joined:</strong> {new Date(u.createdAt).toLocaleDateString()}</p>

                {/* ===== PLAN MANAGEMENT (UNCHANGED) ===== */}
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

                {/* ===== ACTION BUTTONS (VIEW PROFILE ADDED) ===== */}
                <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                  {/* 👇 NEW: View Profile Button */}
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
                    👤 View Profile
                  </button>

                  {/* DELETE USER (UNCHANGED) */}
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

                  {/* ADJUST PREMIUM (UNCHANGED) */}
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

      {/* ===== NEW: USER PROFILE MODAL ===== */}
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