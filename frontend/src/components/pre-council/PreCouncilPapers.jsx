// src/components/pre-council/PreCouncilPapers.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';
import { PreCouncilCourseModal } from './PreCouncilCourseModal';

export const PreCouncilPapers = () => {
  const { categorySlug } = useParams();
  const [category, setCategory] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const { darkMode } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First get category by slug
        const catRes = await axios.get('/api/pre-council/categories');
        const cat = catRes.data.categories.find(c => c.slug === categorySlug);
        if (!cat) {
          alert('Category not found');
          navigate('/pre-council');
          return;
        }
        setCategory(cat);

        // Then get papers for that category
        const papersRes = await axios.get(`/api/pre-council/categories/${cat._id}/papers`);
        setPapers(papersRes.data.papers);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categorySlug, navigate]);

  const handlePaperClick = (paper) => {
    if (paper.hasCourses && paper.courses && paper.courses.length > 0) {
      setSelectedPaper(paper);
      setShowCourseModal(true);
    } else {
      // No courses, go directly to exam list
      navigate(`/pre-council/${categorySlug}/${paper.slug}/exams`);
    }
  };

  if (loading) return <LoadingWithBar message="Loading papers..." />;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/pre-council')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#6c757d',
            color: 'white',
            padding: '10px 20px',
            borderRadius: 30,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: 20
          }}
        >
          Back to Categories
        </button>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ color: headingColor, fontSize: 'clamp(24px, 5vw, 36px)' }}>{category?.name}</h1>
          <p style={{ color: secondaryText }}>Select a paper to begin</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {papers.map(paper => (
            <div
              key={paper._id}
              onClick={() => handlePaperClick(paper)}
              style={{
                background: darkMode ? '#16213e' : 'white',
                padding: 24,
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                borderBottom: `4px solid #ff9800`
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
              <h2 style={{ color: headingColor, fontSize: 20, marginBottom: 8 }}>{paper.name}</h2>
              {paper.description && <p style={{ color: secondaryText, fontSize: 14 }}>{paper.description}</p>}
              <button style={{ marginTop: 16, background: '#ff9800', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 30, cursor: 'pointer', fontWeight: 'bold' }}>
                Select →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Course Modal */}
      {showCourseModal && selectedPaper && (
        <PreCouncilCourseModal
          paper={selectedPaper}
          categorySlug={categorySlug}
          onClose={() => setShowCourseModal(false)}
        />
      )}
    </div>
  );
};