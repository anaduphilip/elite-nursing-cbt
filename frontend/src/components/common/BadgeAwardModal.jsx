// src/components/common/BadgeAwardModal.jsx
import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

export const BadgeAwardModal = ({ badges, onClose, darkMode }) => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!badges || badges.length === 0) return null;

  return (
    <>
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={false}
        numberOfPieces={200}
        gravity={0.15}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: 20,
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: darkMode ? '#16213e' : 'white',
            borderRadius: 24,
            padding: 32,
            maxWidth: 450,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'popIn 0.5s ease',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
          <h2 style={{ color: '#ff9800', fontSize: 28, marginBottom: 8 }}>
            New Badge{ badges.length > 1 ? 's' : '' } Earned!
          </h2>
          <p style={{ color: darkMode ? '#ccc' : '#666', marginBottom: 16 }}>
            Congratulations! You've unlocked:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
            {badges.map((badge, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: darkMode ? '#1a1a2e' : '#f5f5f5',
                  padding: '16px 20px',
                  borderRadius: 12,
                  minWidth: 80,
                }}
              >
                <span style={{ fontSize: 40 }}>{badge.icon || '🏅'}</span>
                <span style={{ fontSize: 14, fontWeight: 'bold', marginTop: 4, color: darkMode ? '#eee' : '#333' }}>
                  {badge.name}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#1e3c72',
              color: 'white',
              padding: '12px 36px',
              border: 'none',
              borderRadius: 30,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 16,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#2a5298')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#1e3c72')}
          >
            Awesome!
          </button>
        </div>
      </div>
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          80% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
};