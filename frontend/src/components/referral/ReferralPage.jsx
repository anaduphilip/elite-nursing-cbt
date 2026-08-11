// src/components/referral/ReferralPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg } from '../../utils/theme';

export const ReferralPage = () => {
  const { token, darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const cardBg = getCardBg(darkMode);

  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [codeRes, statsRes] = await Promise.all([
          axios.get('/api/referral/code', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/referral/stats', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setReferralCode(codeRes.data.referralCode);
        setStats(statsRes.data);
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

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: secondaryText }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ color: headingColor, marginBottom: 20 }}> Refer & Earn</h2>
      
      <div style={{ background: cardBg, borderRadius: 16, padding: 28, marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <p style={{ color: textColor, fontSize: 16, marginBottom: 16 }}>
          Share your referral code with friends. For every friend who signs up, <strong style={{ color: '#ff9800' }}>you get 1 FREE day of Premium!</strong>
        </p>
        
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            readOnly
            value={referralCode}
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
            style={{ padding: '12px 24px', background: '#1e3c72', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
          >
            {copied ? '✅ Copied!' : ' Copy'}
          </button>
          <button
            onClick={shareOnWhatsApp}
            style={{ padding: '12px 24px', background: '#25D366', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
          >
            Share
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: cardBg, borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 'bold', color: '#ff9800' }}>{stats?.referralCount || 0}</div>
          <div style={{ color: secondaryText, fontSize: 14 }}>Friends Referred</div>
        </div>
        <div style={{ background: cardBg, borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 'bold', color: '#ff9800' }}> {stats?.referralRewards?.length || 0}</div>
          <div style={{ color: secondaryText, fontSize: 14 }}>Rewards Earned</div>
        </div>
        <div style={{ background: cardBg, borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 'bold', color: '#ff9800' }}> {stats?.referralRewards?.reduce((sum, r) => sum + (r.value || 0), 0) || 0}</div>
          <div style={{ color: secondaryText, fontSize: 14 }}>Free Premium Day</div>
        </div>
      </div>

      <div style={{ background: cardBg, borderRadius: 16, padding: 20 }}>
        <h3 style={{ color: headingColor, fontSize: 16, marginBottom: 12 }}>Friends Who Joined</h3>
        {stats?.referredUsers?.length === 0 ? (
          <p style={{ color: secondaryText }}>No friends have joined yet. Share your code!</p>
        ) : (
          stats?.referredUsers?.map((user, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}` }}>
              <span style={{ color: textColor }}>{user.name || 'Anonymous'}</span>
              <span style={{ color: secondaryText, fontSize: 12, marginLeft: 12 }}>
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};