import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useParams } from 'react-router-dom';
import axios from 'axios';

axios.defaults.baseURL = 'https://elite-nursing-cbt.onrender.com';

const AuthContext = createContext();

// Timer Component
const Timer = ({ duration, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
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
      background: isWarning ? '#f44336' : '#1B5E4A',
      color: 'white',
      padding: '12px 16px',
      textAlign: 'center',
      fontSize: 24,
      fontWeight: 'bold'
    }}>
      ⏰ {minutes}:{seconds.toString().padStart(2, '0')} {isWarning && '⚠️ TIME RUNNING OUT!'}
    </div>
  );
};

// Premium Modal
const PremiumModal = ({ onClose, examId, examTitle, sectionNumber }) => {
  const [selectedPlan, setSelectedPlan] = useState('single');
  const [loading, setLoading] = useState(false);
  const { token, user } = useContext(AuthContext);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/initialize-payment', {
        email: user?.email,
        amount: selectedPlan === 'single' ? 200 : 5900,
        userId: user?.id,
        planType: selectedPlan,
        examId: examId,
        examTitle: examTitle,
        sectionNumber: sectionNumber
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.location.href = response.data.authorization_url;
    } catch (error) {
      alert('Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: 30,
        maxWidth: 450,
        width: '100%',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#2E7D64' }}>Upgrade to Premium</h2>
        <p>{examTitle} - Examination {sectionNumber}</p>
        
        <div style={{ margin: '20px 0' }}>
          <div 
            onClick={() => setSelectedPlan('single')} 
            style={{
              border: selectedPlan === 'single' ? '2px solid #2E7D64' : '1px solid #ddd',
              borderRadius: 10,
              padding: 15,
              marginBottom: 10,
              cursor: 'pointer',
              background: selectedPlan === 'single' ? '#e8f5e9' : 'white'
            }}
          >
            <strong>This Exam Only</strong> - ₦200
          </div>
          <div 
            onClick={() => setSelectedPlan('complete')} 
            style={{
              border: selectedPlan === 'complete' ? '2px solid #ff9800' : '1px solid #ddd',
              borderRadius: 10,
              padding: 15,
              cursor: 'pointer',
              background: selectedPlan === 'complete' ? '#fff3e0' : 'white'
            }}
          >
            <strong>Complete Package</strong> - ₦5,900 (ALL exams)
          </div>
        </div>
        
        <button 
          onClick={handlePayment} 
          disabled={loading} 
          style={{ 
            background: selectedPlan === 'single' ? '#2E7D64' : '#ff9800', 
            color: 'white', 
            padding: 12, 
            border: 'none', 
            borderRadius: 10, 
            width: '100%', 
            cursor: 'pointer', 
            marginBottom: 10,
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Processing...' : `Pay ${selectedPlan === 'single' ? '₦200' : '₦5,900'}`}
        </button>
        <button 
          onClick={onClose} 
          style={{ background: '#6c757d', color: 'white', padding: 12, border: 'none', borderRadius: 10, width: '100%', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Login Component
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/login', { email, password });
      login(res.data.token, res.data.user);
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#2E7D64', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ maxWidth: 400, width: '100%', padding: 40, background: 'white', borderRadius: 20 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 30, color: '#2E7D64' }}>Welcome Back</h2>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 12, margin: '10px 0', border: '1px solid #ddd', borderRadius: 8 }} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 12, margin: '10px 0', border: '1px solid #ddd', borderRadius: 8 }} required />
          <button type="submit" style={{ background: '#2E7D64', color: 'white', padding: 12, width: '100%', border: 'none', borderRadius: 8, marginTop: 20, cursor: 'pointer', fontWeight: 'bold' }}>Login</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20 }}>Don't have an account? <Link to="/register" style={{ color: '#2E7D64', fontWeight: 'bold' }}>Register</Link></p>
      </div>
    </div>
  );
};

// Register Component
const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/register', { email, password });
      login(res.data.token, res.data.user);
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#2E7D64', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ maxWidth: 400, width: '100%', padding: 40, background: 'white', borderRadius: 20 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 30, color: '#2E7D64' }}>Create Account</h2>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 12, margin: '10px 0', border: '1px solid #ddd', borderRadius: 8 }} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 12, margin: '10px 0', border: '1px solid #ddd', borderRadius: 8 }} required />
          <button type="submit" style={{ background: '#2E7D64', color: 'white', padding: 12, width: '100%', border: 'none', borderRadius: 8, marginTop: 20, cursor: 'pointer', fontWeight: 'bold' }}>Register</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20 }}>Already have an account? <Link to="/login" style={{ color: '#2E7D64', fontWeight: 'bold' }}>Login</Link></p>
      </div>
    </div>
  );
};

