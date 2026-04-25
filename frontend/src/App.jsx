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
      background: isWarning ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)' : 'linear-gradient(135deg, #1B5E4A 0%, #0D3B2E 100%)',
      color: 'white',
      padding: '12px 16px',
      textAlign: 'center',
      fontSize: 'clamp(20px, 5vw, 32px)',
      fontWeight: 'bold'
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span>⏰</span>
        <span>{minutes}:{seconds.toString().padStart(2, '0')}</span>
        {isWarning && <span style={{ fontSize: 'clamp(12px, 4vw, 18px)' }}>⚠️ TIME RUNNING OUT!</span>}
      </div>
    </div>
  );
};

// Premium Modal Component
const PremiumModal = ({ onClose, examId, examTitle, sectionNumber }) => {
  const [selectedPlan, setSelectedPlan] = useState('single');
  const [loading, setLoading] = useState(false);
  const { token, user } = useContext(AuthContext);

  const plans = {
    single: { price: 200, text: `Pay ₦200 for Examination ${sectionNumber} only` },
    complete: { price: 5900, text: 'Pay ₦5,900 for ALL exams (Lifetime access)' }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/initialize-payment', {
        email: user?.email,
        amount: plans[selectedPlan].price,
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
        padding: 'clamp(20px, 5vw, 40px)',
        maxWidth: 500,
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
        <h2 style={{ color: '#2E7D64', marginBottom: 8 }}>Upgrade to Premium</h2>
        <p style={{ color: '#666', marginBottom: 24 }}>{examTitle}</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          <div onClick={() => setSelectedPlan('single')} style={{
            border: selectedPlan === 'single' ? '2px solid #2E7D64' : '1px solid #ddd',
            borderRadius: 12,
            padding: 16,
            cursor: 'pointer',
            background: selectedPlan === 'single' ? '#e8f5e9' : 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 'bold', color: '#2E7D64' }}>This Exam Only</span>
              <span style={{ fontSize: 24, fontWeight: 'bold', color: '#2E7D64' }}>₦200</span>
            </div>
            <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Access only Examination {sectionNumber}</p>
          </div>
          
          <div onClick={() => setSelectedPlan('complete')} style={{
            border: selectedPlan === 'complete' ? '2px solid #ff9800' : '1px solid #ddd',
            borderRadius: 12,
            padding: 16,
            cursor: 'pointer',
            background: selectedPlan === 'complete' ? '#fff3e0' : 'white',
            position: 'relative'
          }}>
            {selectedPlan === 'complete' && <div style={{ position: 'absolute', top: -12, right: 16, background: '#ff9800', color: 'white', padding: '2px 12px', borderRadius: 20, fontSize: 12, fontWeight: 'bold' }}>BEST VALUE</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 'bold', color: '#e65100' }}>Complete Package</span>
              <span style={{ fontSize: 24, fontWeight: 'bold', color: '#e65100' }}>₦5,900</span>
            </div>
            <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>All exams + future updates</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={onClose} style={{ flex: 1, background: '#6c757d', color: 'white', padding: 12, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
          <button onClick={handlePayment} disabled={loading} style={{ flex: 2, background: 'linear-gradient(135deg, #2E7D64 0%, #1B5E4A 100%)', color: 'white', padding: 12, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Processing...' : plans[selectedPlan].text}
          </button>
        </div>
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #2E7D64 0%, #1B5E4A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ maxWidth: 450, width: '100%', padding: 40, background: 'white', borderRadius: 20 }}>
        <h2 style={{ color: '#2E7D64', textAlign: 'center', marginBottom: 30 }}>Welcome Back</h2>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 14, margin: '10px 0', border: '2px solid #e0e0e0', borderRadius: 10 }} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 14, margin: '10px 0', border: '2px solid #e0e0e0', borderRadius: 10 }} required />
          <button type="submit" style={{ background: 'linear-gradient(135deg, #2E7D64 0%, #1B5E4A 100%)', color: 'white', padding: 14, width: '100%', border: 'none', borderRadius: 10, marginTop: 20 }}>Login</button>
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #2E7D64 0%, #1B5E4A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ maxWidth: 450, width: '100%', padding: 40, background: 'white', borderRadius: 20 }}>
        <h2 style={{ color: '#2E7D64', textAlign: 'center', marginBottom: 30 }}>Create Account</h2>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 14, margin: '10px 0', border: '2px solid #e0e0e0', borderRadius: 10 }} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 14, margin: '10px 0', border: '2px solid #e0e0e0', borderRadius: 10 }} required />
          <button type="submit" style={{ background: 'linear-gradient(135deg, #2E7D64 0%, #1B5E4A 100%)', color: 'white', padding: 14, width: '100%', border: 'none', borderRadius: 10, marginTop: 20 }}>Register</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20 }}>Already have an account? <Link to="/login" style={{ color: '#2E7D64', fontWeight: 'bold' }}>Login</Link></p>
      </div>
    </div>
  );
};

