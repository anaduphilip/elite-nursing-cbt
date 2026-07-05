// src/components/common/FloatingChatButton.jsx
import React, { useState, useEffect } from 'react';

export const FloatingChatButton = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('chatButtonPosition');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const snapX = parsed.x < window.innerWidth / 2 ? 0 : window.innerWidth - 60;
        return { x: snapX, y: parsed.y || 20 };
      } catch (e) {
        return { x: window.innerWidth - 60, y: 20 };
      }
    }
    return { x: window.innerWidth - 60, y: 20 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [wasDragged, setWasDragged] = useState(false);

  useEffect(() => {
    const visible = localStorage.getItem('chatButtonVisible');
    if (visible !== null) setIsVisible(visible === 'true');
  }, []);
  useEffect(() => {
    localStorage.setItem('chatButtonPosition', JSON.stringify(position));
  }, [position]);
  useEffect(() => {
    localStorage.setItem('chatButtonVisible', isVisible);
  }, [isVisible]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setWasDragged(false);
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setWasDragged(true);
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;
      const buttonSize = 60;
      newY = Math.max(0, Math.min(window.innerHeight - buttonSize, newY));
      const center = window.innerWidth / 2;
      newX = newX < center ? 0 : window.innerWidth - buttonSize;
      setPosition({ x: newX, y: newY });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setWasDragged(false);
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
  };
  useEffect(() => {
    const handleTouchMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      setWasDragged(true);
      const touch = e.touches[0];
      let newX = touch.clientX - dragOffset.x;
      let newY = touch.clientY - dragOffset.y;
      const buttonSize = 60;
      newY = Math.max(0, Math.min(window.innerHeight - buttonSize, newY));
      const center = window.innerWidth / 2;
      newX = newX < center ? 0 : window.innerWidth - buttonSize;
      setPosition({ x: newX, y: newY });
    };
    const handleTouchEnd = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset]);

  const hideButton = () => setIsVisible(false);
  const showButton = () => setIsVisible(true);

  const handleClick = () => {
    if (!wasDragged) {
      window.open('https://wa.me/2349063908476', '_blank');
    }
  };

  const buttonSize = 60;
  const isOnRight = position.x > 0;
  const arrow = isOnRight ? '←' : '→';

  if (!isVisible) {
    return (
      <button
        onClick={showButton}
        style={{
          position: 'fixed',
          ...(isOnRight ? { right: '10px' } : { left: '10px' }),
          top: Math.min(position.y, window.innerHeight - 50),
          zIndex: 9999,
          backgroundColor: '#25D366',
          color: 'white',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          fontSize: '20px',
          cursor: 'pointer',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        aria-label="Show chat"
      >
        {arrow}
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        width: buttonSize,
        height: buttonSize,
        borderRadius: '50%',
        backgroundColor: '#25D366',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'box-shadow 0.2s',
        touchAction: 'none',
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!isDragging) e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        if (!isDragging) e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
      }}
    >
      <span style={{ fontSize: '28px', pointerEvents: 'none' }}>💬</span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          hideButton();
        }}
        style={{
          position: 'absolute',
          top: '-6px',
          ...(isOnRight ? { left: '-6px' } : { right: '-6px' }),
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: '#dc3545',
          color: 'white',
          border: '2px solid white',
          fontSize: '12px',
          fontWeight: 'bold',
          lineHeight: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          padding: 0,
          pointerEvents: 'auto'
        }}
        aria-label="Hide chat button"
      >
        ×
      </button>
    </div>
  );
};