// src/components/pages/Maintenance.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export const Maintenance = ({ message }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#f0f7f4',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🔧</div>
      <h1 style={{ color: '#1e3c72' }}>We'll be back soon!</h1>
      <p style={{ fontSize: 18, maxWidth: 500, color: '#555' }}>
        {message || 'We are currently performing maintenance. Please check back later.'}
      </p>
      <p style={{ color: '#888', marginTop: 20, fontSize: 14 }}>
        Thank you for your patience.
      </p>
    </div>
  );
};