// Coming Soon Component
const ComingSoon = ({ title }) => {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 40, maxWidth: 500, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 20 }}>🚧</div>
        <h2 style={{ color: '#2E7D64' }}>Coming Soon!</h2>
        <p style={{ color: '#666', marginBottom: 30 }}>We are working hard to bring you questions for {title}.</p>
        <Link to="/">
          <button style={{ background: '#2E7D64', color: 'white', padding: 12, border: 'none', borderRadius: 8, cursor: 'pointer' }}>Back to Home</button>
        </Link>
      </div>
    </div>
  );
};

// About Us Component
const AboutUs = () => {
  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 40 }}>
        <h2 style={{ color: '#2E7D64', marginBottom: 20 }}>About Us</h2>
        <p style={{ lineHeight: 1.8, color: '#666' }}>ELITE NURSING & MIDWIFERY CBT is a premier Computer Based Testing platform designed specifically for nursing and midwifery students in Nigeria.</p>
      </div>
    </div>
  );
};

// Contact Us Component
const ContactUs = () => {
  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 40 }}>
        <h2 style={{ color: '#2E7D64', marginBottom: 20 }}>Contact Us</h2>
        <p>📧 anaduphilip2000@gmail.com</p>
        <p>📞 09063908476</p>
        <a href="https://chat.whatsapp.com/HdpwnXzyrLrIqwnpjZqVsb" target="_blank" rel="noopener noreferrer">💬 Join WhatsApp Group</a>
      </div>
    </div>
  );
};

// Join WhatsApp Component
const JoinWhatsApp = () => {
  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 40 }}>
        <div style={{ fontSize: 80, marginBottom: 20 }}>💬</div>
        <h2 style={{ color: '#2E7D64', marginBottom: 20 }}>Join Our WhatsApp Community</h2>
        <a href="https://chat.whatsapp.com/HdpwnXzyrLrIqwnpjZqVsb" target="_blank" rel="noopener noreferrer">
          <button style={{ background: '#25D366', color: 'white', padding: 12, border: 'none', borderRadius: 50, cursor: 'pointer', fontSize: 16 }}>Join WhatsApp Group</button>
        </a>
      </div>
    </div>
  );
};

