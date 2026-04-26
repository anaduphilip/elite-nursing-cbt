import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.baseURL = API_URL;

const AuthContext = createContext();

// Loading Spinner Component
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100%',
    background: '#f0f7f4'
  }}>
    <div style={{
      width: 50,
      height: 50,
      border: '4px solid #e0e0e0',
      borderTop: '4px solid #2E7D64',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Timer Component
const Timer = ({ duration, onTimeUp }) => {
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
      background: isWarning ? '#f44336' : '#2E7D64',
      color: 'white',
      padding: '12px 20px',
      textAlign: 'center',
      fontSize: 24,
      fontWeight: 'bold',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      ⏰ {minutes}:{seconds.toString().padStart(2, '0')}
      {isWarning && <span style={{ marginLeft: 10, fontSize: 14 }}>⚠️ TIME RUNNING OUT!</span>}
    </div>
  );
};

// Premium Modal Component
const PremiumModal = ({ onClose, examTitle, sectionNumber }) => {
  const { token, user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/initialize-payment', { email: user?.email, amount: 5900 }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.setItem('payment_reference', response.data.reference);
      window.location.href = response.data.authorization_url;
    } catch (error) {
      alert('Payment initialization failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 2000
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 30, maxWidth: 400,
        textAlign: 'center', margin: '20px'
      }}>
        <div style={{ fontSize: 50 }}>⭐</div>
        <h2 style={{ color: '#2E7D64' }}>Premium Required</h2>
        <p><strong>{examTitle} - Examination {sectionNumber}</strong> is premium. Upgrade to unlock ALL exams!</p>
        <div style={{ fontSize: 28, fontWeight: 'bold', color: '#2E7D64', margin: '15px 0' }}>
          ₦5,900 <span style={{ fontSize: 14, color: '#666' }}>/ lifetime</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: '#6c757d', color: 'white', padding: 12, border: 'none', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handlePayment} disabled={loading} style={{ flex: 1, background: '#ff9800', color: 'white', padding: 12, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Processing...' : 'Pay ₦5,900'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Modern Login Component
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post('/api/login', { email, password });
      login(res.data.token, res.data.user);
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: 450, width: '100%', background: 'white', borderRadius: 24, padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <h1 style={{ color: '#2E7D64', fontSize: 28, margin: 0, fontWeight: 'bold' }}>Welcome Back</h1>
          <p style={{ color: '#666', marginTop: 8 }}>Sign in to continue your learning journey</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#333', fontWeight: 500 }}>Email Address</label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={{ width: '100%', padding: '14px 16px', border: '2px solid #e0e0e0', borderRadius: 12, fontSize: 16, transition: 'all 0.3s', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = '#2E7D64'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              required 
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#333', fontWeight: 500 }}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={{ width: '100%', padding: '14px 16px', border: '2px solid #e0e0e0', borderRadius: 12, fontSize: 16, transition: 'all 0.3s', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = '#2E7D64'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              width: '100%', 
              background: 'linear-gradient(135deg, #2E7D64 0%, #1B5E4A 100%)', 
              color: 'white', 
              padding: '14px', 
              border: 'none', 
              borderRadius: 12, 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: 16,
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.3s'
            }}
          >
            {isLoading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 24, color: '#666' }}>
          Don't have an account? <Link to="/register" style={{ color: '#2E7D64', fontWeight: 'bold', textDecoration: 'none' }}>Create Account</Link>
        </p>
      </div>
    </div>
  );
};

