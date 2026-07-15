// src/components/home/HomePage.jsx
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';   
import axios from 'axios';                                
import { AuthContext } from '../../context/AuthContext';
import { getCachedQuizzes, hasCachedQuizzes, getCachedCategories, hasCachedCategories } from '../../utils/quizHelpers';
import { getHeadingColor, getSecondaryText } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const HomePage = () => {
  const [mode, setMode] = useState('premium');
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, darkMode, user, login } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const navigate = useNavigate(); 

  // ---- SEARCH STATE ----
  const [searchTerm, setSearchTerm] = useState('');

  // ---- ANNOUNCEMENT BANNER STATE ----
  const [announcement, setAnnouncement] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissedVersion, setDismissedVersion] = useState(() => {
    return localStorage.getItem('announcementDismissed') || '0';
  });

  // ---- MARKETING CONSENT BANNER STATE ----
  const [consentBanner, setConsentBanner] = useState(null);
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [consentDismissedVersion, setConsentDismissedVersion] = useState(() => {
    return localStorage.getItem('consentBannerDismissed') || '0';
  });

  // ===== LIMITED TIME OFFER STATE =====
  const [offer, setOffer] = useState(null);
  const [showOffer, setShowOffer] = useState(false);
  const [offerDismissed, setOfferDismissed] = useState(false);
  const [offerTimeLeft, setOfferTimeLeft] = useState(null);

  // ---- DYNAMIC CATEGORIES FROM API (with cache) ----
  const [apiCategories, setApiCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // ---- HELPER FUNCTIONS (MOVED UP to fix the error) ----
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

  // ---- SEARCH RESULTS (grouped by topic, matching CourseList grouping) ----
  const groupedSearchResults = useMemo(() => {
    if (!searchTerm.trim()) return null;
    const term = searchTerm.toLowerCase().trim();

    // First, filter all quizzes that match the search
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

    // Group by topic (like CourseList does)
    const topicMap = new Map();
    matchedQuizzes.forEach(quiz => {
      const topic = quiz.topic || 'General';
      const category = quiz.category || 'general-nursing';
      const key = `${category}|||${topic}`; // unique key combining category and topic
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

    // Convert to array and compute free/premium exam counts
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

    // Sort by category order and then topic name
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

  // ---- FETCH ANNOUNCEMENT ----
  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await axios.get('/api/announcement');
        if (res.data.success && res.data.announcement) {
          const ann = res.data.announcement;
          setAnnouncement(ann);
          if (ann.active && parseInt(dismissedVersion) !== ann.version) {
            setShowBanner(true);
          } else {
            setShowBanner(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch announcement:', error);
      }
    };
    fetchAnnouncement();
  }, [dismissedVersion]);

  // ---- FETCH MARKETING CONSENT BANNER ----
  useEffect(() => {
    const fetchConsentBanner = async () => {
      try {
        const res = await axios.get('/api/marketing-consent');
        if (res.data.success && res.data.consent) {
          const banner = res.data.consent;
          setConsentBanner(banner);
          if (banner.active && !user?.marketingConsent && parseInt(consentDismissedVersion) !== banner.version) {
            setShowConsentBanner(true);
          } else {
            setShowConsentBanner(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch consent banner:', error);
      }
    };
    fetchConsentBanner();
  }, [user?.marketingConsent, consentDismissedVersion]);

  // ===== FETCH LIMITED TIME OFFER =====
  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const res = await axios.get('/api/config');
        if (res.data.success && res.data.config?.limitedOffer) {
          const offerData = res.data.config.limitedOffer;
          setOffer(offerData);
          
          // Check if the offer is active and should be shown
          // Use isActive from backend (already calculated based on dates and discount)
          if (offerData.isActive && offerData.discountPercent > 0) {
            // Check if the user qualifies for the offer based on target audience
            let userQualifies = true;
            const target = offerData.targetAudience || 'free';
            if (target === 'free' && user?.isPremium) {
              userQualifies = false;
            } else if (target === 'premium' && !user?.isPremium) {
              userQualifies = false;
            }
            // Check if user has dismissed this offer (optional – can use version)
            const dismissed = localStorage.getItem('offerDismissed');
            if (userQualifies && dismissed !== String(offerData.version || '1')) {
              setShowOffer(true);
            } else {
              setShowOffer(false);
            }
          } else {
            setShowOffer(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch limited offer:', error);
      }
    };
    fetchOffer();
  }, [user?.isPremium]);

  // ===== COUNTDOWN TIMER FOR OFFER =====
  useEffect(() => {
    if (!showOffer || !offer?.endDate) {
      setOfferTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(offer.endDate);
      const diff = end - now;

      if (diff <= 0) {
        setOfferTimeLeft(null);
        setShowOffer(false);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setOfferTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [showOffer, offer?.endDate]);

  // ---- FETCH CATEGORIES (CACHED) ----
  useEffect(() => {
    const fetchCategories = async () => {
      // Only show loading if categories are NOT cached
      if (!hasCachedCategories()) {
        setCategoriesLoading(true);
      }
      try {
        const categories = await getCachedCategories();
        setApiCategories(categories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback to hardcoded categories if API fails
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

  // ---- Get categories with topic count from quizzes ----
  // Sorted by the 'order' field from the database
  const getCategoriesWithCount = () => {
    // Build category -> topics count from quizzes
    const categoryTopics = {};
    quizzes.forEach(quiz => {
      if (!categoryTopics[quiz.category]) {
        categoryTopics[quiz.category] = new Set();
      }
      if (quiz.topic) {
        categoryTopics[quiz.category].add(quiz.topic);
      }
    });
    
    // Map API categories to include topic count and icon
    const result = [];
    const activeSlugs = apiCategories.filter(c => c.active).map(c => c.slug);
    
    // First, include all active categories from API
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
    
    // Also include any categories that exist in quizzes but not in API (fallback)
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
    
    // Sort by order (ascending) – this makes the category order match the admin panel
    result.sort((a, b) => (a.order || 999) - (b.order || 999));
    
    return result;
  };

  // ---- Clear search ----
  const clearSearch = () => {
    setSearchTerm('');
  };

  // ---- Render search results (grouped by topic) ----
  const renderSearchResults = () => {
    if (!groupedSearchResults || groupedSearchResults.length === 0) {
      return null; // We'll handle the no-results case in the main render
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

        {/* Display each topic as a card, exactly like CourseList topic cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', rowGap: 64, columnGap: 24 }}>
          {groupedSearchResults.map((item) => {
            const { category, topic, totalQuestions, freeExamCount, freeQuestions, premiumExamCount } = item;
            let infoText = '';
            let premiumTag = null;
            if (mode === 'free') {
              const freeQ = freeQuestions > 0 ? freeQuestions : totalQuestions;
              infoText = `🎯 1 Free Exam (${freeQ} questions)`;
              if (premiumExamCount > 0) {
                premiumTag = <p style={{ color: '#ff9800', fontSize: 12, marginTop: 4 }}>⭐ Access more questions in Premium</p>;
              }
            } else {
              const totalExams = premiumExamCount > 0 ? premiumExamCount : 0;
              infoText = `⭐ ${totalExams} Premium Exam${totalExams > 1 ? 's' : ''} (${totalQuestions} total questions)`;
            }

            // Build link to topic view
            const link = `/courses/${category}/${mode}?topic=${encodeURIComponent(topic)}`;

            // Get category icon and name
            const categoryIcon = getCategoryIcon(category);
            const categoryDisplayName = getCategoryName(category);

            return (
              <Link to={link} key={`${category}-${topic}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: darkMode ? '#16213e' : 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', height: '100%', wordBreak: 'break-word' }}>
                  {/* Category badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 16 }}>{categoryIcon}</span>
                    <span style={{ color: secondaryText, fontSize: 12, fontWeight: '500', background: darkMode ? '#2d2d3d' : '#f0f7f4', padding: '2px 10px', borderRadius: 12 }}>
                      {categoryDisplayName}
                    </span>
                  </div>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                  <h3 style={{ color: darkMode ? headingColor : (mode === 'free' ? '#1e3c72' : '#ff9800'), fontSize: 'clamp(16px, 4vw, 18px)', marginBottom: 8 }}>{topic}</h3>
                  <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 13, marginBottom: 12 }}>{infoText}</p>
                  {premiumTag && premiumTag}
                  <div style={{ marginTop: 'auto' }}>
                    <button style={{ width: '100%', background: mode === 'free' ? '#1e3c72' : '#ff9800', color: 'white', border: 'none', padding: '10px', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
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

  if (loading || categoriesLoading) {
    return <LoadingWithBar message="Loading courses" />;
  }

  const displayCategories = getCategoriesWithCount();

  // ---- Search button background color based on mode ----
  const searchButtonBg = mode === 'free' ? '#1e3c72' : '#ff9800';

  // ---- Determine if we have search results to show ----
  const hasSearchResults = searchTerm && searchTerm.trim() && groupedSearchResults && groupedSearchResults.length > 0;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ color: headingColor, fontSize: 'clamp(24px, 5vw, 36px)', marginBottom: 8 }}>ELITE NURSING & MIDWIFERY CBT</h1>
          <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 'clamp(14px, 4vw, 16px)' }}>Computer Based Testing Platform</p>
        </div>

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
                background: searchButtonBg,
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

        {/* ---- ANNOUNCEMENT BANNER ---- */}
        {showBanner && announcement && (
          <div style={{
            background: darkMode ? '#2d2d3d' : '#fff3e0',
            borderRadius: 12,
            padding: '16px 24px',
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            border: `1px solid ${darkMode ? '#444' : '#ffcc80'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>📢</span>
              <span style={{ color: darkMode ? '#eee' : '#333' }}>{announcement.message}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  navigate(announcement.buttonLink);
                  localStorage.setItem('announcementDismissed', announcement.version);
                  setShowBanner(false);
                }}
                style={{
                  background: '#ff9800',
                  color: 'white',
                  padding: '8px 24px',
                  border: 'none',
                  borderRadius: 30,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {announcement.buttonText}
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('announcementDismissed', announcement.version);
                  setShowBanner(false);
                }}
                style={{
                  background: 'transparent',
                  color: secondaryText,
                  border: '1px solid ' + secondaryText,
                  padding: '8px 20px',
                  borderRadius: 30,
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ---- MARKETING CONSENT BANNER ---- */}
        {showConsentBanner && consentBanner && (
          <div style={{
            background: darkMode ? '#2d2d3d' : '#e3f2fd',
            borderRadius: 12,
            padding: '16px 24px',
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            border: `1px solid ${darkMode ? '#444' : '#90caf9'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>📬</span>
              <span style={{ color: darkMode ? '#eee' : '#333' }}>{consentBanner.message}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={async () => {
                  try {
                    const res = await axios.put('/api/user/marketing-consent',
                      { consent: true },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (res.data.success) {
                      const updatedUser = { ...user, marketingConsent: true };
                      login(token, updatedUser);
                      setShowConsentBanner(false);
                      localStorage.setItem('consentBannerDismissed', consentBanner.version);
                      alert('✅ You are now opted in for promotional emails!');
                    }
                  } catch (err) {
                    alert('Failed to update preference. Please try again later.');
                  }
                }}
                style={{
                  background: '#1e3c72',
                  color: 'white',
                  padding: '8px 24px',
                  border: 'none',
                  borderRadius: 30,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {consentBanner.buttonText || 'Yes, Opt me in!'}
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('consentBannerDismissed', consentBanner.version);
                  setShowConsentBanner(false);
                }}
                style={{
                  background: 'transparent',
                  color: secondaryText,
                  border: '1px solid ' + secondaryText,
                  padding: '8px 20px',
                  borderRadius: 30,
                  cursor: 'pointer'
                }}
              >
                No thanks
              </button>
            </div>
          </div>
        )}

        {/* ===== LIMITED TIME OFFER BANNER ===== */}
        {showOffer && offer && offerTimeLeft && (
          <div style={{
            background: darkMode ? '#2d2d3d' : '#fff3e0',
            borderRadius: 12,
            padding: '16px 24px',
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            border: `2px solid #ff9800`,
            boxShadow: '0 2px 12px rgba(255, 152, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 28 }}>🔥</span>
              <div>
                <span style={{ color: darkMode ? '#eee' : '#333', fontSize: 15, fontWeight: 'bold' }}>
                  {offer.message || `🔥 ${offer.discountPercent}% OFF!`}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ color: '#e65100', fontSize: 13, fontWeight: 'bold' }}>
                    ⏰ {offerTimeLeft.days > 0 && `${offerTimeLeft.days}d `}
                    {String(offerTimeLeft.hours).padStart(2, '0')}h 
                    {String(offerTimeLeft.minutes).padStart(2, '0')}m 
                    {String(offerTimeLeft.seconds).padStart(2, '0')}s
                  </span>
                  <span style={{ color: '#ff9800', fontSize: 12, fontWeight: 'bold', background: '#fff3e0', padding: '2px 10px', borderRadius: 20 }}>
                    {offer.discountPercent}% OFF
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  navigate(offer.buttonLink || '/get-premium');
                  localStorage.setItem('offerDismissed', offer.version || '1');
                  setShowOffer(false);
                }}
                style={{
                  background: '#ff9800',
                  color: 'white',
                  padding: '8px 24px',
                  border: 'none',
                  borderRadius: 30,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)'
                }}
              >
                {offer.buttonText || 'Claim Offer →'}
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('offerDismissed', offer.version || '1');
                  setShowOffer(false);
                }}
                style={{
                  background: 'transparent',
                  color: secondaryText,
                  border: '1px solid ' + secondaryText,
                  padding: '8px 20px',
                  borderRadius: 30,
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ---- MODE BUTTONS ---- */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setMode('free')}
            style={{
              padding: '12px 32px',
              fontSize: 'clamp(16px, 4vw, 18px)',
              fontWeight: 'bold',
              background: mode === 'free' ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' : darkMode ? '#16213e' : 'white',
              color: mode === 'free' ? 'white' : (darkMode ? headingColor : '#1e3c72'),
              border: mode === 'free' ? 'none' : (darkMode ? `2px solid ${headingColor}` : '2px solid #1e3c72'),
              borderRadius: '50px',
              cursor: 'pointer'
            }}
          >
            🆓 FREE MODE
          </button>
          <button
            onClick={() => setMode('premium')}
            style={{
              padding: '12px 32px',
              fontSize: 'clamp(16px, 4vw, 18px)',
              fontWeight: 'bold',
              background: mode === 'premium' ? 'linear-gradient(135deg, #ff9800 0%, #e65100 100%)' : darkMode ? '#16213e' : 'white',
              color: mode === 'premium' ? 'white' : (darkMode ? headingColor : '#ff9800'),
              border: mode === 'premium' ? 'none' : (darkMode ? `2px solid ${headingColor}` : '2px solid #ff9800'),
              borderRadius: '50px',
              cursor: 'pointer'
            }}
          >
            ⭐ PREMIUM MODE
          </button>
        </div>

        {/* ---- MODE INFO BANNERS ---- */}
        {mode === 'free' && (
          <div style={{ background: darkMode ? '#2d2d3d' : '#e8f5e9', padding: 16, borderRadius: 12, textAlign: 'center', marginBottom: 24 }}>
            <p style={{ color: headingColor, margin: 0, fontSize: 'clamp(14px, 4vw, 16px)' }}>
              🎯 <strong>Free Mode:</strong> Take each examination ONCE. Upgrade to retake exams and unlock all questions!
            </p>
          </div>
        )}
        {mode === 'premium' && (
          <div style={{ background: darkMode ? '#2d2d3d' : '#e8f5e9', padding: 16, borderRadius: 12, textAlign: 'center', marginBottom: 24 }}>
            <p style={{ color: '#ff9800', margin: 0, fontSize: 'clamp(14px, 4vw, 16px)' }}>
              ⭐ <strong>Premium Mode:</strong> {user?.isPremium ? 'Full access to all examinations!' : 'Upgrade to unlock unlimited access!'}
            </p>
          </div>
        )}

        {/* ===== MAIN CONTENT: Search Results OR Categories Grid ===== */}
        {hasSearchResults ? (
          // Show search results (only if there are results)
          renderSearchResults()
        ) : (
          // Always show categories grid, and if search term exists but no results, show a message above it
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
                    background: searchButtonBg,  // ← now respects mode
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

            {/* Category grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', rowGap: 24, columnGap: 24 }}>
              {displayCategories.map((cat) => (
                <Link to={`/courses/${cat.slug}/${mode}`} key={cat.slug} style={{ textDecoration: 'none' }}>
                  <div style={{ 
                    background: darkMode ? '#16213e' : 'white', 
                    padding: 24, 
                    borderRadius: 20, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                    textAlign: 'center',
                    transition: 'transform 0.2s',
                    cursor: 'pointer',
                    borderBottom: `4px solid ${mode === 'free' ? '#1e3c72' : '#ff9800'}`
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ fontSize: 56, marginBottom: 12 }}>{cat.icon}</div>
                    <h2 style={{ color: darkMode ? headingColor : (mode === 'free' ? '#1e3c72' : '#ff9800'), fontSize: 'clamp(18px, 4vw, 20px)', marginBottom: 8 }}>{cat.name}</h2>
                    <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 14, marginBottom: 12 }}>{cat.topicCount} courses</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ background: darkMode ? '#333' : '#e8f5e9', color: headingColor, padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>🎯 Free Exam 1</span>
                      <span style={{ background: '#fff3e0', color: '#ff9800', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>⭐ Premium</span>
                    </div>
                    <button style={{ marginTop: 16, background: mode === 'free' ? '#1e3c72' : '#ff9800', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 30, cursor: 'pointer', fontWeight: 'bold', fontSize: 14, width: '100%' }}>
                      Explore Courses →
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
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