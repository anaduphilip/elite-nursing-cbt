// src/components/common/BadgeAwardModal.jsx
import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';

export const BadgeAwardModal = ({ badges, onClose, darkMode }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Reset index when new badges arrive
  useEffect(() => {
    setCurrentIndex(0);
  }, [badges]);

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

  const currentBadge = badges[currentIndex];
  const isLast = currentIndex === badges.length - 1;

  const handleClose = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

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
        onClick={handleClose}
      >
        <div
          style={{
            background: darkMode ? '#16213e' : 'white',
            borderRadius: 24,
            padding: 32,
            maxWidth: 400,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'popIn 0.5s ease',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
          <h2 style={{ color: '#ff9800', fontSize: 24, marginBottom: 4 }}>
            New Badge Earned!
          </h2>
          <p style={{ color: darkMode ? '#ccc' : '#666', marginBottom: 16, fontSize: 13 }}>
            {currentIndex + 1} of {badges.length}
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: darkMode ? '#1a1a2e' : '#f5f5f5',
              padding: '20px',
              borderRadius: 16,
              marginBottom: 16,
              minWidth: 80,
            }}
          >
            <span style={{ fontSize: 48 }}>{currentBadge.icon || '🏅'}</span>
            <span style={{ fontSize: 18, fontWeight: 'bold', marginTop: 8, color: darkMode ? '#eee' : '#333' }}>
              {currentBadge.name}
            </span>
          </div>
          <button
            onClick={handleClose}
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
            {isLast ? 'Awesome!' : 'Next'}
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