// Get Premium Component
const GetPremium = () => {
  const [selectedPlan, setSelectedPlan] = useState('complete');
  const [loading, setLoading] = useState(false);
  const { token, user } = useContext(AuthContext);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/initialize-payment', {
        email: user?.email,
        amount: selectedPlan === 'single' ? 200 : 5900,
        userId: user?.id,
        planType: selectedPlan,
        examId: null,
        examTitle: 'Premium Package',
        sectionNumber: 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.location.href = response.data.authorization_url;
    } catch (error) {
      alert('Payment failed');
      setLoading(false);
    }
  };

  if (user?.isPremium) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <h2 style={{ color: '#2E7D64' }}>You are already a Premium Member! 🎉</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>⭐</div>
        <h2 style={{ color: '#2E7D64' }}>Upgrade to Premium</h2>
        <p style={{ marginBottom: 40 }}>Get unlimited access to all examinations</p>
        
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
          <div 
            onClick={() => setSelectedPlan('single')} 
            style={{ 
              border: selectedPlan === 'single' ? '2px solid #2E7D64' : '1px solid #ddd', 
              borderRadius: 16, 
              padding: 30, 
              cursor: 'pointer', 
              flex: 1, 
              minWidth: 250,
              background: selectedPlan === 'single' ? '#e8f5e9' : 'white'
            }}
          >
            <h3 style={{ color: '#2E7D64' }}>Single Exam</h3>
            <p style={{ fontSize: 32, fontWeight: 'bold', color: '#2E7D64' }}>₦200</p>
            <p>Per premium exam</p>
          </div>
          <div 
            onClick={() => setSelectedPlan('complete')} 
            style={{ 
              border: selectedPlan === 'complete' ? '2px solid #ff9800' : '1px solid #ddd', 
              borderRadius: 16, 
              padding: 30, 
              cursor: 'pointer', 
              flex: 1, 
              minWidth: 250,
              position: 'relative',
              background: selectedPlan === 'complete' ? '#fff3e0' : 'white'
            }}
          >
            {selectedPlan === 'complete' && (
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#ff9800', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 'bold' }}>BEST VALUE</div>
            )}
            <h3 style={{ color: '#e65100' }}>Complete Package</h3>
            <p style={{ fontSize: 32, fontWeight: 'bold', color: '#e65100' }}>₦5,900</p>
            <p>All exams + lifetime access</p>
          </div>
        </div>
        
        <button 
          onClick={handlePayment} 
          disabled={loading} 
          style={{ 
            background: selectedPlan === 'single' ? '#2E7D64' : '#ff9800', 
            color: 'white', 
            padding: '14px 40px', 
            border: 'none', 
            borderRadius: 50, 
            cursor: 'pointer', 
            fontSize: 18, 
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Processing...' : `Pay ${selectedPlan === 'single' ? '₦200' : '₦5,900'}`}
        </button>
      </div>
    </div>
  );
};

