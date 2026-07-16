// src/components/home/PremiumModeCategories.jsx
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getCachedQuizzes, hasCachedQuizzes, getCachedCategories, hasCachedCategories } from '../../utils/quizHelpers';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const PremiumModeCategories = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, darkMode, user } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const navigate = useNavigate();

  // ---- SEARCH STATE ----
  const [searchTerm, setSearchTerm] = useState('');

  // ---- DYNAMIC CATEGORIES FROM API (with cache) ----
  const [apiCategories, setApiCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // ---- HELPER FUNCTIONS ----
  const getCategoryIcon = (category) => {
    const icons = {
      'general-nursing': '🩺',
      'midwifery': '🤰',
      'public-health': '🌍',
      'pediatric-nursing': '👶',
      'dental-nursing': '🦷'
    };
    return icons[category] || '📚';
  };

  const getCategoryName = (category) => {
    const names = {
      'general-nursing': 'General Nursing',
      'midwifery': 'Midwifery',
      'public-health': 'Public Health',
      'pediatric-nursing': 'Pediatric Nursing',
      'dental-nursing': 'Dental Nursing'
    };
    return names[category] || category;
  };

  // ---- SEARCH RESULTS (grouped by topic) ----
  const groupedSearchResults = useMemo(() => {
    if (!searchTerm.trim()) return null;
    const term = searchTerm.toLowerCase().trim();

    const matchedQuizzes = quizzes.filter(q => {
      const title = q.title?.toLowerCase() || '';
      const desc = q.description?.toLowerCase() || '';
      const topic = q.topic?.toLowerCase() || '';
      const category = q.category?.toLowerCase() || '';
      const categoryName = getCategoryName(q.category)?.toLowerCase() || '';
      return title.includes(term) || desc.includes(term) || topic.includes(term) || 
             category.includes(term) || categoryName.includes(term);
    });

    if (matchedQuizzes.length === 0) return [];

    const topicMap = new Map();
    matchedQuizzes.forEach(quiz => {
      const topic = quiz.topic || 'General';
      const category = quiz.category || 'general-nursing';
      const key = `${category}|||${topic}`;
      if (!topicMap.has(key)) {
        topicMap.set(key, {
          category: category,
          topic: topic,
          totalQuestions: 0,
          matchedCount: 0,
          quizzes: []
        });
      }
      const entry = topicMap.get(key);
      entry.totalQuestions += quiz.questions?.length || 0;
      entry.matchedCount += 1;
    });

    const result = Array.from(topicMap.values()).map(entry => {
      const totalQuestions = entry.totalQuestions;
      const freeQuestions = Math.min(20, totalQuestions);
      const freeExamCount = freeQuestions > 0 ? 1 : 0;
      const premiumQuestions = totalQuestions - freeQuestions;
      const premiumExamCount = premiumQuestions > 0 ? Math.ceil(premiumQuestions / 250) : 0;
      return {
        ...entry,
        freeExamCount,
        freeQuestions,
        premiumExamCount,
        totalQuestions
      };
    });

    const categoryOrder = ['general-nursing', 'midwifery', 'public-health', 'pediatric-nursing', 'dental-nursing'];
    result.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a.category);
      const indexB = categoryOrder.indexOf(b.category);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.topic.localeCompare(b.topic);
    });

    return result;
  }, [searchTerm, quizzes]);

  // ---- FETCH CATEGORIES (CACHED) ----
  useEffect(() => {
    const fetchCategories = async () => {
      if (!hasCachedCategories()) {
        setCategoriesLoading(true);
      }
      try {
        const categories = await getCachedCategories();
        setApiCategories(categories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setApiCategories([
          { slug: 'general-nursing', name: 'General Nursing', icon: '🩺', active: true, order: 1 },
          { slug: 'midwifery', name: 'Midwifery', icon: '🤰', active: true, order: 2 },
          { slug: 'public-health', name: 'Public Health', icon: '🌍', active: true, order: 3 },
          { slug: 'pediatric-nursing', name: 'Pediatric Nursing', icon: '👶', active: true, order: 4 },
          { slug: 'dental-nursing', name: 'Dental Nursing', icon: '🦷', active: true, order: 5 }
        ]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // ---- FETCH QUIZZES (CACHED) ----
  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!hasCachedQuizzes()) {
        setLoading(true);
      }
      try {
        const data = await getCachedQuizzes(token);
        setQuizzes(data);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [token]);

  // ---- Get categories with topic count ----
  const getCategoriesWithCount = () => {
    const categoryTopics = {};
    quizzes.forEach(quiz => {
      if (!categoryTopics[quiz.category]) {
        categoryTopics[quiz.category] = new Set();
      }
      if (quiz.topic) {
        categoryTopics[quiz.category].add(quiz.topic);
      }
    });
    
    const result = [];
    const activeSlugs = apiCategories.filter(c => c.active).map(c => c.slug);
    
    for (const cat of apiCategories) {
      if (!cat.active) continue;
      const topics = categoryTopics[cat.slug] || new Set();
      result.push({
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon || '📚',
        topicCount: topics.size,
        active: true,
        order: cat.order || 999
      });
    }
    
    for (const [slug, topics] of Object.entries(categoryTopics)) {
      if (!activeSlugs.includes(slug)) {
        const iconMap = {
          'general-nursing': '🩺',
          'midwifery': '🤰',
          'public-health': '🌍',
          'pediatric-nursing': '👶',
          'dental-nursing': '🦷'
        };
        const nameMap = {
          'general-nursing': 'General Nursing',
          'midwifery': 'Midwifery',
          'public-health': 'Public Health',
          'pediatric-nursing': 'Pediatric Nursing',
          'dental-nursing': 'Dental Nursing'
        };
        result.push({
          slug: slug,
          name: nameMap[slug] || slug,
          icon: iconMap[slug] || '📚',
          topicCount: topics.size,
          active: true,
          order: 999
        });
      }
    }
    
    result.sort((a, b) => (a.order || 999) - (b.order || 999));
    return result;
  };

  // ---- Clear search ----
  const clearSearch = () => {
    setSearchTerm('');
  };

  // ---- Render search results ----
  const renderSearchResults = () => {
    if (!groupedSearchResults || groupedSearchResults.length === 0) {
      return null;
    }

    return (
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: headingColor, fontSize: 20 }}>
            🔍 Search Results ({groupedSearchResults.length} topics found)
          </h3>
          <button
            onClick={clearSearch}
            style={{
              background: 'transparent',
              color: secondaryText,
              border: '1px solid ' + secondaryText,
              padding: '6px 16px',
              borderRadius: 20,
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            ✕ Clear
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', rowGap: 64, columnGap: 24 }}>
          {groupedSearchResults.map((item) => {
            const { category, topic, totalQuestions, freeExamCount, freeQuestions, premiumExamCount } = item;
            let infoText = '';
            let premiumTag = null;
            const mode = 'premium';
            const totalExams = premiumExamCount > 0 ? premiumExamCount : 0;
            infoText = `⭐ ${totalExams} Premium Exam${totalExams > 1 ? 's' : ''} (${totalQuestions} total questions)`;

            const link = `/courses/${category}/${mode}?topic=${encodeURIComponent(topic)}`;
            const categoryIcon = getCategoryIcon(category);
            const categoryDisplayName = getCategoryName(category);

            return (
              <Link to={link} key={`${category}-${topic}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: darkMode ? '#16213e' : 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', height: '100%', wordBreak: 'break-word' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 16 }}>{categoryIcon}</span>
                    <span style={{ color: secondaryText, fontSize: 12, fontWeight: '500', background: darkMode ? '#2d2d3d' : '#f0f7f4', padding: '2px 10px', borderRadius: 12 }}>
                      {categoryDisplayName}
                    </span>
                  </div>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                  <h3 style={{ color: darkMode ? headingColor : '#ff9800', fontSize: 'clamp(16px, 4vw, 18px)', marginBottom: 8 }}>{topic}</h3>
                  <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 13, marginBottom: 12 }}>{infoText}</p>
                  {premiumTag && premiumTag}
                  <div style={{ marginTop: 'auto' }}>
                    <button style={{ width: '100%', background: '#ff9800', color: 'white', border: 'none', padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
                      View Exams →
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  // ---- Show upgrade prompt if not premium ----
  const isUserPremium = user?.isPremium && user?.premiumExpiry && new Date(user.premiumExpiry) > new Date();

  if (loading || categoriesLoading) {
    return <LoadingWithBar message="Loading premium mode courses" />;
  }

  const displayCategories = getCategoriesWithCount();
  const hasSearchResults = searchTerm && searchTerm.trim() && groupedSearchResults && groupedSearchResults.length > 0;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* ---- BACK TO HOME ---- */}
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              color: headingColor,
              border: '1px solid ' + headingColor,
              padding: '8px 20px',
              borderRadius: 30,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 'bold',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            ← Back to Home
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{ color: headingColor, fontSize: 'clamp(24px, 5vw, 32px)', marginBottom: 4 }}>⭐ Premium Mode</h1>
          <p style={{ color: '#ff9800', fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 'bold' }}>
            {isUserPremium ? 'Full access to all examinations!' : 'Upgrade to unlock unlimited access!'}
          </p>
        </div>

        {/* ---- Upgrade prompt if not premium ---- */}
        {!isUserPremium && (
          <div style={{
            background: darkMode ? '#2d2d3d' : '#fff3e0',
            padding: '16px 24px',
            borderRadius: 12,
            marginBottom: 24,
            textAlign: 'center',
            border: '1px solid #ff9800'
          }}>
            <p style={{ color: '#ff9800', fontSize: 15, fontWeight: 'bold', margin: 0 }}>
              ⭐ <strong>Premium Mode is locked!</strong> Upgrade now to access all premium exams, unlimited retakes, AI explanations, and more!
            </p>
            <Link to="/get-premium">
              <button style={{
                marginTop: 12,
                background: '#ff9800',
                color: 'white',
                border: 'none',
                padding: '10px 28px',
                borderRadius: 30,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 14
              }}>
                Upgrade Now →
              </button>
            </Link>
          </div>
        )}

        {/* ---- SEARCH BAR ---- */}
        <div style={{ marginBottom: 24, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: darkMode ? '#2d2d3d' : 'white', borderRadius: 50, padding: '4px 4px 4px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}` }}>
            <span style={{ fontSize: 18, color: '#888' }}>🔍</span>
            <input
              type="text"
              placeholder="Search exams, topics, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                outline: 'none',
                fontSize: 15,
                background: 'transparent',
                color: darkMode ? '#eee' : '#333',
                minWidth: '100px'
              }}
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  color: '#888',
                  padding: '4px 8px'
                }}
              >
                ✕
              </button>
            )}
            <button
              onClick={() => searchTerm && setSearchTerm(searchTerm)}
              style={{
                background: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: 50,
                padding: '8px 20px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Search
            </button>
          </div>
          {searchTerm && searchTerm.trim() && (
            <div style={{ marginTop: 8, textAlign: 'center', fontSize: 13, color: secondaryText }}>
              {groupedSearchResults ? `${groupedSearchResults.length} topics found` : 'Searching...'}
            </div>
          )}
        </div>

        {/* ---- MAIN CONTENT ---- */}
        {hasSearchResults ? (
          renderSearchResults()
        ) : (
          <>
            {searchTerm && searchTerm.trim() && (!groupedSearchResults || groupedSearchResults.length === 0) && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: secondaryText }}>
                <p style={{ fontSize: 18 }}>🔍 No topics found for "<strong>{searchTerm}</strong>"</p>
                <p style={{ fontSize: 14, marginTop: 8 }}>Try a different keyword or browse the categories below.</p>
                <button 
                  onClick={clearSearch} 
                  style={{ 
                    marginTop: 12, 
                    padding: '8px 24px', 
                    background: '#ff9800',
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 30, 
                    cursor: 'pointer', 
                    fontWeight: 'bold' 
                  }}
                >
                  Clear Search
                </button>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', rowGap: 24, columnGap: 24 }}>
              {displayCategories.map((cat) => (
                <Link to={`/courses/${cat.slug}/premium`} key={cat.slug} style={{ textDecoration: 'none' }}>
                  <div style={{ 
                    background: darkMode ? '#16213e' : 'white', 
                    padding: 24, 
                    borderRadius: 20, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                    textAlign: 'center',
                    transition: 'transform 0.2s',
                    cursor: 'pointer',
                    borderBottom: '4px solid #ff9800'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ fontSize: 56, marginBottom: 12 }}>{cat.icon}</div>
                    <h2 style={{ color: darkMode ? headingColor : '#ff9800', fontSize: 'clamp(18px, 4vw, 20px)', marginBottom: 8 }}>{cat.name}</h2>
                    <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 14, marginBottom: 12 }}>{cat.topicCount} courses</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ background: darkMode ? '#333' : '#e8f5e9', color: headingColor, padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>🎯 Free Exam 1</span>
                      <span style={{ background: '#fff3e0', color: '#ff9800', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>⭐ Premium</span>
                    </div>
                    <button style={{ marginTop: 16, background: '#ff9800', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 30, cursor: 'pointer', fontWeight: 'bold', fontSize: 14, width: '100%' }}>
                      Explore Courses →
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ---- FOOTER ---- */}
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: secondaryText, fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
          <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>
            Privacy Policy
          </Link>
          <span style={{ color: secondaryText, margin: '0 6px' }}>|</span>
          <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>
            Terms & Conditions
          </Link>
        </p>
      </div>
    </div>
  );
};