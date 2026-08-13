// src/components/referral/ReferralPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg } from '../../utils/theme';

export const ReferralPage = () => {
  const { token, darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const cardBg = getCardBg(darkMode);
  const navigate = useNavigate();

  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showRewardAlert, setShowRewardAlert] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [codeRes, statsRes] = await Promise.all([
          axios.get('/api/referral/code', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/referral/stats', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setReferralCode(codeRes.data.referralCode);

        const statsData = statsRes.data;
        setStats(statsData);

        // Check for a new reward (within last 10 seconds)
        if (statsData.referralRewards && statsData.referralRewards.length > 0) {
          const lastReward = statsData.referralRewards[statsData.referralRewards.length - 1];
          const rewardTime = new Date(lastReward.rewardedAt);
          const now = new Date();
          const diffSeconds = (now - rewardTime) / 1000;

          if (diffSeconds < 10) {
            setShowRewardAlert(true);
            setTimeout(() => setShowRewardAlert(false), 5000);
          }
        }
      } catch (err) {
        console.error('Error fetching referral data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const shareOnWhatsApp = () => {
    const message = `🎓 Join me on ELITE Nursing & Midwifery CBT! Use my referral code: ${referralCode} and get 10% off your first Premium subscription! 🚀 https://elite-nursing-cbt.vercel.app/register`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div style={{ 
      background: darkMode ? '#0f0f1a' : '#f5f7fa', 
      minHeight: '100vh', 
      padding: '12px' 
    }}>
      {/* ===== FLOATING BACK BUTTON – BOTTOM CENTER ===== */}
      <button
        onClick={goBack}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: darkMode ? '#2d2d3d' : '#ffffff',
          color: headingColor,
          border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
          borderRadius: '30px',
          padding: '10px 28px',
          fontSize: '15px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          backdropFilter: 'blur(4px)',
          backgroundColor: darkMode ? 'rgba(26, 26, 46, 0.85)' : 'rgba(255, 255, 255, 0.9)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        }}
        aria-label="Go back"
      >
        Back
      </button>

      <div style={{ padding: 20, maxWidth: 700, margin: '0 auto' }}>
        {/* Reward Alert Toast */}
        {showRewardAlert && (
          <div style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: '#43a047',
            color: 'white',
            padding: '16px 24px',
            borderRadius: 12,
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            zIndex: 9999,
            animation: 'slideIn 0.5s ease'
          }}>
            🎉 You earned 1 free Premium day!
          </div>
        )}

        <div style={{ 
          background: darkMode ? '#1a1a2e' : '#ffffff',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 16,
          boxShadow: darkMode ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
          borderBottom: `3px solid #1e3c72`,
          textAlign: 'center'
        }}>
          <h2 style={{ color: headingColor, fontSize: 'clamp(18px, 3vw, 26px)', fontWeight: 700, marginBottom: 2 }}>
            Refer & Earn
          </h2>
          <p style={{ color: secondaryText, fontSize: 'clamp(11px, 1.2vw, 14px)' }}>
            Share your code and earn rewards
          </p>
        </div>
        
        <div style={{ background: cardBg, borderRadius: 16, padding: 28, marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <p style={{ color: textColor, fontSize: 16, marginBottom: 16 }}>
            Share your referral code with friends. When a friend subscribes to Premium using your code, <strong style={{ color: '#ff9800' }}>you get 1 FREE day of Premium!</strong>
          </p>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              readOnly
              value={loading ? 'Loading...' : referralCode}
              style={{ 
                flex: 1,
                minWidth: 200,
                padding: '14px 18px',
                borderRadius: 8,
                border: `2px solid ${darkMode ? '#ff9800' : '#1e3c72'}`,
                background: darkMode ? '#1a1a2e' : '#f8f9fa',
                color: textColor,
                fontSize: 18,
                fontWeight: 'bold',
                textAlign: 'center',
                letterSpacing: 1
              }}
            />
            <button
              onClick={copyToClipboard}
              disabled={loading || !referralCode}
              style={{ padding: '12px 24px', background: loading || !referralCode ? '#999' : '#1e3c72', color: 'white', border: 'none', borderRadius: 8, cursor: loading || !referralCode ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={shareOnWhatsApp}
              disabled={loading || !referralCode}
              style={{ padding: '12px 24px', background: loading || !referralCode ? '#999' : '#25D366', color: 'white', border: 'none', borderRadius: 8, cursor: loading || !referralCode ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
              Share
            </button>
          </div>
          {loading && (
            <div style={{ marginTop: 8, fontSize: 13, color: secondaryText }}>Fetching your referral code...</div>
          )}
        </div>

        {/* ===== UPDATED STATS CARDS (using new fields) ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{ background: cardBg, borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 'bold', color: '#ff9800' }}>
              {loading ? '...' : (stats?.totalReferred ?? 0)}
            </div>
            <div style={{ color: secondaryText, fontSize: 14 }}>Friends Referred</div>
          </div>
          <div style={{ background: cardBg, borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 'bold', color: '#ff9800' }}>
              {loading ? '...' : (stats?.rewardCount ?? 0)}
            </div>
            <div style={{ color: secondaryText, fontSize: 14 }}>Rewards Earned</div>
          </div>
          <div style={{ background: cardBg, borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 'bold', color: '#ff9800' }}>
              {loading ? '...' : (stats?.totalFreeDays ?? 0)}
            </div>
            <div style={{ color: secondaryText, fontSize: 14 }}>Free Premium Days</div>
          </div>
        </div>

        {/* ===== FRIENDS LIST WITH BONUS STATUS ===== */}
        <div style={{ background: cardBg, borderRadius: 16, padding: 20 }}>
          <h3 style={{ color: headingColor, fontSize: 16, marginBottom: 12 }}>Friends Who Joined</h3>
          {loading ? (
            <p style={{ color: secondaryText }}>Loading...</p>
          ) : stats?.referredUsers?.length === 0 ? (
            <p style={{ color: secondaryText }}>No friends have joined yet. Share your code!</p>
          ) : (
            stats?.referredUsers?.map((user, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}` }}>
                <span style={{ color: textColor }}>{user.name || user.email || 'Anonymous'}</span>
                <span style={{ color: secondaryText, fontSize: 12, marginLeft: 12 }}>
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
                <span style={{
                  marginLeft: 12,
                  fontSize: 11,
                  color: user.bonusClaimed ? '#2e7d32' : '#ff9800',
                  fontWeight: 'bold'
                }}>
                  {user.bonusClaimed ? '✅ Bonus claimed' : '⏳ Pending purchase'}
                </span>
                {user.isPremium && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#ff9800', fontWeight: 'bold' }}>⭐ Premium</span>
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ textAlign: 'center', padding: '12px', marginTop: 12 }}>
          <p style={{ color: secondaryText, fontSize: 'clamp(9px, 0.8vw, 11px)' }}>
            © 2026 ELITE Nursing & Midwifery CBT.
            <Link to="/privacy" style={{ color: '#2196f3', fontSize: 'clamp(9px, 0.8vw, 11px)', textDecoration: 'none', marginLeft: 4 }}>
              Privacy Policy
            </Link>
            <span style={{ color: secondaryText, margin: '0 4px' }}>|</span>
            <Link to="/terms" style={{ color: '#2196f3', fontSize: 'clamp(9px, 0.8vw, 11px)', textDecoration: 'none' }}>
              Terms & Conditions
            </Link>
          </p>
        </div>
      </div>

      {/* CSS Animation for the toast */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};