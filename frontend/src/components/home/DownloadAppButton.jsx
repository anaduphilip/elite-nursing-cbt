// src/components/home/DownloadAppButton.jsx
import React, { useContext } from 'react';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';
import { AuthContext } from '../../context/AuthContext';

export const DownloadAppButton = () => {
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);

  // Replace this URL with your actual APK download link
  const APK_DOWNLOAD_URL = 'https://your-apk-link.com/app-release.apk';

  return (
    <div style={{
      background: darkMode ? '#16213e' : 'white',
      borderRadius: 16,
      padding: '16px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      marginBottom: 24,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 16
    }}>
      <div>
        <span style={{ fontSize: 24, marginRight: 12 }}>📱</span>
        <span style={{ color: headingColor, fontWeight: 'bold', fontSize: 15 }}>Get the Android App</span>
        <p style={{ color: secondaryText, fontSize: 13, margin: '4px 0 0' }}>Download our app for offline access and a better experience.</p>
      </div>
      <a
        href={APK_DOWNLOAD_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none' }}
      >
        <button style={{
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          color: 'white',
          border: 'none',
          padding: '10px 24px',
          borderRadius: 30,
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          ⬇️ Download APK
        </button>
      </a>
    </div>
  );
};