// Modern Register Component
const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post('/api/register', { email, password });
      login(res.data.token, res.data.user);
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: 450, width: '100%', background: 'white', borderRadius: 24, padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
          <h1 style={{ color: '#2E7D64', fontSize: 28, margin: 0, fontWeight: 'bold' }}>Get Started</h1>
          <p style={{ color: '#666', marginTop: 8 }}>Create your account to begin</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#333', fontWeight: 500 }}>Email Address</label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={{ width: '100%', padding: '14px 16px', border: '2px solid #e0e0e0', borderRadius: 12, fontSize: 16, transition: 'all 0.3s', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = '#2E7D64'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              required 
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#333', fontWeight: 500 }}>Password</label>
            <input 
              type="password" 
              placeholder="Create a strong password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={{ width: '100%', padding: '14px 16px', border: '2px solid #e0e0e0', borderRadius: 12, fontSize: 16, transition: 'all 0.3s', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = '#2E7D64'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              width: '100%', 
              background: 'linear-gradient(135deg, #2E7D64 0%, #1B5E4A 100%)', 
              color: 'white', 
              padding: '14px', 
              border: 'none', 
              borderRadius: 12, 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              fontSize: 16,
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.3s'
            }}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 24, color: '#666' }}>
          Already have an account? <Link to="/login" style={{ color: '#2E7D64', fontWeight: 'bold', textDecoration: 'none' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

// Quiz List Component
const QuizList = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, darkMode } = useContext(AuthContext);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await axios.get('/api/quizzes', { headers: { Authorization: `Bearer ${token}` } });
        setQuizzes(res.data);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [token]);

  const groupedQuizzes = quizzes.reduce((acc, quiz) => {
    let displayCategory = 'General Nursing';
    if (quiz.category === 'midwifery') displayCategory = 'Midwifery';
    else if (quiz.category === 'public-health') displayCategory = 'Public Health';
    else if (quiz.category === 'pediatric-nursing') displayCategory = 'Pediatric Nursing';
    else if (quiz.category === 'general-nursing') displayCategory = 'General Nursing';
    
    if (!acc[displayCategory]) acc[displayCategory] = [];
    acc[displayCategory].push(quiz);
    return acc;
  }, {});

  const categoryConfig = {
    'General Nursing': { icon: '🩺', color: '#2E7D64', description: 'Comprehensive nursing practice questions for exam success.', slug: 'general-nursing' },
    'Midwifery': { icon: '🤰', color: '#2E7D64', description: 'Specialized midwifery practice questions for certification.', slug: 'midwifery' },
    'Public Health': { icon: '🌍', color: '#2E7D64', description: 'Community and public health nursing practice questions.', slug: 'public-health' },
    'Pediatric Nursing': { icon: '👶', color: '#2E7D64', description: 'Child health nursing practice questions for pediatric certification.', slug: 'pediatric-nursing' }
  };

  const calculateTotalQuestions = (categoryQuizzes) => {
    return categoryQuizzes.reduce((total, quiz) => total + (quiz.questions?.length || 0), 0);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#2E7D64', fontSize: 'clamp(24px, 5vw, 36px)', marginBottom: '10px' }}>ELITE NURSING & MIDWIFERY CBT</h1>
          <p style={{ color: darkMode ? '#aaa' : '#666', fontSize: 'clamp(14px, 4vw, 18px)' }}>Computer Based Testing Platform</p>
        </div>
        
        <h2 style={{ color: '#2E7D64', marginBottom: '20px', fontSize: 'clamp(20px, 4vw, 24px)' }}>📚 Available Categories</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          {Object.entries(groupedQuizzes).map(([categoryName, categoryQuizzes]) => {
            const config = categoryConfig[categoryName];
            const totalQuestions = calculateTotalQuestions(categoryQuizzes);
            
            return (
              <div key={categoryName} style={{ background: darkMode ? '#16213e' : 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderLeft: `5px solid ${config.color}` }}>
                <div style={{ fontSize: '40px' }}>{config.icon}</div>
                <h3 style={{ color: config.color, marginBottom: '10px' }}>{categoryName.toUpperCase()}</h3>
                <p style={{ color: darkMode ? '#aaa' : '#666', marginBottom: '15px' }}>{config.description}</p>
                <p><strong style={{ color: config.color }}>Quizzes:</strong> {categoryQuizzes.length} <span style={{ color: darkMode ? '#aaa' : '#666' }}>({totalQuestions.toLocaleString()} Questions)</span></p>
                <Link to={`/category/${config.slug}`}>
                  <button style={{ width: '100%', background: config.color, color: 'white', padding: '12px', border: 'none', borderRadius: '10px', marginTop: '15px', cursor: 'pointer', fontWeight: 'bold' }}>View Examinations →</button>
                </Link>
              </div>
            );
          })}
        </div>

        <h2 style={{ color: '#ff9800', marginBottom: '20px', fontSize: 'clamp(20px, 4vw, 24px)' }}>⏳ Coming Soon</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ background: darkMode ? '#16213e' : 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '2px dashed #ff9800', opacity: 0.8, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '15px', right: '-30px', background: '#ff9800', color: 'white', padding: '5px 40px', transform: 'rotate(45deg)', fontSize: '12px', fontWeight: 'bold' }}>COMING SOON</div>
            <div style={{ fontSize: '40px', opacity: 0.6 }}>🦷</div>
            <h3 style={{ color: '#ff9800', marginBottom: '10px' }}>DENTAL NURSING</h3>
            <p style={{ color: darkMode ? '#aaa' : '#666' }}>Dental nursing practice questions coming soon!</p>
            <button disabled style={{ width: '100%', background: '#ccc', color: '#666', padding: '12px', border: 'none', borderRadius: '10px', marginTop: '15px', cursor: 'not-allowed', fontWeight: 'bold' }}>🚀 Coming Soon</button>
          </div>
          <div style={{ background: darkMode ? '#16213e' : 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '2px dashed #ff9800', opacity: 0.8, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '15px', right: '-30px', background: '#ff9800', color: 'white', padding: '5px 40px', transform: 'rotate(45deg)', fontSize: '12px', fontWeight: 'bold' }}>COMING SOON</div>
            <div style={{ fontSize: '40px', opacity: 0.6 }}>🇺🇸</div>
            <h3 style={{ color: '#ff9800', marginBottom: '10px' }}>NCLEX PRACTICE</h3>
            <p style={{ color: darkMode ? '#aaa' : '#666' }}>NCLEX-RN preparation questions coming soon!</p>
            <button disabled style={{ width: '100%', background: '#ccc', color: '#666', padding: '12px', border: 'none', borderRadius: '10px', marginTop: '15px', cursor: 'not-allowed', fontWeight: 'bold' }}>🚀 Coming Soon</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Category View Component