// Coming Soon Component
const ComingSoon = ({ title }) => {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 40, maxWidth: 500, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 20 }}>🚧</div>
        <h2 style={{ color: '#2E7D64' }}>Coming Soon!</h2>
        <h3 style={{ color: '#ff9800', marginBottom: 20 }}>{title}</h3>
        <p style={{ color: '#666', marginBottom: 30 }}>We are working hard to bring you high-quality questions for {title}.</p>
        <Link to="/"><button style={{ background: '#2E7D64', color: 'white', padding: 12, border: 'none', borderRadius: 10, cursor: 'pointer' }}>Back to Home</button></Link>
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
        <p style={{ color: '#666', lineHeight: 1.8 }}>ELITE NURSING & MIDWIFERY CBT is a premier Computer Based Testing platform designed for nursing and midwifery students.</p>
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
        <a href="https://chat.whatsapp.com/HdpwnXzyrLrIqwnpjZqVsb">💬 Join WhatsApp Group</a>
      </div>
    </div>
  );
};

// Join WhatsApp Component
const JoinWhatsApp = () => {
  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 20 }}>💬</div>
        <h2 style={{ color: '#2E7D64', marginBottom: 20 }}>Join Our WhatsApp Community</h2>
        <a href="https://chat.whatsapp.com/HdpwnXzyrLrIqwnpjZqVsb" target="_blank" rel="noopener noreferrer">
          <button style={{ background: '#25D366', color: 'white', padding: 14, border: 'none', borderRadius: 50, cursor: 'pointer' }}>Join WhatsApp Group</button>
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
        <p>Thank you for your support!</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>⭐</div>
        <h2 style={{ color: '#2E7D64' }}>Upgrade to Premium</h2>
        
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginTop: 40, marginBottom: 40 }}>
          <div onClick={() => setSelectedPlan('single')} style={{ border: selectedPlan === 'single' ? '2px solid #2E7D64' : '1px solid #ddd', borderRadius: 16, padding: 30, cursor: 'pointer', flex: 1, minWidth: 250 }}>
            <h3>Pay Per Exam</h3>
            <p style={{ fontSize: 32, fontWeight: 'bold', color: '#2E7D64' }}>₦200</p>
            <p>Per premium exam</p>
          </div>
          <div onClick={() => setSelectedPlan('complete')} style={{ border: selectedPlan === 'complete' ? '2px solid #ff9800' : '1px solid #ddd', borderRadius: 16, padding: 30, cursor: 'pointer', flex: 1, minWidth: 250, position: 'relative' }}>
            {selectedPlan === 'complete' && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#ff9800', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: 12 }}>BEST VALUE</div>}
            <h3>Complete Package</h3>
            <p style={{ fontSize: 32, fontWeight: 'bold', color: '#e65100' }}>₦5,900</p>
            <p>All exams + lifetime access</p>
          </div>
        </div>
        
        <button onClick={handlePayment} disabled={loading} style={{ background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white', padding: '16px 40px', border: 'none', borderRadius: 50, cursor: 'pointer', fontWeight: 'bold', fontSize: 18 }}>
          {loading ? 'Processing...' : `Pay ${selectedPlan === 'single' ? '₦200' : '₦5,900'} to ${selectedPlan === 'single' ? 'Unlock Single Exam' : 'Get Complete Package'}`}
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
          <h1 style={{ color: '#2E7D64', fontSize: 36 }}>ELITE NURSING & MIDWIFERY CBT</h1>
          <p style={{ color: '#666' }}>Computer Based Testing Platform</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 25 }}>
          {categories.map(cat => (
            <Link key={cat.id} to={cat.path} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', padding: 30, borderRadius: 20, textAlign: 'center', border: cat.available ? '2px solid #2E7D64' : '1px solid #ddd' }}>
                <div style={{ fontSize: 60, marginBottom: 15 }}>{cat.icon}</div>
                <h3 style={{ color: cat.available ? '#2E7D64' : '#999' }}>{cat.name}</h3>
                {!cat.available && <span style={{ background: '#ff9800', color: 'white', padding: '5px 15px', borderRadius: 25, fontSize: 12 }}>Coming Soon</span>}
                {cat.available && <button style={{ marginTop: 15, background: '#2E7D64', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', width: '100%' }}>View Exams →</button>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

// General Nursing Page
const GeneralNursing = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    axios.get('/api/quizzes?category=general-nursing', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setQuizzes(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div style={{ textAlign: 'center', padding: 50 }}>Loading...</div>;

  return (
    <div style={{ background: '#e8f5e9', minHeight: '100vh' }}>
      <div style={{ padding: 30, maxWidth: 1200, margin: '0 auto' }}>
        <Link to="/" style={{ color: '#2E7D64', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>← Back to Categories</Link>
        <h2 style={{ color: '#2E7D64', marginBottom: 20 }}>General Nursing</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 25 }}>
          {quizzes.map(quiz => {
            const examCount = Math.ceil((quiz.questions?.length || 0) / 20);
            return (
              <div key={quiz._id} style={{ background: 'white', padding: 20, borderRadius: 16 }}>
                <h3 style={{ color: '#2E7D64' }}>{quiz.title}</h3>
                <p style={{ color: '#666', fontSize: 14 }}>{quiz.description}</p>
                <p><strong>Total Questions:</strong> {quiz.questions?.length || 0}</p>
                <p><strong>Examinations:</strong> {examCount} exams (20 questions each)</p>
                <Link to={`/exam/${quiz._id}`}>
                  <button style={{ background: '#2E7D64', color: 'white', padding: 10, border: 'none', borderRadius: 8, marginTop: 10, width: '100%', cursor: 'pointer' }}>View Examinations</button>
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
        const sectionsArray = [];
        for (let i = 0; i < total; i += 20) {
          const end = Math.min(i + 20, total);
          sectionsArray.push({
            number: sectionsArray.length + 1,
            count: end - i,
            startIndex: i + 1,
            endIndex: end,
            isPremium: sectionsArray.length + 1 > 1,
            timeMinutes: end - i
          });
        }
        setSections(sectionsArray);
      } catch (err) {
        if (err.response?.status === 401) { localStorage.removeItem('auth'); logout(); window.location.href = '/login'; }
        else alert('Error loading exam');
      } finally { setLoading(false); }
    };
    if (id && token) fetchData();
  }, [id, token, logout]);

  const handleStartExam = async (section) => {
    if (section.isPremium && !userPremium) {
      try {
        const check = await axios.post('/api/check-exam-access', { examId: id, sectionNumber: section.number }, { headers: { Authorization: `Bearer ${token}` } });
        if (check.data.hasAccess) {
          window.location.href = `/take/${id}/${section.number}`;
        } else {
          setSelectedSection(section);
          setShowPremiumModal(true);
        }
      } catch (err) {
        setSelectedSection(section);
        setShowPremiumModal(true);
      }
    } else {
      window.location.href = `/take/${id}/${section.number}`;
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 50 }}>Loading...</div>;
  if (!exam) return <div style={{ textAlign: 'center', padding: 50 }}>Exam not found</div>;

  return (
    <div style={{ background: '#e8f5e9', minHeight: '100vh' }}>
      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} examId={id} examTitle={exam.title} sectionNumber={selectedSection?.number} />}
      <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
        <Link to="/general-nursing" style={{ color: '#2E7D64', textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>← Back</Link>
        
        <div style={{ background: '#2E7D64', borderRadius: 20, padding: 30, marginBottom: 30, color: 'white' }}>
          <h1>{exam.title}</h1>
          <p>{exam.description}</p>
          <p>📚 Total Questions: {exam.questions?.length || 0}</p>
          {userPremium && <p style={{ background: '#ff9800', display: 'inline-block', padding: '5px 15px', borderRadius: 20 }}>⭐ PREMIUM USER</p>}
        </div>
        
        <h2>Select Examination:</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginTop: 20 }}>
          {sections.map(section => (
            <div key={section.number} style={{ background: 'white', padding: 20, borderRadius: 16, textAlign: 'center', border: section.isPremium && !userPremium ? '2px solid #ff9800' : '2px solid #2E7D64' }}>
              {section.isPremium && !userPremium && <div style={{ background: '#ff9800', color: 'white', display: 'inline-block', padding: '4px 12px', borderRadius: 20, marginBottom: 10, fontSize: 12 }}>⭐ PREMIUM</div>}
              <div style={{ fontSize: 48 }}>📝</div>
              <h3>Examination {section.number}</h3>
              <p style={{ fontSize: 28, fontWeight: 'bold', color: '#2E7D64' }}>{section.count} Questions</p>
              <p>Questions {section.startIndex} - {section.endIndex}</p>
              <p style={{ color: '#ff9800' }}>⏰ {section.timeMinutes} minutes</p>
              {section.isPremium && !userPremium && <p style={{ color: '#2E7D64', fontWeight: 'bold', marginTop: 5 }}>₦200 to unlock</p>}
              <button onClick={() => handleStartExam(section)} style={{ background: section.isPremium && !userPremium ? '#ff9800' : '#2E7D64', color: 'white', padding: 10, border: 'none', borderRadius: 8, marginTop: 15, width: '100%', cursor: 'pointer' }}>
                {section.isPremium && !userPremium ? '⭐ Unlock for ₦200' : 'Start Exam'}
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
      .catch(err => alert('Error loading exam'));
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
  if (questions.length === 0) return <div style={{ textAlign: 'center', padding: 50 }}>Loading questions...</div>;
  if (submitted && !showReview) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h2>Exam Results</h2>
        <p>Score: {result.score} / {result.total}</p>
        <p>Percentage: {result.percentage?.toFixed(1)}%</p>
        <p style={{ color: result.passed ? 'green' : 'red' }}>{result.passed ? '✓ PASSED!' : '✗ Failed'}</p>
        <button onClick={() => setShowReview(true)}>Review Answers</button>
        <Link to={`/exam/${id}`}><button>Back</button></Link>
      </div>
    );
  }
  if (submitted && showReview) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Answer Review</h2>
        {questions.map((q, idx) => {
          const userA = answers[idx];
          const isCorrect = userA === q.correctAnswer;
          return (
            <div key={idx} style={{ margin: 20, padding: 15, background: isCorrect ? '#e8f5e9' : '#ffebee', borderRadius: 10 }}>
              <h4>Q{idx+1}: {q.questionText}</h4>
              {q.options.map((opt, optIdx) => (
                <div key={optIdx} style={{ color: optIdx === q.correctAnswer ? 'green' : (optIdx === userA ? 'red' : 'black') }}>
                  {String.fromCharCode(65+optIdx)}. {opt} {optIdx === q.correctAnswer && '✓'} {optIdx === userA && optIdx !== q.correctAnswer && '✗'}
                </div>
              ))}
            </div>
          );
        })}
        <Link to={`/exam/${id}`}><button>Back</button></Link>
      </div>
    );
  }
  const globalStart = (parseInt(sectionNumber)-1)*20;
  return (
    <div>
      <Timer duration={questions.length} onTimeUp={handleTimeUp} />
      <div style={{ padding: 20 }}>
        <h2>{exam.title} - Examination {sectionNumber}</h2>
        {questions.map((q, idx) => (
          <div key={idx} style={{ background: '#2E7D64', borderRadius: 16, padding: 20, marginBottom: 20, color: 'white' }}>
            <h4>Question {globalStart+idx+1}: {q.questionText}</h4>
            {q.options.map((opt, optIdx) => (
              <label key={optIdx} style={{ display: 'block', margin: 10, cursor: 'pointer' }}>
                <input type="radio" name={`q${idx}`} onChange={() => handleAnswer(idx, optIdx)} /> {String.fromCharCode(65+optIdx)}. {opt}
              </label>
            ))}
          </div>
        ))}
        <button onClick={handleSubmit} style={{ background: '#28a745', color: 'white', padding: 12, border: 'none', borderRadius: 8 }}>Submit</button>
      </div>
    </div>
  );
};

// Dropdown Menu
const DropdownMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ background: '#2E7D64', color: 'white', border: 'none', borderRadius: 50, width: 40, height: 40, cursor: 'pointer' }}>👤</button>
      {isOpen && (
        <div style={{ position: 'absolute', top: 50, right: 0, width: 250, background: 'white', borderRadius: 12, boxShadow: '0 5px 25px rgba(0,0,0,0.15)', zIndex: 100 }}>
          <div style={{ padding: 16, textAlign: 'center', background: '#2E7D64', color: 'white', borderRadius: '12px 12px 0 0' }}>
            <div>{user?.email}</div>
            {user?.isPremium && <div style={{ background: '#ff9800', display: 'inline-block', padding: '2px 12px', borderRadius: 20, fontSize: 12, marginTop: 8 }}>⭐ PREMIUM</div>}
          </div>
          <Link to="/" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#333' }}>🏠 Home</Link>
          <Link to="/get-premium" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#e65100', fontWeight: 'bold' }}>⭐ Get Premium</Link>
          <Link to="/about" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#333' }}>ℹ️ About</Link>
          <Link to="/contact" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#333' }}>📞 Contact</Link>
          <Link to="/whatsapp" onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#25D366' }}>💬 WhatsApp</Link>
          <button onClick={() => { setIsOpen(false); logout(); }} style={{ display: 'block', width: '100%', padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', borderTop: '1px solid #eee', color: '#dc3545', cursor: 'pointer' }}>🚪 Logout</button>
        </div>
      )}
    </div>
  );
};

// Main App
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
      <nav style={{ background: 'white', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div><h1 style={{ color: '#2E7D64', fontSize: 'clamp(16px, 4vw, 20px)' }}>ELITE NURSING CBT</h1></div>
        <DropdownMenu />
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('reference') || params.get('tx_ref');
    if (ref && auth.user?.id) {
      axios.post('/api/verify-payment', { reference: ref, userId: auth.user?.id })
        .then(res => {
          if (res.data.success) {
            alert('✅ Payment successful!');
            window.location.href = '/';
          }
        })
        .catch(console.error);
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