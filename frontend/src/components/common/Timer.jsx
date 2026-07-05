import React, { useState, useEffect } from 'react';

export const Timer = ({ duration, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft < 300;

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: isWarning ? '#f44336' : '#1e3c72',
      color: 'white',
      padding: '12px 20px',
      textAlign: 'center',
      fontSize: 22,
      fontWeight: 'bold',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      ⏰ {minutes}:{seconds.toString().padStart(2, '0')}
      {isWarning && <span style={{ marginLeft: 10, fontSize: 14 }}>⚠️ TIME RUNNING OUT!</span>}
    </div>
  );
};