const CategoryView = () => {
  const { categoryName } = useParams();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, darkMode } = useContext(AuthContext);

  const slugToCategory = {
    'general-nursing': 'general-nursing',
    'midwifery': 'midwifery',
    'public-health': 'public-health',
    'pediatric-nursing': 'pediatric-nursing'
  };
  
  const actualCategory = slugToCategory[categoryName] || categoryName;

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await axios.get('/api/quizzes', { headers: { Authorization: `Bearer ${token}` } });
        const filtered = res.data.filter(q => q.category === actualCategory);
        setQuizzes(filtered);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [categoryName, token, actualCategory]);

  const getCategoryMeta = () => {
    switch(actualCategory) {
      case 'general-nursing': return { title: 'GENERAL NURSING', icon: '🩺', color: '#2E7D64', description: 'Comprehensive nursing practice questions' };
      case 'midwifery': return { title: 'MIDWIFERY', icon: '🤰', color: '#2E7D64', description: 'Specialized midwifery practice questions' };
      case 'public-health': return { title: 'PUBLIC HEALTH', icon: '🌍', color: '#2E7D64', description: 'Community and public health nursing' };
      case 'pediatric-nursing': return { title: 'PEDIATRIC NURSING', icon: '👶', color: '#2E7D64', description: 'Child health nursing practice questions' };
      default: return { title: 'EXAMINATIONS', icon: '📚', color: '#2E7D64', description: 'Practice questions' };
    }
  };

  const meta = getCategoryMeta();

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: meta.color, color: 'white', padding: '10px 20px', borderRadius: '30px', textDecoration: 'none', marginBottom: '20px', fontWeight: 'bold' }}>
          ← Back to Categories
        </Link>
        
        <div style={{ background: `linear-gradient(135deg, ${meta.color} 0%, #1B5E4A 100%)`, borderRadius: '20px', padding: '30px', marginBottom: '30px', color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: '50px' }}>{meta.icon}</div>
          <h1 style={{ margin: 0, fontSize: 'clamp(24px, 5vw, 32px)' }}>{meta.title}</h1>
          <p style={{ marginTop: '10px' }}>{meta.description}</p>
          <p>{quizzes.length} quizzes available</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {quizzes.map(quiz => {
            const totalQuestions = quiz.questions?.length || 0;
            const examCount = Math.ceil(totalQuestions / 20);
            
            return (
              <div key={quiz._id} style={{ background: darkMode ? '#16213e' : 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '40px' }}>📚</div>
                <h3 style={{ color: meta.color, marginBottom: '10px', fontSize: 'clamp(18px, 4vw, 22px)' }}>{quiz.title}</h3>
                <p style={{ color: darkMode ? '#aaa' : '#666', marginBottom: '15px' }}>{quiz.description}</p>
                <p><strong style={{ color: meta.color }}>Questions:</strong> {totalQuestions.toLocaleString()}</p>
                <p><strong style={{ color: meta.color }}>Exams:</strong> {examCount} (20 questions each)</p>
                <Link to={`/exam/${quiz._id}`}>
                  <button style={{ width: '100%', background: meta.color, color: 'white', padding: '12px', border: 'none', borderRadius: '10px', marginTop: '15px', cursor: 'pointer', fontWeight: 'bold' }}>View Examinations</button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Exam Detail Component
const ExamDetail = () => {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [sections, setSections] = useState([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [userPremium, setUserPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastScores, setLastScores] = useState({});
  const { token, logout, darkMode } = useContext(AuthContext);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        if (!token) return;
        
        const res = await axios.get(`/api/quizzes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setExam(res.data);
        
        const totalQuestions = res.data.questions.length;
        const sectionsArray = [];
        let startIndex = 0;
        let sectionNumber = 1;
        const batchSize = 20;
        
        while (startIndex < totalQuestions) {
          let endIndex = startIndex + batchSize;
          if (endIndex > totalQuestions) endIndex = totalQuestions;
          sectionsArray.push({
            number: sectionNumber,
            count: endIndex - startIndex,
            isPremium: sectionNumber > 1,
            timeMinutes: endIndex - startIndex
          });
          startIndex = endIndex;
          sectionNumber++;
        }
        setSections(sectionsArray);
        
        const profileRes = await axios.get('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } });
        setUserPremium(profileRes.data.isPremium);
        
        const savedScores = localStorage.getItem(`exam_${id}_scores`);
        if (savedScores) {
          setLastScores(JSON.parse(savedScores));
        }
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth');
          logout();
          window.location.href = '/login';
        } else {
          alert('Error loading exam: ' + (error.response?.data?.error || error.message));
        }
      } finally {
        setLoading(false);
      }
    };
    if (id && token) fetchExam();
  }, [id, token, logout]);

  const getCategorySlug = () => {
    if (!exam?.category) return '/';
    if (exam.category === 'general-nursing') return '/category/general-nursing';
    if (exam.category === 'midwifery') return '/category/midwifery';
    if (exam.category === 'public-health') return '/category/public-health';
    if (exam.category === 'pediatric-nursing') return '/category/pediatric-nursing';
    return '/';
  };

  const handleStartExam = (section) => {
    if (section.isPremium && !userPremium) {
      setSelectedSection(section);
      setShowPremiumModal(true);
    } else {
      window.location.href = `/take/${id}/${section.number}`;
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!exam) return <div style={{ textAlign: 'center', padding: '50px' }}>Exam not found</div>;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} examTitle={exam.title} sectionNumber={selectedSection?.number} />}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Link to={getCategorySlug()} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#2E7D64', color: 'white', padding: '10px 20px', borderRadius: '30px', textDecoration: 'none', marginBottom: '20px', fontWeight: 'bold' }}>
          ← Back to Category
        </Link>
        
        <div style={{ background: 'linear-gradient(135deg, #2E7D64 0%, #1B5E4A 100%)', borderRadius: '20px', padding: '30px', marginBottom: '30px', color: 'white', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(24px, 5vw, 32px)' }}>{exam.title}</h1>
          <p style={{ marginTop: '10px' }}>{exam.description}</p>
          <p>📚 Total Questions: {exam.questions?.length || 0}</p>
          {userPremium && <p style={{ marginTop: '10px', background: '#ff9800', display: 'inline-block', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold' }}>⭐ PREMIUM USER - All exams unlocked!</p>}
        </div>
        
        <h2 style={{ color: '#2E7D64', marginBottom: '20px' }}>Select Examination:</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {sections.map((section) => {
            const lastScore = lastScores[section.number];
            return (
              <div key={section.number} style={{ background: darkMode ? '#16213e' : 'white', padding: '20px', borderRadius: '16px', textAlign: 'center', position: 'relative', border: (section.isPremium && !userPremium) ? '2px solid #ff9800' : '2px solid #2E7D64' }}>
                {(section.isPremium && !userPremium) && <div style={{ position: 'absolute', top: '-12px', right: '20px', background: '#ff9800', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>⭐ PREMIUM</div>}
                {userPremium && section.isPremium && <div style={{ position: 'absolute', top: '-12px', right: '20px', background: '#2E7D64', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>✅ UNLOCKED</div>}
                <div style={{ fontSize: '40px' }}>{section.isPremium && !userPremium ? '⭐' : '📝'}</div>
                <h3 style={{ color: '#2E7D64', marginTop: '10px' }}>Examination {section.number}</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2E7D64', margin: '10px 0' }}>{section.count} Questions</p>
                <p style={{ color: '#ff9800', fontWeight: 'bold' }}>⏰ {section.timeMinutes} minutes</p>
                {lastScore && (
                  <div style={{ marginTop: '10px', padding: '8px', background: '#e8f5e9', borderRadius: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#2E7D64' }}>📊 Last Score: </span>
                    <strong style={{ fontSize: '18px', color: '#2E7D64' }}>{lastScore.score}/{lastScore.total}</strong>
                    <span style={{ fontSize: '14px', color: '#666' }}> ({lastScore.percentage}%)</span>
                  </div>
                )}
                <button onClick={() => handleStartExam(section)} style={{ width: '100%', background: (section.isPremium && !userPremium) ? '#ff9800' : '#2E7D64', color: 'white', padding: '12px', border: 'none', borderRadius: '10px', marginTop: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {(section.isPremium && !userPremium) ? '⭐ Upgrade to Access' : (lastScore ? '🔄 Retake Exam' : 'Start Exam')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Take Exam Component
const TakeExam = () => {
  const { id, sectionNumber } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const { token, darkMode } = useContext(AuthContext);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await axios.get(`/api/quizzes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setExam(res.data);
        
        const sectionNum = parseInt(sectionNumber);
        const startIndex = (sectionNum - 1) * 20;
        let endIndex = startIndex + 20;
        if (endIndex > res.data.questions.length) endIndex = res.data.questions.length;
        setQuestions(res.data.questions.slice(startIndex, endIndex));
        
        setAnswers({});
        setSubmitted(false);
        setResult(null);
        setShowReview(false);
        setTimeUp(false);
      } catch (error) {
        alert('Error loading exam: ' + error.message);
      }
    };
    if (id) fetchExam();
  }, [id, sectionNumber, token]);

  const handleAnswer = (qIndex, answerIndex) => {
    setAnswers({ ...answers, [qIndex]: answerIndex });
  };

  const handleTimeUp = () => { 
    setTimeUp(true); 
    handleSubmit(); 
  };

  const handleSubmit = () => {
    let score = 0;
    questions.forEach((question, idx) => {
      if (answers[idx] !== undefined && answers[idx] === question.correctAnswer) {
        score++;
      }
    });
    const percentage = ((score / questions.length) * 100).toFixed(1);
    const total = questions.length;
    
    setResult({ score, total, percentage, passed: percentage >= 70 });
    setSubmitted(true);
    
    const savedScores = localStorage.getItem(`exam_${id}_scores`);
    const scores = savedScores ? JSON.parse(savedScores) : {};
    scores[sectionNumber] = { score, total, percentage };
    localStorage.setItem(`exam_${id}_scores`, JSON.stringify(scores));
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const allAnswered = answeredCount === totalQuestions;

  if (!exam) return <LoadingSpinner />;

  if (submitted && !showReview) {
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '500px', width: '100%', background: darkMode ? '#16213e' : 'white', borderRadius: '20px', padding: '30px', textAlign: 'center' }}>
          <h2 style={{ color: '#2E7D64' }}>Exam Results</h2>
          <p style={{ fontSize: '32px', margin: '20px 0' }}>Score: <strong style={{ color: '#2E7D64' }}>{result.score}</strong> / {result.total}</p>
          <p style={{ fontSize: '24px', marginBottom: '20px' }}>Percentage: <strong>{result.percentage}%</strong></p>
          <p style={{ fontSize: '24px', color: result.passed ? '#2E7D64' : '#dc3545', fontWeight: 'bold' }}>
            {result.passed ? '✓ PASSED!' : '✗ Failed'}
          </p>
          {timeUp && <p style={{ color: '#ff9800' }}>⏰ Time's up!</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button onClick={() => setShowReview(true)} style={{ flex: 1, background: '#2E7D64', color: 'white', padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Review Answers</button>
            <Link to={`/exam/${id}`} style={{ flex: 1 }}>
              <button style={{ width: '100%', background: '#6c757d', color: 'white', padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Back to Exams</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted && showReview) {
    const globalStart = (parseInt(sectionNumber) - 1) * 20;
    return (
      <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ color: '#2E7D64' }}>Answer Review: {exam.title}</h2>
            <p>Score: {result.score}/{result.total} ({result.percentage}%)</p>
            <Link to={`/exam/${id}`}>
              <button style={{ background: '#2E7D64', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}>Take New Attempt →</button>
            </Link>
          </div>
          {questions.map((q, idx) => {
            const userAnswer = answers[idx];
            const isCorrect = userAnswer !== undefined && userAnswer === q.correctAnswer;
            return (
              <div key={idx} style={{ background: darkMode ? '#16213e' : 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px', borderLeft: `5px solid ${isCorrect ? '#4caf50' : '#f44336'}` }}>
                <h4>Question {globalStart + idx + 1}: {q.questionText}</h4>
                {userAnswer === undefined && <p style={{ color: '#ff9800' }}>⚠️ Unanswered</p>}
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} style={{ padding: '10px', margin: '5px 0', background: optIdx === q.correctAnswer ? '#c8e6c9' : (optIdx === userAnswer ? '#ffcdd2' : '#f5f5f5'), borderRadius: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>{String.fromCharCode(65 + optIdx)}.</span> {opt}
                    {optIdx === q.correctAnswer && <span style={{ color: '#4caf50', marginLeft: '10px' }}>✓ Correct</span>}
                    {optIdx === userAnswer && optIdx !== q.correctAnswer && <span style={{ color: '#f44336', marginLeft: '10px' }}>✗ Your Answer</span>}
                  </div>
                ))}
              </div>
            );
          })}
          <Link to={`/exam/${id}`}>
            <button style={{ width: '100%', background: '#2E7D64', color: 'white', padding: '14px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Back to Examinations</button>
          </Link>
        </div>
      </div>
    );
  }

  const globalStart = (parseInt(sectionNumber) - 1) * 20;
  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh' }}>
      <Timer duration={questions.length} onTimeUp={handleTimeUp} />
      <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
          <h2 style={{ color: '#2E7D64', margin: 0 }}>{exam.title}</h2>
          <p>Examination {sectionNumber} - {questions.length} Questions</p>
          <p style={{ color: '#ff9800' }}>⏰ Timer: {questions.length} minute(s)</p>
          <div style={{ marginTop: '10px', padding: '10px', background: '#e8f5e9', borderRadius: '8px', display: 'inline-block' }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#2E7D64' }}>
              📝 Answered: {answeredCount} / {totalQuestions} 
              {allAnswered && <span style={{ marginLeft: '10px', color: '#4caf50' }}>✅ All questions answered!</span>}
            </span>
          </div>
        </div>
        {questions.map((q, idx) => (
          <div key={idx} style={{ background: '#2E7D64', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h4 style={{ color: 'white', margin: 0 }}>Question {globalStart + idx + 1}</h4>
              {answers[idx] !== undefined && (
                <span style={{ background: '#4caf50', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  ✓ Answered
                </span>
              )}
            </div>
            <p style={{ color: 'white', marginBottom: '20px' }}>{q.questionText}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {q.options.map((opt, optIdx) => {
                const isSelected = answers[idx] === optIdx;
                return (
                  <label key={optIdx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer', 
                    padding: '12px', 
                    margin: '0',
                    background: isSelected ? '#ff9800' : 'white', 
                    borderRadius: '10px',
                    transition: 'all 0.2s ease'
                  }}>
                    <input 
                      type="radio" 
                      name={`q${idx}`} 
                      onChange={() => handleAnswer(idx, optIdx)} 
                      checked={isSelected}
                      style={{ marginRight: '15px', cursor: 'pointer' }} 
                    />
                    <span style={{ fontWeight: 'bold', marginRight: '10px' }}>{String.fromCharCode(65 + optIdx)}.</span> 
                    <span style={{ flex: 1 }}>{opt}</span>
                    {isSelected && <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: 'bold' }}>✓ Selected</span>}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
        <button 
          onClick={handleSubmit} 
          disabled={!allAnswered}
          style={{ 
            width: '100%', 
            background: allAnswered ? '#28a745' : '#ccc', 
            color: 'white', 
            padding: '16px', 
            border: 'none', 
            borderRadius: '50px', 
            cursor: allAnswered ? 'pointer' : 'not-allowed', 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '30px' 
          }}
        >
          {allAnswered ? 'Submit Examination' : `Please answer all ${totalQuestions} questions (${answeredCount}/${totalQuestions} answered)`}
        </button>
      </div>
    </div>
  );
};

// About Us Component - Original style
const AboutUs = () => {
  const { darkMode } = useContext(AuthContext);
  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: darkMode ? '#16213e' : 'white', borderRadius: '20px', padding: '30px', color: darkMode ? '#eee' : '#333', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#2E7D64', textAlign: 'center', marginBottom: 20 }}>About Us</h2>
        <p style={{ lineHeight: 1.8, marginBottom: '20px' }}>ELITE NURSING & MIDWIFERY CBT is a premier Computer Based Testing platform designed specifically for nursing and midwifery students in Nigeria.</p>
        <p style={{ lineHeight: 1.8, marginBottom: '20px' }}>Our mission is to provide high-quality, accessible exam preparation materials that help students succeed in their nursing and midwifery licensing examinations.</p>
        <p style={{ lineHeight: 1.8, marginBottom: '20px' }}>With over 15,000 practice questions covering General Nursing, Midwifery, Pediatric Nursing, and Public Health, we are committed to excellence in nursing education.</p>
        <h3 style={{ color: '#2E7D64', marginTop: '30px' }}>Coming Soon</h3>
        <p>Dental Nursing and NCLEX Practice questions are coming soon!</p>
      </div>
    </div>
  );
};

// Contact Us Component - Original style
const ContactUs = () => {
  const { darkMode } = useContext(AuthContext);
  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: darkMode ? '#16213e' : 'white', borderRadius: '20px', padding: '30px', color: darkMode ? '#eee' : '#333', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#2E7D64', textAlign: 'center', marginBottom: 20 }}>Contact Us</h2>
        <p style={{ textAlign: 'center', marginBottom: 30 }}>Have questions? We'd love to hear from you!</p>
        <div style={{ margin: '30px 0', textAlign: 'center' }}>
          <h3 style={{ color: '#2E7D64' }}>📧 Email</h3>
          <p>anaduphilip2000@gmail.com</p>
        </div>
        <div style={{ margin: '30px 0', textAlign: 'center' }}>
          <h3 style={{ color: '#2E7D64' }}>📞 Phone / WhatsApp</h3>
          <p>09063908476</p>
        </div>
        <div style={{ margin: '30px 0', textAlign: 'center' }}>
          <h3 style={{ color: '#2E7D64' }}>💬 WhatsApp Group</h3>
          <a href="https://chat.whatsapp.com/HdpwnXzyrLrIqwnpjZqVsb" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', textDecoration: 'none', fontWeight: 'bold' }}>Click here to join our WhatsApp community</a>
        </div>
      </div>
    </div>
  );
};

// Join WhatsApp Component - Well arranged
const JoinWhatsApp = () => {
  const { darkMode } = useContext(AuthContext);
  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: darkMode ? '#16213e' : 'white', borderRadius: '20px', padding: '40px', textAlign: 'center', color: darkMode ? '#eee' : '#333', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '80px', marginBottom: 20 }}>💬</div>
        <h2 style={{ color: '#2E7D64', marginBottom: 15 }}>Join Our WhatsApp Community</h2>
        <p style={{ marginBottom: 30, fontSize: 16 }}>Get instant updates, study tips, and connect with fellow nursing students!</p>
        <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', padding: '25px', borderRadius: '15px', margin: '20px 0', textAlign: 'left' }}>
          <h3 style={{ color: '#2E7D64', marginBottom: 15 }}>What you'll get:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: 10 }}>✓ Daily practice questions</li>
            <li style={{ marginBottom: 10 }}>✓ Exam tips and strategies</li>
            <li style={{ marginBottom: 10 }}>✓ Updates on new features</li>
            <li style={{ marginBottom: 10 }}>✓ Peer support and discussions</li>
            <li style={{ marginBottom: 10 }}>✓ Special announcements</li>
          </ul>
        </div>
        <a href="https://chat.whatsapp.com/HdpwnXzyrLrIqwnpjZqVsb" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button style={{ background: '#25D366', color: 'white', padding: '14px 40px', border: 'none', borderRadius: '50px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', transition: 'transform 0.2s' }}>
            Join WhatsApp Group
          </button>
        </a>
      </div>
    </div>
  );
};

// Get Premium Component - Original style
const GetPremium = () => {
  const { token, user, darkMode } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/initialize-payment', { email: user?.email, amount: 5900 }, { headers: { Authorization: `Bearer ${token}` } });
      localStorage.setItem('payment_reference', response.data.reference);
      window.location.href = response.data.authorization_url;
    } catch (error) {
      alert('Payment initialization failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', background: darkMode ? '#16213e' : 'white', borderRadius: '20px', padding: '30px', textAlign: 'center', color: darkMode ? '#eee' : '#333', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '64px', marginBottom: 20 }}>⭐</div>
        <h2 style={{ color: '#2E7D64', marginBottom: 10 }}>Upgrade to Premium</h2>
        <p style={{ fontSize: '18px', marginBottom: 30 }}>Get unlimited access to all examinations and features</p>
        {user?.isPremium ? (
          <div style={{ background: '#e8f5e9', padding: '30px', borderRadius: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: 10 }}>✅</div>
            <h3 style={{ color: '#2E7D64' }}>You are already a Premium Member!</h3>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', margin: '30px 0' }}>
              <div>
                <div style={{ fontSize: '36px', marginBottom: 10 }}>📚</div>
                <h3>All Subjects</h3>
              </div>
              <div>
                <div style={{ fontSize: '36px', marginBottom: 10 }}>📝</div>
                <h3>All Exams</h3>
              </div>
              <div>
                <div style={{ fontSize: '36px', marginBottom: 10 }}>🎯</div>
                <h3>15,000+ Questions</h3>
              </div>
              <div>
                <div style={{ fontSize: '36px', marginBottom: 10 }}>🏆</div>
                <h3>Lifetime Access</h3>
              </div>
            </div>
            <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', padding: '20px', borderRadius: '15px', margin: '20px 0' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2E7D64' }}>₦5,900 <span style={{ fontSize: '18px', color: '#666' }}>/ lifetime</span></div>
            </div>
            <button onClick={handlePayment} disabled={loading} style={{ background: '#ff9800', color: 'white', padding: '16px 40px', border: 'none', borderRadius: '50px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', transition: 'transform 0.2s' }}>
              {loading ? 'Processing...' : 'Upgrade to Premium Now'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Dropdown Menu Component
const DropdownMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, darkMode, toggleDarkMode } = useContext(AuthContext);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ background: '#2E7D64', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 16px', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
        ☰ Menu
      </button>
      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 198 }} />
          <div style={{ position: 'absolute', top: '55px', right: 0, width: '260px', background: darkMode ? '#16213e' : 'white', borderRadius: '12px', boxShadow: '0 5px 20px rgba(0,0,0,0.15)', zIndex: 199, overflow: 'hidden' }}>
            <div style={{ padding: '15px', background: '#2E7D64', color: 'white', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold' }}>{user?.email}</div>
              {user?.isPremium && <div style={{ background: '#ff9800', display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', marginTop: '5px' }}>⭐ PREMIUM</div>}
            </div>
            <div style={{ padding: '10px 0' }}>
              <Link to="/" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', textDecoration: 'none', color: darkMode ? '#eee' : '#333', borderBottom: '1px solid #eee' }}>🏠 Home</Link>
              <Link to="/get-premium" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', textDecoration: 'none', color: '#e65100', fontWeight: 'bold', background: '#fff3e0', borderBottom: '1px solid #eee' }}>⭐ Get Premium</Link>
              <Link to="/about" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', textDecoration: 'none', color: darkMode ? '#eee' : '#333', borderBottom: '1px solid #eee' }}>ℹ️ About Us</Link>
              <Link to="/contact" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', textDecoration: 'none', color: darkMode ? '#eee' : '#333', borderBottom: '1px solid #eee' }}>📞 Contact Us</Link>
              <Link to="/whatsapp" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', textDecoration: 'none', color: '#25D366', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>💬 Join WhatsApp</Link>
              <div onClick={() => { toggleDarkMode(); setIsOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid #eee', color: darkMode ? '#eee' : '#333' }}>
                <span style={{ fontSize: '20px' }}>{darkMode ? '☀️' : '🌙'}</span> {darkMode ? 'Light Mode' : 'Dark Mode'}
              </div>
              <button onClick={() => { setIsOpen(false); logout(); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545', fontWeight: 'bold', fontSize: '16px' }}>🚪 Logout</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Main App Component
const AppContent = () => {
  const { token, user, darkMode } = useContext(AuthContext);

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh' }}>
      <nav style={{ background: darkMode ? '#16213e' : 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <h1 style={{ color: '#2E7D64', fontSize: 'clamp(18px, 4vw, 22px)', margin: 0 }}>ELITE NURSING & MIDWIFERY CBT</h1>
          <p style={{ margin: 0, fontSize: '11px', color: '#2E7D64' }}>Computer Based Testing Platform</p>
        </div>
        <DropdownMenu />
      </nav>
      <Routes>
        <Route path="/" element={<QuizList />} />
        <Route path="/category/:categoryName" element={<CategoryView />} />
        <Route path="/get-premium" element={<GetPremium />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/whatsapp" element={<JoinWhatsApp />} />
        <Route path="/exam/:id" element={<ExamDetail />} />
        <Route path="/take/:id/:sectionNumber" element={<TakeExam />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

function App() {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem('auth');
    return saved ? JSON.parse(saved) : { token: null, user: null };
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  const login = (token, user) => {
    setAuth({ token, user });
    localStorage.setItem('auth', JSON.stringify({ token, user }));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    setAuth({ token: null, user: null });
    localStorage.removeItem('auth');
    delete axios.defaults.headers.common['Authorization'];
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', !darkMode);
  };

  if (auth.token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref');
    const storedReference = localStorage.getItem('payment_reference');
    const paymentRef = reference || storedReference;
    
    if (paymentRef && auth.user?.id) {
      const verifyPayment = async () => {
        try {
          const response = await axios.post('/api/verify-payment', { reference: paymentRef, userId: auth.user?.id });
          if (response.data.success) {
            alert('✅ Payment successful! Your account has been upgraded to PREMIUM!');
            localStorage.removeItem('payment_reference');
            setAuth({ ...auth, user: { ...auth.user, isPremium: true } });
            localStorage.setItem('auth', JSON.stringify({ ...auth, user: { ...auth.user, isPremium: true } }));
            window.location.href = '/';
          }
        } catch (error) { console.error('Verification error:', error); }
      };
      verifyPayment();
    }
  }, [auth.user?.id]);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, darkMode, toggleDarkMode }}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;