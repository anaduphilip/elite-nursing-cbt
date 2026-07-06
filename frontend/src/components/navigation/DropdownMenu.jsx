// src/components/navigation/DropdownMenu.jsx
import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';

export const DropdownMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, darkMode, toggleDarkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ background: '#1e3c72', color: 'white', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>☰</span> Menu
      </button>
      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 198 }} />
          <div style={{ position: 'absolute', top: '48px', right: 0, width: 220, background: darkMode ? '#16213e' : 'white', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 199, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: '#1e3c72', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 'bold' }}>{user?.name || user?.email?.split('@')[0]}</div>
              {user?.isPremium && <div style={{ background: '#ff9800', display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, marginTop: 4 }}>⭐ PREMIUM</div>}
            </div>
            <div style={{ padding: '8px 0' }}>
              <Link to="/profile" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 20px', textDecoration: 'none', color: darkMode ? '#eee' : '#333', fontSize: 13, borderBottom: '1px solid ' + (darkMode ? '#444' : '#eee'), fontWeight: 'bold' }}> MY PROFILE</Link>
              <Link to="/" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 20px', textDecoration: 'none', color: darkMode ? '#eee' : '#333', fontSize: 13, borderBottom: '1px solid ' + (darkMode ? '#444' : '#eee') }}> Home</Link>
              <Link to="/about" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 20px', textDecoration: 'none', color: darkMode ? '#eee' : '#333', fontSize: 13, borderBottom: '1px solid ' + (darkMode ? '#444' : '#eee') }}> About Us</Link>
              <Link to="/contact" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 20px', textDecoration: 'none', color: darkMode ? '#eee' : '#333', fontSize: 13, borderBottom: '1px solid ' + (darkMode ? '#444' : '#eee') }}> Contact Us</Link>
              <Link to="/whatsapp" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 20px', textDecoration: 'none', color: '#25D366', fontWeight: 'bold', fontSize: 13, borderBottom: '1px solid ' + (darkMode ? '#444' : '#eee') }}> Join WhatsApp</Link>
              <Link to="/weekly-quiz" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 20px', textDecoration: 'none', color: darkMode ? '#eee' : '#333', fontSize: 13, borderBottom: '1px solid ' + (darkMode ? '#444' : '#eee'), fontWeight: 'bold' }}> Weekly Quiz</Link>
              <Link to="/weekly-leaderboard" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 20px', textDecoration: 'none', color: darkMode ? '#eee' : '#333', fontSize: 13, borderBottom: '1px solid ' + (darkMode ? '#444' : '#eee'), fontWeight: 'bold' }}> Leaderboard</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};