// Home Page with Categories
const HomePage = () => {
  const categories = [
    { id: 'general', name: 'General Nursing', icon: '🩺', path: '/general-nursing', available: true },
    { id: 'midwifery', name: 'Midwifery', icon: '👶', path: '/coming-soon/midwifery', available: false },
    { id: 'public-health', name: 'Public Health', icon: '🏥', path: '/coming-soon/public-health', available: false },
    { id: 'dental', name: 'Dental Nursing', icon: '🦷', path: '/coming-soon/dental-nursing', available: false },
    { id: 'pediatric', name: 'Pediatric Nursing', icon: '👧', path: '/coming-soon/pediatric-nursing', available: false },
    { id: 'nclex', name: 'NCLEX Practice', icon: '🇺🇸', path: '/coming-soon/nclex', available: false }
  ];

  return (
    <div style={{ background: '#e8f5e9', minHeight: '100vh' }}>
      <div style={{ padding: 30, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ color: '#2E7D64', fontSize: 36, marginBottom: 10 }}>ELITE NURSING & MIDWIFERY CBT</h1>
          <p style={{ color: '#666', fontSize: 18 }}>Computer Based Testing Platform</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 25 }}>
          {categories.map(cat => (
            <Link key={cat.id} to={cat.path} style={{ textDecoration: 'none' }}>
              <div style={{ 
                background: 'white', 
                padding: 30, 
                borderRadius: 20, 
                textAlign: 'center', 
                border: cat.available ? '2px solid #2E7D64' : '1px solid #ddd',
                transition: 'transform 0.2s'
              }}>
                <div style={{ fontSize: 60, marginBottom: 15 }}>{cat.icon}</div>
                <h3 style={{ color: cat.available ? '#2E7D64' : '#999', marginBottom: 10 }}>{cat.name}</h3>
                {!cat.available && <span style={{ background: '#ff9800', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 'bold' }}>Coming Soon</span>}
                {cat.available && (
                  <button style={{ 
                    marginTop: 15, 
                    background: '#2E7D64', 
                    color: 'white', 
                    padding: 10, 
                    border: 'none', 
                    borderRadius: 8, 
                    width: '100%', 
                    cursor: 'pointer', 
                    fontWeight: 'bold'
                  }}>
                    View Exams →
                  </button>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

// General Nursing Page - Shows ALL quizzes
const GeneralNursing = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    // Fetch ALL quizzes (no category filter)
    axios.get('/api/quizzes', { 
      headers: { Authorization: `Bearer ${token}` } 
    })
      .then(res => {
        console.log('Quizzes loaded:', res.data.length);
        setQuizzes(res.data);
      })
      .catch(err => {
        console.error('Error loading quizzes:', err);
        alert('Error loading quizzes. Please refresh the page.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div style={{ background: '#e8f5e9', minHeight: '100vh', padding: 30 }}>
        <div style={{ textAlign: 'center', padding: 50 }}>
          <p>Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#e8f5e9', minHeight: '100vh' }}>
      <div style={{ padding: 30, maxWidth: 1200, margin: '0 auto' }}>
        <Link to="/" style={{ color: '#2E7D64', textDecoration: 'none', display: 'inline-block', marginBottom: 20, fontSize: 16 }}>
          ← Back to Categories
        </Link>
        <h2 style={{ color: '#2E7D64', marginBottom: 20, fontSize: 28 }}>General Nursing</h2>
        
        {quizzes.length === 0 ? (
          <div style={{ background: 'white', padding: 50, textAlign: 'center', borderRadius: 20 }}>
            <p>No quizzes found. Please check back later.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 25 }}>
            {quizzes.map(quiz => {
              const totalQuestions = quiz.questions?.length || 0;
              const examCount = Math.ceil(totalQuestions / 20);
              return (
                <div key={quiz._id} style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>📚</div>
                  <h3 style={{ color: '#2E7D64', marginBottom: 10, fontSize: 20 }}>{quiz.title}</h3>
                  <p style={{ color: '#666', fontSize: 14, marginBottom: 15, lineHeight: 1.4 }}>{quiz.description}</p>
                  <div style={{ borderTop: '1px solid #eee', paddingTop: 15, marginTop: 5 }}>
                    <p><strong style={{ color: '#2E7D64' }}>Total Questions:</strong> {totalQuestions}</p>
                    <p><strong style={{ color: '#2E7D64' }}>Examinations:</strong> {examCount} exams (20 questions each)</p>
                    <p><strong style={{ color: '#ff9800' }}>⭐ Free:</strong> Exam 1 | <strong style={{ color: '#2E7D64' }}>Premium:</strong> Exams 2+ (₦200 each)</p>
                  </div>
                  <Link to={`/exam/${quiz._id}`}>
                    <button style={{ 
                      background: '#2E7D64', 
                      color: 'white', 
                      padding: 10, 
                      border: 'none', 
                      borderRadius: 8, 
                      marginTop: 15, 
                      width: '100%', 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      fontSize: 14
                    }}>
                      View Examinations
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Exam Detail Component
const ExamDetail = () => {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [sections, setSections] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [userPremium, setUserPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const { token, logout } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [quizRes, profileRes] = await Promise.all([
          axios.get(`/api/quizzes/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        setExam(quizRes.data);
        setUserPremium(profileRes.data.isPremium);
        
        const total = quizRes.data.questions.length;
        const arr = [];
        for (let i = 0; i < total; i += 20) {
          const end = Math.min(i + 20, total);
          arr.push({
            number: arr.length + 1,
            count: end - i,
            startIndex: i + 1,
            endIndex: end,
            isPremium: arr.length + 1 > 1,
            timeMinutes: end - i
          });
        }
        setSections(arr);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('auth');
          logout();
          window.location.href = '/login';
        } else {
          alert('Error loading exam: ' + err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    if (id && token) fetchData();
  }, [id, token, logout]);

  const handleStartExam = async (section) => {
    if (section.isPremium && !userPremium) {
      try {
        const check = await axios.post('/api/check-exam-access', 
          { examId: id, sectionNumber: section.number }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (check.data.hasAccess) {
          window.location.href = `/take/${id}/${section.number}`;
        } else {
          setSelectedSection(section);
          setShowModal(true);
        }
      } catch (err) {
        setSelectedSection(section);
        setShowModal(true);
      }
    } else {
      window.location.href = `/take/${id}/${section.number}`;
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 50 }}>Loading...</div>;
  if (!exam) return <div style={{ textAlign: 'center', padding: 50 }}>Exam not found</div>;

  return (
    <div style={{ background: '#e8f5e9', minHeight: '100vh' }}>
      {showModal && (
        <PremiumModal 
          onClose={() => setShowModal(false)} 
          examId={id} 
          examTitle={exam.title} 
          sectionNumber={selectedSection?.number} 
        />
      )}
      <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
        <Link to="/general-nursing" style={{ color: '#2E7D64', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>← Back to General Nursing</Link>
        
        <div style={{ background: '#2E7D64', borderRadius: 20, padding: 30, marginBottom: 30, color: 'white' }}>
          <h1 style={{ margin: 0, fontSize: 28 }}>{exam.title}</h1>
          <p style={{ marginTop: 10, opacity: 0.9 }}>{exam.description}</p>
          <p style={{ marginTop: 15 }}>📚 Total Questions: {exam.questions?.length || 0}</p>
          {userPremium && <span style={{ background: '#ff9800', display: 'inline-block', padding: '5px 15px', borderRadius: 20, marginTop: 10, fontWeight: 'bold' }}>⭐ PREMIUM USER - All exams unlocked!</span>}
        </div>
        
        <h2 style={{ color: '#2E7D64', marginBottom: 20 }}>Select Examination:</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {sections.map(section => (
            <div key={section.number} style={{ 
              background: 'white', 
              padding: 20, 
              borderRadius: 16, 
              textAlign: 'center',
              border: (section.isPremium && !userPremium) ? '2px solid #ff9800' : '2px solid #2E7D64'
            }}>
              {section.isPremium && !userPremium && (
                <span style={{ background: '#ff9800', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 'bold', display: 'inline-block', marginBottom: 10 }}>⭐ PREMIUM</span>
              )}
              {userPremium && section.isPremium && (
                <span style={{ background: '#2E7D64', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 'bold', display: 'inline-block', marginBottom: 10 }}>✅ UNLOCKED</span>
              )}
              <div style={{ fontSize: 48, marginTop: 10 }}>📝</div>
              <h3 style={{ color: '#2E7D64' }}>Examination {section.number}</h3>
              <p style={{ fontSize: 28, fontWeight: 'bold', color: '#2E7D64', margin: '10px 0' }}>{section.count} Questions</p>
              <p style={{ color: '#666' }}>Questions {section.startIndex} - {section.endIndex}</p>
              <p style={{ color: '#ff9800', fontWeight: 'bold', marginTop: 10 }}>⏰ {section.timeMinutes} minutes</p>
              {section.isPremium && !userPremium && (
                <p style={{ color: '#2E7D64', fontWeight: 'bold', marginTop: 5 }}>₦200 to unlock</p>
              )}
              <button 
                onClick={() => handleStartExam(section)}
                style={{ 
                  background: (section.isPremium && !userPremium) ? '#ff9800' : '#2E7D64', 
                  color: 'white', 
                  padding: 10, 
                  border: 'none', 
                  borderRadius: 8, 
                  marginTop: 15, 
                  cursor: 'pointer', 
                  width: '100%', 
                  fontWeight: 'bold',
                  fontSize: 14
                }}
              >
                {(section.isPremium && !userPremium) ? '⭐ Pay ₦200 to Access' : 'Start Exam'}
              </button>
            </div>
          ))}
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
  const { token } = useContext(AuthContext);

  useEffect(() => {
    axios.get(`/api/quizzes/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setExam(res.data);
        const start = (parseInt(sectionNumber) - 1) * 20;
        const end = Math.min(start + 20, res.data.questions.length);
        setQuestions(res.data.questions.slice(start, end));
      })
      .catch(err => alert('Error loading exam: ' + err.message));
  }, [id, sectionNumber, token]);

  const handleAnswer = (qIdx, aIdx) => setAnswers({ ...answers, [qIdx]: aIdx });
  const handleTimeUp = () => { setTimeUp(true); handleSubmit(); };
  const handleSubmit = () => {
    let score = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) score++;
    });
    const total = questions.length;
    const percentage = (score / total) * 100;
    setResult({ score, total, percentage, passed: percentage >= 70 });
    setSubmitted(true);
  };

  if (!exam) return <div style={{ textAlign: 'center', padding: 50 }}>Loading...</div>;

  if (submitted && !showReview) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h2 style={{ color: '#2E7D64' }}>Exam Results</h2>
        <div style={{ margin: 30 }}>
          <p style={{ fontSize: 32 }}>Score: <strong style={{ color: '#2E7D64' }}>{result.score}</strong> / {result.total}</p>
          <p style={{ fontSize: 24 }}>Percentage: <strong>{result.percentage?.toFixed(1)}%</strong></p>
          <p>Unanswered: {result.total - Object.keys(answers).length} questions</p>
        </div>
        <p style={{ color: result.passed ? '#2E7D64' : '#dc3545', fontSize: 28, fontWeight: 'bold' }}>
          {result.passed ? '✓ PASSED!' : '✗ Failed'}
        </p>
        {timeUp && <p style={{ color: '#ff9800' }}>⏰ Time's up!</p>}
        <div style={{ marginTop: 30 }}>
          <button onClick={() => setShowReview(true)} style={{ background: '#2E7D64', color: 'white', padding: 10, border: 'none', borderRadius: 8, marginRight: 10, cursor: 'pointer' }}>Review Answers</button>
          <Link to={`/exam/${id}`}><button style={{ background: '#6c757d', color: 'white', padding: 10, border: 'none', borderRadius: 8, cursor: 'pointer' }}>Back to Exams</button></Link>
        </div>
      </div>
    );
  }

  if (submitted && showReview) {
    return (
      <div style={{ padding: 20 }}>
        <h2 style={{ color: '#2E7D64' }}>Answer Review</h2>
        {questions.map((q, idx) => {
          const userAnswer = answers[idx];
          const isCorrect = userAnswer === q.correctAnswer;
          return (
            <div key={idx} style={{ margin: 20, padding: 15, background: isCorrect ? '#e8f5e9' : '#ffebee', borderRadius: 10 }}>
              <h4>Question {idx+1}: {q.questionText}</h4>
              {q.options.map((opt, optIdx) => (
                <div key={optIdx} style={{ marginLeft: 20, color: optIdx === q.correctAnswer ? 'green' : (optIdx === userAnswer ? 'red' : 'black') }}>
                  {String.fromCharCode(65+optIdx)}. {opt}
                  {optIdx === q.correctAnswer && ' ✓ Correct Answer'}
                  {optIdx === userAnswer && optIdx !== q.correctAnswer && ' ✗ Your Answer'}
                </div>
              ))}
            </div>
          );
        })}
        <Link to={`/exam/${id}`}><button style={{ background: '#2E7D64', color: 'white', padding: 10, border: 'none', borderRadius: 8, cursor: 'pointer' }}>Back to Exams</button></Link>
      </div>
    );
  }

  const globalStart = (parseInt(sectionNumber)-1)*20;
  return (
    <div>
      <Timer duration={questions.length} onTimeUp={handleTimeUp} />
      <div style={{ padding: 20 }}>
        <h2 style={{ color: '#2E7D64' }}>{exam.title} - Examination {sectionNumber}</h2>
        <p>{questions.length} Questions</p>
        {questions.map((q, idx) => (
          <div key={idx} style={{ background: '#2E7D64', borderRadius: 16, padding: 20, marginBottom: 20, color: 'white' }}>
            <h4>Question {globalStart+idx+1}: {q.questionText}</h4>
            {q.options.map((opt, optIdx) => (
              <label key={optIdx} style={{ display: 'block', margin: 10, cursor: 'pointer' }}>
                <input type="radio" name={`q${idx}`} onChange={() => handleAnswer(idx, optIdx)} style={{ marginRight: 10 }} /> 
                {String.fromCharCode(65+optIdx)}. {opt}
              </label>
            ))}
          </div>
        ))}
        <button onClick={handleSubmit} style={{ background: '#28a745', color: 'white', padding: 12, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' }}>Submit Exam</button>
      </div>
    </div>
  );
};

// Hamburger Menu Component
const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);

  return (
    <div style={{ position: 'relative' }}>
      {/* Hamburger Icon - Three Lines */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 40,
          height: 40,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          borderRadius: 8,
          background: '#2E7D64',
          gap: 4
        }}
      >
        <div style={{ width: '22px', height: '2px', background: 'white', borderRadius: 2 }}></div>
        <div style={{ width: '22px', height: '2px', background: 'white', borderRadius: 2 }}></div>
        <div style={{ width: '22px', height: '2px', background: 'white', borderRadius: 2 }}></div>
      </div>

      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 98 }} />
          <div style={{
            position: 'absolute',
            top: 50,
            right: 0,
            width: 260,
            background: 'white',
            borderRadius: 12,
            boxShadow: '0 5px 20px rgba(0,0,0,0.15)',
            zIndex: 99,
            overflow: 'hidden'
          }}>
            <div style={{ padding: 16, background: '#2E7D64', color: 'white', textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', wordBreak: 'break-all' }}>{user?.email}</div>
              {user?.isPremium && <div style={{ background: '#ff9800', display: 'inline-block', padding: '2px 12px', borderRadius: 20, fontSize: 11, marginTop: 8, fontWeight: 'bold' }}>⭐ PREMIUM</div>}
            </div>
            <Link to="/" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #eee' }}>🏠 Home</Link>
            <Link to="/general-nursing" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #eee' }}>🩺 General Nursing</Link>
            <Link to="/get-premium" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#e65100', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>⭐ Get Premium</Link>
            <Link to="/about" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #eee' }}>ℹ️ About Us</Link>
            <Link to="/contact" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #eee' }}>📞 Contact Us</Link>
            <Link to="/whatsapp" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#25D366', borderBottom: '1px solid #eee' }}>💬 Join WhatsApp</Link>
            <button onClick={() => { setIsOpen(false); logout(); }} style={{ display: 'block', width: '100%', padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', borderTop: '1px solid #eee', color: '#dc3545', cursor: 'pointer', fontWeight: 'bold' }}>🚪 Logout</button>
          </div>
        </>
      )}
    </div>
  );
};

// Main App Component
const AppContent = () => {
  const { token } = useContext(AuthContext);

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
    <div>
      <nav style={{ 
        background: 'white', 
        padding: '10px 20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <h2 style={{ color: '#2E7D64', margin: 0, fontSize: 'clamp(16px, 4vw, 20px)' }}>ELITE NURSING CBT</h2>
        <HamburgerMenu />
      </nav>
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/general-nursing" element={<GeneralNursing />} />
        <Route path="/coming-soon/:cat" element={<ComingSoon title="Coming Soon" />} />
        <Route path="/get-premium" element={<GetPremium />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/whatsapp" element={<JoinWhatsApp />} />
        <Route path="/exam/:id" element={<ExamDetail />} />
        <Route path="/take/:id/:sectionNumber" element={<TakeExam />} />
      </Routes>
    </div>
  );
};

function App() {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem('auth');
    return saved ? JSON.parse(saved) : { token: null, user: null };
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

  if (auth.token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
  }

  // Payment verification callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('reference') || params.get('tx_ref');
    if (ref && auth.user?.id) {
      axios.post('/api/verify-payment', { reference: ref, userId: auth.user?.id })
        .then(res => {
          if (res.data.success) {
            alert('✅ Payment successful! Your account has been upgraded!');
            window.location.href = '/';
          }
        })
        .catch(err => console.error('Verification error:', err));
    }
  }, [auth.user?.id]);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;