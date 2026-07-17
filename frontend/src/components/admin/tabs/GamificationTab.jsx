// src/components/admin/tabs/GamificationTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const GamificationTab = ({ darkMode, headingColor, secondaryText, textColor, cardBg, token }) => {
  // ===== State =====
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  // ===== Feature Toggles =====
  const [settings, setSettings] = useState({
    enableStreaks: true,
    enableBadges: true,
    showBadgesOnHome: true,
    showStreakOnHome: true,
    streakResetHours: 24,
    streakFreezeDays: 0
  });

  // ===== Badges =====
  const [badges, setBadges] = useState([]);
  const [badgeForm, setBadgeForm] = useState({
    name: '',
    icon: '🏅',
    description: '',
    requirementType: 'total_exams',
    targetCategory: '',
    requirementValue: '',
    active: true
  });
  const [editingBadgeId, setEditingBadgeId] = useState(null);
  const [badgeLoading, setBadgeLoading] = useState(false);

  // ===== Badge Requirement Types =====
  const requirementTypes = [
    { value: 'total_exams', label: 'Total Exams Completed' },
    { value: 'category_exams', label: 'Exams in a Category' },
    { value: 'streak_days', label: 'Streak Days' },
    { value: 'perfect_score', label: 'Perfect Score (100%)' },
    { value: 'category_perfect', label: 'Perfect Score in X Categories' },
    { value: 'pass_rate', label: 'Pass Rate (%)' },
    { value: 'retake_improve', label: 'Retake Improvement' },
    { value: 'premium', label: 'Premium Member' },
    { value: 'first_exam', label: 'First Exam' }
  ];

  // ===== Categories for dropdown =====
  const [categories, setCategories] = useState([]);

  // ===== Fetch categories =====
  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      if (res.data.success) {
        setCategories(res.data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // ===== Fetch badges =====
  const fetchBadges = async () => {
    setBadgeLoading(true);
    try {
      const res = await axios.get('/api/admin/badges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setBadges(res.data.badges || []);
      }
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    } finally {
      setBadgeLoading(false);
    }
  };

  // ===== Fetch settings =====
  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/admin/gamification-settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSettings(res.data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchBadges();
    fetchSettings();
  }, []);

  // ===== Save settings =====
  const handleSaveSettings = async () => {
    setLoading(true);
    setResult('');
    try {
      const res = await axios.put('/api/admin/gamification-settings', settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSettings(res.data.settings);
        setResult('✅ Settings updated successfully!');
      }
    } catch (error) {
      setResult('❌ Failed to update settings: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // ===== Save badge =====
  const handleSaveBadge = async () => {
    if (!badgeForm.name.trim() || !badgeForm.requirementValue) {
      setResult('❌ Name and requirement value are required');
      return;
    }
    setBadgeLoading(true);
    setResult('');
    try {
      const payload = {
        name: badgeForm.name.trim(),
        icon: badgeForm.icon || '🏅',
        description: badgeForm.description || '',
        requirementType: badgeForm.requirementType,
        targetCategory: badgeForm.requirementType === 'category_exams' ? badgeForm.targetCategory : undefined,
        requirementValue: parseFloat(badgeForm.requirementValue),
        active: badgeForm.active
      };
      let res;
      if (editingBadgeId) {
        res = await axios.put(`/api/admin/badges/${editingBadgeId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        res = await axios.post('/api/admin/badges', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      if (res.data.success) {
        setResult(editingBadgeId ? '✅ Badge updated!' : '✅ Badge created!');
        resetBadgeForm();
        await fetchBadges();
      }
    } catch (error) {
      setResult('❌ Failed to save badge: ' + (error.response?.data?.error || error.message));
    } finally {
      setBadgeLoading(false);
    }
  };

  const resetBadgeForm = () => {
    setBadgeForm({
      name: '',
      icon: '🏅',
      description: '',
      requirementType: 'total_exams',
      targetCategory: '',
      requirementValue: '',
      active: true
    });
    setEditingBadgeId(null);
  };

  const editBadge = (badge) => {
    setBadgeForm({
      name: badge.name,
      icon: badge.icon || '🏅',
      description: badge.description || '',
      requirementType: badge.requirementType,
      targetCategory: badge.targetCategory || '',
      requirementValue: badge.requirementValue,
      active: badge.active
    });
    setEditingBadgeId(badge._id);
  };

  const handleDeleteBadge = async (id) => {
    if (!window.confirm('Delete this badge permanently?')) return;
    setBadgeLoading(true);
    try {
      await axios.delete(`/api/admin/badges/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult('✅ Badge deleted');
      await fetchBadges();
    } catch (error) {
      setResult('❌ Failed to delete badge: ' + (error.response?.data?.error || error.message));
    } finally {
      setBadgeLoading(false);
    }
  };

  const handleToggleBadgeActive = async (id, currentStatus) => {
    try {
      const res = await axios.patch(`/api/admin/badges/${id}/toggle-active`, 
        { active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setResult(`✅ Badge ${!currentStatus ? 'activated' : 'deactivated'}`);
        await fetchBadges();
      }
    } catch (error) {
      setResult('❌ Failed to toggle badge status');
    }
  };

  const getRequirementLabel = (type) => {
    const found = requirementTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getCategoryName = (catId) => {
    const cat = categories.find(c => c._id === catId);
    return cat ? cat.name : catId;
  };

  return (
    <div style={{ padding: '10px 0' }}>
      {/* ===== Feature Toggles ===== */}
      <div style={{
        background: darkMode ? '#1a1a2e' : '#f8f9fa',
        padding: '20px 24px',
        borderRadius: 16,
        marginBottom: 28,
        border: `1px solid ${darkMode ? '#444' : '#ddd'}`
      }}>
        <h4 style={{ color: headingColor, marginBottom: 16, fontSize: 18 }}>⚙️ Gamification Settings</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: textColor, fontSize: 14, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.enableStreaks}
              onChange={(e) => setSettings({ ...settings, enableStreaks: e.target.checked })}
            />
            Enable Streaks
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: textColor, fontSize: 14, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.enableBadges}
              onChange={(e) => setSettings({ ...settings, enableBadges: e.target.checked })}
            />
            Enable Badges
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: textColor, fontSize: 14, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.showBadgesOnHome}
              onChange={(e) => setSettings({ ...settings, showBadgesOnHome: e.target.checked })}
            />
            Show Badges on Home
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: textColor, fontSize: 14, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.showStreakOnHome}
              onChange={(e) => setSettings({ ...settings, showStreakOnHome: e.target.checked })}
            />
            Show Streak on Home
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>
              Streak Reset Hours (default: 24)
            </label>
            <input
              type="number"
              min="1"
              value={settings.streakResetHours}
              onChange={(e) => setSettings({ ...settings, streakResetHours: parseInt(e.target.value) || 24 })}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #ccc',
                borderRadius: 8,
                fontSize: 14,
                background: darkMode ? '#1a1a2e' : 'white',
                color: darkMode ? 'white' : '#333',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>
              Streak Freeze Days (0 = disabled)
            </label>
            <input
              type="number"
              min="0"
              value={settings.streakFreezeDays}
              onChange={(e) => setSettings({ ...settings, streakFreezeDays: parseInt(e.target.value) || 0 })}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #ccc',
                borderRadius: 8,
                fontSize: 14,
                background: darkMode ? '#1a1a2e' : 'white',
                color: darkMode ? 'white' : '#333',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={loading}
          style={{
            padding: '10px 24px',
            background: '#1e3c72',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            opacity: loading ? 0.7 : 1,
            fontSize: 14
          }}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
        {result && <p style={{ marginTop: 12, color: '#2e7d32' }}>{result}</p>}
      </div>

      {/* ===== Badge Management ===== */}
      <div style={{
        background: darkMode ? '#1a1a2e' : '#f8f9fa',
        padding: '20px 24px',
        borderRadius: 16,
        marginBottom: 28,
        border: `1px solid ${darkMode ? '#444' : '#ddd'}`
      }}>
        <h4 style={{ color: headingColor, marginBottom: 16, fontSize: 18 }}>
          {editingBadgeId ? '✏️ Edit Badge' : '🏅 Create New Badge'}
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Badge Name *</label>
            <input
              type="text"
              placeholder="e.g., Bronze Learner"
              value={badgeForm.name}
              onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #ccc',
                borderRadius: 8,
                fontSize: 14,
                background: darkMode ? '#1a1a2e' : 'white',
                color: darkMode ? 'white' : '#333',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Icon (emoji)</label>
            <input
              type="text"
              placeholder="🏅"
              value={badgeForm.icon}
              onChange={(e) => setBadgeForm({ ...badgeForm, icon: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #ccc',
                borderRadius: 8,
                fontSize: 14,
                background: darkMode ? '#1a1a2e' : 'white',
                color: darkMode ? 'white' : '#333',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Description</label>
            <input
              type="text"
              placeholder="e.g., Completed 10 exams"
              value={badgeForm.description}
              onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #ccc',
                borderRadius: 8,
                fontSize: 14,
                background: darkMode ? '#1a1a2e' : 'white',
                color: darkMode ? 'white' : '#333',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Requirement Type *</label>
            <select
              value={badgeForm.requirementType}
              onChange={(e) => setBadgeForm({ ...badgeForm, requirementType: e.target.value, targetCategory: '' })}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #ccc',
                borderRadius: 8,
                fontSize: 14,
                background: darkMode ? '#1a1a2e' : 'white',
                color: darkMode ? 'white' : '#333',
                boxSizing: 'border-box'
              }}
            >
              {requirementTypes.map(rt => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Requirement Value *</label>
            <input
              type="number"
              min="1"
              placeholder="e.g., 10"
              value={badgeForm.requirementValue}
              onChange={(e) => setBadgeForm({ ...badgeForm, requirementValue: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #ccc',
                borderRadius: 8,
                fontSize: 14,
                background: darkMode ? '#1a1a2e' : 'white',
                color: darkMode ? 'white' : '#333',
                boxSizing: 'border-box'
              }}
            />
          </div>
          {badgeForm.requirementType === 'category_exams' && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Target Category *</label>
              <select
                value={badgeForm.targetCategory}
                onChange={(e) => setBadgeForm({ ...badgeForm, targetCategory: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  fontSize: 14,
                  background: darkMode ? '#1a1a2e' : 'white',
                  color: darkMode ? 'white' : '#333',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: textColor, fontSize: 14, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={badgeForm.active}
                onChange={(e) => setBadgeForm({ ...badgeForm, active: e.target.checked })}
              />
              Active
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleSaveBadge}
            disabled={badgeLoading}
            style={{
              padding: '10px 24px',
              background: '#2E7D64',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: badgeLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              opacity: badgeLoading ? 0.7 : 1,
              fontSize: 14
            }}
          >
            {badgeLoading ? 'Saving...' : (editingBadgeId ? 'Update Badge' : 'Create Badge')}
          </button>
          {editingBadgeId && (
            <button
              onClick={resetBadgeForm}
              style={{
                padding: '10px 24px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 14
              }}
            >
              Cancel
            </button>
          )}
        </div>
        {result && <p style={{ marginTop: 12, color: '#2e7d32' }}>{result}</p>}
      </div>

      {/* ===== Badge List ===== */}
      <div style={{
        background: darkMode ? '#1a1a2e' : '#f8f9fa',
        padding: '20px 24px',
        borderRadius: 16,
        border: `1px solid ${darkMode ? '#444' : '#ddd'}`
      }}>
        <h4 style={{ color: headingColor, marginBottom: 16, fontSize: 18 }}>
          📋 All Badges ({badges.length})
        </h4>

        {badgeLoading && <p style={{ color: secondaryText }}>Loading badges...</p>}

        {badges.length === 0 && !badgeLoading && (
          <p style={{ color: secondaryText }}>No badges created yet. Create your first badge above!</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {badges.map(badge => (
            <div key={badge._id} style={{
              background: darkMode ? '#2d2d3d' : 'white',
              padding: '16px 18px',
              borderRadius: 12,
              border: `1px solid ${badge.active ? '#4caf50' : '#dc3545'}`,
              opacity: badge.active ? 1 : 0.6
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 32 }}>{badge.icon || '🏅'}</span>
                  <div>
                    <div style={{ fontWeight: 'bold', color: headingColor }}>{badge.name}</div>
                    <div style={{ fontSize: 12, color: secondaryText }}>{badge.description || getRequirementLabel(badge.requirementType)}</div>
                    <div style={{ fontSize: 11, color: secondaryText, marginTop: 2 }}>
                      {getRequirementLabel(badge.requirementType)}
                      {badge.targetCategory && ` • ${getCategoryName(badge.targetCategory)}`}
                      {badge.requirementValue && ` • ${badge.requirementValue}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => editBadge(badge)}
                    style={{
                      padding: '4px 12px',
                      background: '#ffc107',
                      color: '#333',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 'bold'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleBadgeActive(badge._id, badge.active)}
                    style={{
                      padding: '4px 12px',
                      background: badge.active ? '#dc3545' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 'bold'
                    }}
                  >
                    {badge.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteBadge(badge._id)}
                    style={{
                      padding: '4px 12px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 'bold'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: badge.active ? '#2e7d32' : '#dc3545', fontWeight: 'bold' }}>
                {badge.active ? '✅ Active' : '❌ Inactive'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};