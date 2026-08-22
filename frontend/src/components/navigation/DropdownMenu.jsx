// src/components/navigation/DropdownMenu.jsx
import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor } from '../../utils/theme';

export const DropdownMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [supportExpanded, setSupportExpanded] = useState(false);
  const { user, darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const menuRef = useRef(null);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);
  const toggleSupport = (e) => {
    e.stopPropagation();
    setSupportExpanded(!supportExpanded);
  };

  // ---- Close menu when clicking outside ----
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ---- Main menu items (always visible) ----
  const mainItems = [
    { label: 'Home', path: '/' },
    { label: 'Profile', path: '/profile' },
    { label: 'Weekly Quiz', path: '/weekly-quiz' },
    { label: 'About Us', path: '/about' },
  ];

  // ---- Support sub‑items (hidden under "Support") ----
  const supportItems = [
    { label: 'Contact Us', path: '/contact' },
    { label: 'Join WhatsApp', path: '/whatsapp', highlight: true },
    { label: 'FAQ', path: '/faq' },
    { label: 'How to Use', path: '/how-to-use' },
  ];

  // ---- Dropdown button style ----
  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: darkMode ? '#2d2d3d' : 'white',
    color: textColor,
    border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
    borderRadius: '30px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.06)',
    outline: 'none',
  };

  const buttonHover = {
    background: darkMode ? '#3a3a4e' : '#f5f5f5',
    boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
  };

  // ---- Menu container (responsive) ----
  const menuStyle = {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    minWidth: '200px',
    maxWidth: 'calc(100vw - 32px)',  // prevent overflow on small screens
    width: 'auto',
    background: darkMode ? '#1a1a2e' : 'white',
    borderRadius: '14px',
    boxShadow: darkMode ? '0 12px 40px rgba(0,0,0,0.4)' : '0 12px 40px rgba(0,0,0,0.12)',
    zIndex: 199,
    overflow: 'hidden',
    border: `1px solid ${darkMode ? '#333' : '#eaeaea'}`,
    backdropFilter: 'blur(8px)',
    backgroundColor: darkMode ? 'rgba(26, 26, 46, 0.95)' : 'rgba(255, 255, 255, 0.98)',
    maxHeight: 'calc(100vh - 100px)',  // ensure it fits on screen
    overflowY: 'auto',
  };

  // ---- User header (compact) ----
  const userHeaderStyle = {
    padding: '12px 16px',
    background: darkMode ? '#0f0f1f' : '#f8f9fa',
    borderBottom: `1px solid ${darkMode ? '#333' : '#eaeaea'}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  };

  const userNameStyle = {
    fontSize: '14px',
    fontWeight: 700,
    color: headingColor,
    marginBottom: '2px',
  };

  const userEmailStyle = {
    fontSize: '12px',
    color: secondaryText,
  };

  const premiumBadgeStyle = {
    background: '#ff9800',
    color: 'white',
    padding: '2px 10px',
    borderRadius: '20px',
    fontSize: '10px',
    fontWeight: 700,
    display: 'inline-block',
    marginTop: '3px',
  };

  // ---- Menu item style (compact) ----
  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 16px',
    textDecoration: 'none',
    color: textColor,
    fontSize: '13px',
    fontWeight: 500,
    transition: 'background 0.15s ease',
    borderBottom: `1px solid ${darkMode ? '#2a2a3e' : '#f0f0f0'}`,
    cursor: 'pointer',
  };

  const itemHover = {
    background: darkMode ? '#2d2d3d' : '#f5f5f5',
  };

  const highlightItemStyle = {
    ...itemStyle,
    color: '#25D366',
    fontWeight: 600,
  };

  // ---- Sub‑item style (indented, compact) ----
  const subItemStyle = {
    ...itemStyle,
    paddingLeft: '36px',
    fontSize: '12px',
    fontWeight: 400,
    borderBottom: `1px solid ${darkMode ? '#252535' : '#f5f5f5'}`,
  };

  const subItemHover = {
    background: darkMode ? '#252535' : '#f0f0f0',
  };

  const supportItemStyle = {
    ...itemStyle,
    fontWeight: 600,
    color: headingColor,
    borderBottom: `1px solid ${darkMode ? '#2a2a3e' : '#f0f0f0'}`,
  };

  // ---- Render a menu item (helper) ----
  const renderMenuItem = (item, isSub = false, isHighlight = false) => {
    const baseStyle = isSub ? subItemStyle : (isHighlight ? highlightItemStyle : itemStyle);
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={closeMenu}
        style={baseStyle}
        onMouseEnter={(e) => {
          if (!isHighlight) {
            e.currentTarget.style.background = isSub ? subItemHover.background : itemHover.background;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <span style={{ fontSize: '16px', width: '22px', textAlign: 'center' }}>
          {item.icon}
        </span>
        {item.label}
      </Link>
    );
  };

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* ---- Dropdown Button ---- */}
      <button
        onClick={toggleMenu}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = buttonHover.background;
          e.currentTarget.style.boxShadow = buttonHover.boxShadow;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = buttonStyle.background;
          e.currentTarget.style.boxShadow = buttonStyle.boxShadow;
        }}
        aria-label="Menu"
      >
        <span style={{ fontSize: '16px' }}>{isOpen ? '✕' : '☰'}</span>
        <span>Menu</span>
      </button>

      {/* ---- Dropdown Menu ---- */}
      {isOpen && (
        <div style={menuStyle}>
          {/* User header */}
          <div style={userHeaderStyle}>
            <div style={userNameStyle}>
              {user?.name || user?.email?.split('@')[0] || 'Guest'}
            </div>
            {user?.email && <div style={userEmailStyle}>{user.email}</div>}
            {user?.isPremium && (
              <div style={premiumBadgeStyle}>⭐ Premium</div>
            )}
          </div>

          {/* Main menu items */}
          <div style={{ padding: '2px 0' }}>
            {mainItems.map((item) => renderMenuItem(item))}

            {/* ---- Support Section (expandable) ---- */}
            <div>
              <div
                onClick={toggleSupport}
                style={supportItemStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = itemHover.background;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '16px', width: '22px', textAlign: 'center' }}>
                  {supportExpanded ? '▼' : '▶'}
                </span>
                Support
              </div>
              {supportExpanded && (
                <div style={{ padding: '0' }}>
                  {supportItems.map((item) => renderMenuItem(item, true, item.highlight))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};