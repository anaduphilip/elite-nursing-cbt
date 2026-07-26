// src/components/pre-council/PreCouncilCategories.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const PreCouncilCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/pre-council/categories');
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) return <LoadingWithBar message="Loading Pre Council categories..." />;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ color: headingColor, fontSize: 'clamp(24px, 5vw, 36px)' }}>📋 Pre Council Exam</h1>
          <p style={{ color: secondaryText }}>Select your category to begin</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {categories.map(cat => (
            <Link to={`/pre-council/${cat.slug}`} key={cat._id} style={{ textDecoration: 'none' }}>
              <div style={{
                background: darkMode ? '#16213e' : 'white',
                padding: 24,
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                borderBottom: `4px solid #1e3c72`
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{cat.icon || '📚'}</div>
                <h2 style={{ color: headingColor, fontSize: 20, marginBottom: 8 }}>{cat.name}</h2>
                {cat.description && <p style={{ color: secondaryText, fontSize: 14 }}>{cat.description}</p>}
                <button style={{ marginTop: 16, background: '#1e3c72', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 30, cursor: 'pointer', fontWeight: 'bold' }}>
                  Select →
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: secondaryText, fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.</p>
      </div>
    </div>
  );
};