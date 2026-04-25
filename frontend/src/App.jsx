import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useParams } from 'react-router-dom';
import axios from 'axios';

axios.defaults.baseURL = 'https://elite-nursing-cbt.onrender.com';

const AuthContext = createContext();

// Timer Component - Sticky Header
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
      padding: '15px 24px',
      textAlign: 'center',
      fontSize: 32,
      fontWeight: 'bold',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      letterSpacing: '2px',
      borderBottom: '3px solid rgba(255,255,255,0.3)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 15 }}>
        <span>⏰</span>
        <span>{minutes}:{seconds.toString().padStart(2, '0')}</span>
        {isWarning && <span style={{ fontSize: 18, animation: 'pulse 1s infinite' }}>⚠️ TIME RUNNING OUT!</span>}
      </div>
    </div>
  );
};

// Premium Modal Component - Flutterwave Version
const PremiumModal = ({ onClose, examTitle, sectionNumber }) => {
  const [loading, setLoading] = useState(false);
  const { token, user } = useContext(AuthContext);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/initialize-payment', {
        email: user?.email,
        amount: 5000,
        userId: user?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      window.location.href = response.data.authorization_url;
    } catch (error) {
      alert('Payment initialization failed. Please try again.');
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
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: 40,
        maxWidth: 450,
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>⭐</div>
        <h2 style={{ color: '#2E7D64', marginBottom: 15 }}>Premium Required</h2>
        <p style={{ color: '#666', marginBottom: 20, lineHeight: 1.6 }}>
          <strong>{examTitle} - Examination {sectionNumber}</strong> is a premium exam.
          Upgrade to unlock ALL premium examinations across all subjects!
        </p>
        <div style={{ background: '#f0f7f4', padding: 20, borderRadius: 12, marginBottom: 25 }}>
          <p style={{ fontWeight: 'bold', color: '#2E7D64' }}>Premium Benefits:</p>
          <ul style={{ textAlign: 'left', color: '#666', marginTop: 10 }}>
            <li>✓ All 50+ Nursing Subjects</li>
            <li>✓ All Examinations (2, 3, 4+)</li>
            <li>✓ Over 5,000 Practice Questions</li>
            <li>✓ Detailed Answer Reviews</li>
            <li>✓ Lifetime Access</li>
          </ul>
        </div>
        <div style={{ fontSize: 32, fontWeight: 'bold', color: '#2E7D64', marginBottom: 20 }}>
          ₦5,000 <span style={{ fontSize: 14, color: '#666' }}>/ lifetime</span>
        </div>
        <div style={{ display: 'flex', gap: 15 }}>
          <button onClick={onClose} style={{ flex: 1, background: '#6c757d', color: 'white', padding: 12, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
          <button onClick={handlePayment} disabled={loading} style={{ flex: 1, background: 'linear-gradient(135deg, #2E7D64 0%, #1B5E4A 100%)', color: 'white', padding: 12, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Processing...' : 'Pay ₦5,000 with Card'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#999', marginTop: 20 }}>Secure payment via Flutterwave</p>
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
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #2E7D64 0%, #1B5E4A 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ maxWidth: 450, margin: '20px', padding: 40, background: 'white', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h2 style={{ color: '#2E7D64', textAlign: 'center', marginBottom: 30, fontSize: 28 }}>Welcome Back</h2>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 14, margin: '10px 0', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 16 }} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 14, margin: '10px 0', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 16 }} required />
          <button type="submit" style={{ background: 'linear-gradient(135deg, #2E7D64 0%, #1B5E4A 100%)', color: 'white', padding: 14, width: '100%', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 18, marginTop: 20 }}>Login</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 25 }}>Don't have an account? <Link to="/register" style={{ color: '#2E7D64', fontWeight: 'bold' }}>Register</Link></p>
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
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #2E7D64 0%, #1B5E4A 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ maxWidth: 450, margin: '20px', padding: 40, background: 'white', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h2 style={{ color: '#2E7D64', textAlign: 'center', marginBottom: 30, fontSize: 28 }}>Create Account</h2>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 14, margin: '10px 0', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 16 }} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 14, margin: '10px 0', border: '2px solid #e0e0e0', borderRadius: 10, fontSize: 16 }} required />
          <button type="submit" style={{ background: 'linear-gradient(135deg, #2E7D64 0%, #1B5E4A 100%)', color: 'white', padding: 14, width: '100%', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 18, marginTop: 20 }}>Register</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 25 }}>Already have an account? <Link to="/login" style={{ color: '#2E7D64', fontWeight: 'bold' }}>Login</Link></p>
      </div>
    </div>
  );
};

// About Us Component
const AboutUs = () => {
  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 40, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#2E7D64', marginBottom: 20 }}>About Us</h2>
        <p style={{ color: '#666', lineHeight: 1.8, marginBottom: 20 }}>
          ELITE NURSING & MIDWIFERY CBT is a premier Computer Based Testing platform designed specifically for nursing and midwifery students in Nigeria.
        </p>
        <p style={{ color: '#666', lineHeight: 1.8, marginBottom: 20 }}>
          Our mission is to provide high-quality, accessible exam preparation materials that help students succeed in their nursing and midwifery licensing examinations.
        </p>
        <p style={{ color: '#666', lineHeight: 1.8, marginBottom: 20 }}>
          With over 5,000 practice questions covering all major nursing subjects, we are committed to excellence in nursing education.
        </p>
        <h3 style={{ color: '#2E7D64', marginTop: 30, marginBottom: 15 }}>Our Vision</h3>
        <p style={{ color: '#666', lineHeight: 1.8 }}>
          To become the leading CBT platform for nursing and midwifery students across Africa, empowering future healthcare professionals with the knowledge and confidence to excel.
        </p>
      </div>
    </div>
  );
};

// Contact Us Component
const ContactUs = () => {
  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 40, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#2E7D64', marginBottom: 20 }}>Contact Us</h2>
        <p style={{ color: '#666', marginBottom: 30 }}>Have questions? We'd love to hear from you!</p>
        
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ color: '#2E7D64', marginBottom: 10 }}>📧 Email</h3>
          <p style={{ color: '#666' }}>anaduphilip2000@gmail.com</p>
        </div>
        
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ color: '#2E7D64', marginBottom: 10 }}>📞 Phone / WhatsApp</h3>
          <p style={{ color: '#666' }}>09063908476</p>
        </div>
        
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ color: '#2E7D64', marginBottom: 10 }}>💬 WhatsApp Group</h3>
          <a href="https://chat.whatsapp.com/HdpwnXzyrLrIqwnpjZqVsb" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', textDecoration: 'none' }}>
            Click here to join our WhatsApp community
          </a>
        </div>
        
        <div style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid #eee' }}>
          <h3 style={{ color: '#2E7D64', marginBottom: 15 }}>Send us a Message</h3>
          <form>
            <input type="text" placeholder="Your Name" style={{ width: '100%', padding: 12, margin: '10px 0', border: '2px solid #e0e0e0', borderRadius: 10 }} />
            <input type="email" placeholder="Your Email" style={{ width: '100%', padding: 12, margin: '10px 0', border: '2px solid #e0e0e0', borderRadius: 10 }} />
            <textarea placeholder="Your Message" rows="4" style={{ width: '100%', padding: 12, margin: '10px 0', border: '2px solid #e0e0e0', borderRadius: 10 }} />
            <button style={{ background: 'linear-gradient(135deg, #2E7D64 0%, #1B5E4A 100%)', color: 'white', padding: 12, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold' }}>Send Message</button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Join WhatsApp Component
const JoinWhatsApp = () => {
  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 40, boxShadow: '0 8px 25px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 20 }}>💬</div>
        <h2 style={{ color: '#2E7D64', marginBottom: 20 }}>Join Our WhatsApp Community</h2>
        <p style={{ color: '#666', marginBottom: 30, lineHeight: 1.8 }}>
          Get instant updates, study tips, and connect with fellow nursing students!
        </p>
        
        <div style={{ background: '#f0f7f4', padding: 30, borderRadius: 15, marginBottom: 30 }}>
          <h3 style={{ color: '#2E7D64', marginBottom: 15 }}>What you'll get:</h3>
          <ul style={{ textAlign: 'left', color: '#666', maxWidth: 400, margin: '0 auto' }}>
            <li style={{ margin: '10px 0' }}>✓ Daily practice questions</li>
            <li style={{ margin: '10px 0' }}>✓ Exam tips and strategies</li>
            <li style={{ margin: '10px 0' }}>✓ Updates on new features</li>
            <li style={{ margin: '10px 0' }}>✓ Peer support and discussions</li>
            <li style={{ margin: '10px 0' }}>✓ Special announcements</li>
          </ul>
        </div>
        
        <a 
          href="https://chat.whatsapp.com/HdpwnXzyrLrIqwnpjZqVsb" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ textDecoration: 'none' }}
        >
          <button style={{ 
            background: '#25D366', 
            color: 'white', 
            padding: '14px 40px', 
            border: 'none', 
            borderRadius: 50, 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            fontSize: 18,
            boxShadow: '0 4px 15px rgba(37,211,102,0.3)'
          }}>
            Join WhatsApp Group
          </button>
        </a>
      </div>
    </div>
  );
};

// Get Premium Component
const GetPremium = () => {
  const [loading, setLoading] = useState(false);
  const { token, user, login } = useContext(AuthContext);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/initialize-payment', {
        email: user?.email,
        amount: 5000,
        userId: user?.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      window.location.href = response.data.authorization_url;
    } catch (error) {
      alert('Payment initialization failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 40, boxShadow: '0 8px 25px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>⭐</div>
        <h2 style={{ color: '#2E7D64', marginBottom: 10 }}>Upgrade to Premium</h2>
        <p style={{ color: '#666', marginBottom: 40, fontSize: 18 }}>
          Get unlimited access to all examinations and features
        </p>
        
        {user?.isPremium ? (
          <div style={{ background: '#e8f5e9', padding: 40, borderRadius: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>✅</div>
            <h3 style={{ color: '#2E7D64', marginBottom: 10 }}>You are already a Premium Member!</h3>
            <p style={{ color: '#666' }}>Thank you for supporting us. Enjoy unlimited access to all examinations.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 25, marginBottom: 40 }}>
              <div style={{ background: '#f0f7f4', padding: 25, borderRadius: 15 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📚</div>
                <h3 style={{ color: '#2E7D64' }}>All Subjects</h3>
                <p style={{ color: '#666' }}>Access all nursing subjects</p>
              </div>
              <div style={{ background: '#f0f7f4', padding: 25, borderRadius: 15 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📝</div>
                <h3 style={{ color: '#2E7D64' }}>All Exams</h3>
                <p style={{ color: '#666' }}>Unlock Examinations 2, 3, 4+</p>
              </div>
              <div style={{ background: '#f0f7f4', padding: 25, borderRadius: 15 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🎯</div>
                <h3 style={{ color: '#2E7D64' }}>5,000+ Questions</h3>
                <p style={{ color: '#666' }}>Massive question bank</p>
              </div>
              <div style={{ background: '#f0f7f4', padding: 25, borderRadius: 15 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🏆</div>
                <h3 style={{ color: '#2E7D64' }}>Lifetime Access</h3>
                <p style={{ color: '#666' }}>One-time payment, forever access</p>
              </div>
            </div>
            
            <div style={{ background: '#f0f7f4', padding: 30, borderRadius: 15, marginBottom: 30 }}>
              <div style={{ fontSize: 48, fontWeight: 'bold', color: '#2E7D64', marginBottom: 10 }}>
                ₦5,000 <span style={{ fontSize: 18, color: '#666' }}>/ lifetime</span>
              </div>
              <p style={{ color: '#666' }}>Pay with Card, Bank Transfer, or USSD</p>
            </div>
            
            <button 
              onClick={handlePayment} 
              disabled={loading}
              style={{ 
                background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', 
                color: 'white', 
                padding: '16px 50px', 
                border: 'none', 
                borderRadius: 50, 
                cursor: 'pointer', 
                fontWeight: 'bold', 
                fontSize: 18,
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
            >
              {loading ? 'Processing...' : 'Upgrade to Premium Now'}
            </button>
          </>
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
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [userPremium, setUserPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const { token, logout } = useContext(AuthContext);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        
        if (!token) return;
        
        const res = await axios.get(`/api/quizzes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
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
            startIndex: startIndex + 1,
            endIndex: endIndex,
            isPremium: sectionNumber > 1,
            timeMinutes: endIndex - startIndex
          });
          startIndex = endIndex;
          sectionNumber++;
        }
        setSections(sectionsArray);
        
        const profileRes = await axios.get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserPremium(profileRes.data.isPremium);
        
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth');
          logout();
          window.location.href = '/login';
        } else {
          alert('Error loading exam: ' + error.message);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (id && token) fetchExam();
  }, [id, token, logout]);

  const handleStartExam = (section) => {
    if (section.isPremium && !userPremium) {
      setSelectedSection(section);
      setShowPremiumModal(true);
    } else {
      window.location.href = `/take/${id}/${section.number}`;
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 50, color: '#2E7D64' }}>Loading...</div>;
  if (!exam) return <div style={{ textAlign: 'center', padding: 50, color: '#2E7D64' }}>Exam not found</div>;

  return (
    <div style={{ background: '#e8f5e9', minHeight: '100vh' }}>
      {showPremiumModal && (
        <PremiumModal 
          onClose={() => setShowPremiumModal(false)}
          examTitle={exam.title}
          sectionNumber={selectedSection?.number}
        />
      )}
      <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
        <Link to="/" style={{ color: '#2E7D64', textDecoration: 'none', marginBottom: 20, display: 'inline-block', fontSize: 16 }}>← Back to Subjects</Link>
        
        <div style={{ background: 'linear-gradient(135deg, #2E7D64 0%, #1B5E4A 100%)', borderRadius: 20, padding: 30, marginBottom: 30, color: 'white' }}>
          <h1 style={{ margin: 0, fontSize: 32 }}>{exam.title}</h1>
          <p style={{ marginTop: 10, opacity: 0.9 }}>{exam.description}</p>
          <p style={{ marginTop: 15 }}>📚 Total Questions: {exam.questions?.length || 0}</p>
          {userPremium && <p style={{ marginTop: 10, background: '#ff9800', display: 'inline-block', padding: '5px 15px', borderRadius: 20, fontWeight: 'bold' }}>⭐ PREMIUM USER - All exams unlocked!</p>}
        </div>
        
        <h2 style={{ color: '#2E7D64', marginBottom: 25 }}>Select Examination:</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 25 }}>
          {sections.map((section) => (
            <div key={section.number} style={{ 
              background: 'white', 
              padding: 25, 
              borderRadius: 16, 
              boxShadow: '0 8px 25px rgba(0,0,0,0.1)', 
              textAlign: 'center',
              position: 'relative',
              border: (section.isPremium && !userPremium) ? '2px solid #ff9800' : '2px solid #2E7D64'
            }}>
              {(section.isPremium && !userPremium) && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  right: 20,
                  background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 'bold'
                }}>⭐ PREMIUM</div>
              )}
              {userPremium && section.isPremium && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  right: 20,
                  background: '#2E7D64',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 'bold'
                }}>✅ UNLOCKED</div>
              )}
              <div style={{ fontSize: 48 }}>{section.isPremium && !userPremium ? '⭐' : '📝'}</div>
              <h3 style={{ color: '#2E7D64', marginTop: 10 }}>Examination {section.number}</h3>
              <p style={{ fontSize: 28, fontWeight: 'bold', color: '#2E7D64', margin: '10px 0' }}>{section.count} Questions</p>
              <p style={{ color: '#666' }}>Questions {section.startIndex} - {section.endIndex}</p>
              <p style={{ color: '#ff9800', fontWeight: 'bold', marginTop: 10 }}>⏰ {section.timeMinutes} minute timer</p>
              <button 
                onClick={() => handleStartExam(section)}
                style={{ 
                  background: (section.isPremium && !userPremium) ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' : 'linear-gradient(135deg, #2E7D64 0%, #1B5E4A 100%)', 
                  color: 'white', 
                  padding: 12, 
                  border: 'none', 
                  borderRadius: 10, 
                  marginTop: 20, 
                  cursor: 'pointer', 
                  width: '100%', 
                  fontWeight: 'bold', 
                  fontSize: 16 
                }}
              >
                {(section.isPremium && !userPremium) ? '⭐ Upgrade to Access' : 'Start Exam'}
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
    const fetchExam = async () => {
      try {
        const res = await axios.get(`/api/quizzes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExam(res.data);
        
        const sectionNum = parseInt(sectionNumber);
        const batchSize = 20;
        const startIndex = (sectionNum - 1) * batchSize;
        let endIndex = startIndex + batchSize;
        if (endIndex > res.data.questions.length) endIndex = res.data.questions.length;
        setQuestions(res.data.questions.slice(startIndex, endIndex));
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
      const userAnswer = answers[idx];
      if (userAnswer !== undefined && userAnswer === question.correctAnswer) score++;
    });
    
    const total = questions.length;
    const percentage = (score / total) * 100;
    const passed = percentage >= 70;
    
    setResult({ score, total, percentage, passed });
    setSubmitted(true);
  };

  if (!exam) return <div style={{ textAlign: 'center', padding: 50, color: '#2E7D64' }}>Loading examination...</div>;
  if (questions.length === 0) return <div style={{ textAlign: 'center', padding: 50, color: '#2E7D64' }}>Loading questions...</div>;

  if (submitted && !showReview) {
    return (
      <div style={{ background: '#e8f5e9', minHeight: '100vh', padding: 40 }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', borderRadius: 20, padding: 40, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <h2 style={{ color: '#2E7D64' }}>Examination {sectionNumber} Results</h2>
          <div style={{ margin: 30 }}>
            <p style={{ fontSize: 32, marginBottom: 15 }}>Score: <strong style={{ color: '#2E7D64' }}>{result.score}</strong> / {result.total}</p>
            <p style={{ fontSize: 24, marginBottom: 15 }}>Percentage: <strong style={{ color: '#2E7D64' }}>{result.percentage?.toFixed(1)}%</strong></p>
            <p style={{ fontSize: 18 }}>Unanswered: <strong>{result.total - Object.keys(answers).length}</strong> questions</p>
          </div>
          <p style={{ color: result.passed ? '#2E7D64' : '#dc3545', fontSize: 32, fontWeight: 'bold', margin: 20 }}>
            {result.passed ? '✓ PASSED!' : '✗ Failed'}
          </p>
          {timeUp && <p style={{ color: '#ff9800' }}>⏰ Time's up!</p>}
          <div style={{ marginTop: 30 }}>
            <button onClick={() => setShowReview(true)} style={{ background: '#2E7D64', color: 'white', padding: 12, border: 'none', borderRadius: 10, margin: 10, cursor: 'pointer', fontSize: 16 }}>Review Answers</button>
            <Link to={`/exam/${id}`}><button style={{ background: '#6c757d', color: 'white', padding: 12, border: 'none', borderRadius: 10, margin: 10, cursor: 'pointer', fontSize: 16 }}>Back to Exams</button></Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted && showReview) {
    return (
      <div style={{ background: '#e8f5e9', minHeight: '100vh', padding: 20 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 25, marginBottom: 20, textAlign: 'center' }}>
            <h2 style={{ color: '#2E7D64' }}>Answer Review: {exam.title}</h2>
            <p>Examination {sectionNumber} - Score: {result.score}/{result.total} ({result.percentage?.toFixed(1)}%)</p>
          </div>
          
          {questions.map((q, idx) => {
            const userAnswer = answers[idx];
            const isCorrect = userAnswer !== undefined && userAnswer === q.correctAnswer;
            const isUnanswered = userAnswer === undefined;
            
            return (
              <div key={idx} style={{ 
                background: isCorrect ? '#e8f5e9' : (isUnanswered ? '#fff3e0' : '#ffebee'), 
                borderRadius: 16, 
                padding: 25, 
                marginBottom: 20,
                borderLeft: `6px solid ${isCorrect ? '#4caf50' : (isUnanswered ? '#ff9800' : '#f44336')}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <h4 style={{ marginBottom: 15, color: '#2E7D64' }}>Question {idx + 1}: {q.questionText}</h4>
                {isUnanswered && <p style={{ color: '#ff9800' }}>⚠️ Unanswered</p>}
                <div style={{ marginLeft: 20 }}>
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} style={{ 
                      margin: '10px 0', 
                      padding: '12px 15px', 
                      background: optIdx === q.correctAnswer ? '#c8e6c9' : (optIdx === userAnswer ? '#ffcdd2' : 'white'),
                      borderRadius: 10,
                      border: `1px solid ${optIdx === q.correctAnswer ? '#4caf50' : (optIdx === userAnswer ? '#f44336' : '#ddd')}`
                    }}>
                      <span style={{ fontWeight: 'bold' }}>{String.fromCharCode(65 + optIdx)}.</span> {opt}
                      {optIdx === q.correctAnswer && <span style={{ color: '#4caf50', marginLeft: 10 }}>✓ Correct Answer</span>}
                      {optIdx === userAnswer && optIdx !== q.correctAnswer && <span style={{ color: '#f44336', marginLeft: 10 }}>✗ Your Answer</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to={`/exam/${id}`}><button style={{ background: '#2E7D64', color: 'white', padding: 14, border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 16 }}>Back to Examinations</button></Link>
          </div>
        </div>
      </div>
    );
  }

  const globalQuestionNumber = (parseInt(sectionNumber) - 1) * 20;
  const examDuration = questions.length;

  return (
    <div style={{ background: '#e8f5e9', minHeight: '100vh' }}>
      <Timer duration={examDuration} onTimeUp={handleTimeUp} />
      <div style={{ padding: '30px 20px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 25, marginBottom: 25, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#2E7D64', margin: 0 }}>{exam.title}</h2>
          <p style={{ marginTop: 10, color: '#666' }}>Examination {sectionNumber} - {questions.length} Questions</p>
          <p style={{ marginTop: 5, color: '#ff9800' }}>⏰ Timer: {examDuration} minute(s)</p>
        </div>
        
        {questions.map((q, idx) => (
          <div key={idx} style={{ 
            background: '#2E7D64', 
            borderRadius: 16, 
            padding: 25, 
            marginBottom: 20, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h4 style={{ color: 'white', margin: 0 }}>Question {globalQuestionNumber + idx + 1}</h4>
              {answers[idx] !== undefined && <span style={{ background: '#ff9800', color: '#2E7D64', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 'bold' }}>Answered</span>}
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.5, marginBottom: 20, color: 'white' }}>{q.questionText}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {q.options?.map((opt, optIdx) => (
                <label key={optIdx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer', 
                  padding: '12px 18px', 
                  background: answers[idx] === optIdx ? '#ff9800' : 'white', 
                  borderRadius: 12, 
                  border: answers[idx] === optIdx ? '2px solid #ff9800' : '1px solid #ddd',
                  transition: 'all 0.2s'
                }}>
                  <input 
                    type="radio" 
                    name={`q${idx}`} 
                    onChange={() => handleAnswer(idx, optIdx)} 
                    checked={answers[idx] === optIdx}
                    style={{ marginRight: 15, width: 20, height: 20, cursor: 'pointer' }} 
                  /> 
                  <span style={{ fontWeight: 'bold', marginRight: 12, minWidth: 30, color: '#333' }}>{String.fromCharCode(65 + optIdx)}.</span>
                  <span style={{ fontSize: 15, color: '#333' }}>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        
        <div style={{ textAlign: 'center', marginTop: 30, paddingBottom: 50 }}>
          <button onClick={handleSubmit} style={{ 
            background: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)', 
            color: 'white', 
            padding: '16px 40px', 
            border: 'none', 
            borderRadius: 50, 
            cursor: 'pointer', 
            fontSize: 18, 
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            Submit Examination
          </button>
        </div>
      </div>
    </div>
  );
};

// Quiz List Component
const QuizList = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await axios.get('/api/quizzes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuizzes(res.data);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [token]);

  if (loading) return <div style={{ textAlign: 'center', padding: 50, color: '#2E7D64' }}>Loading subjects...</div>;

  return (
    <div style={{ background: '#e8f5e9', minHeight: '100vh' }}>
      <div style={{ padding: 30, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ color: '#2E7D64', fontSize: 36, marginBottom: 10 }}>ELITE NURSING & MIDWIFERY CBT</h1>
          <p style={{ color: '#666', fontSize: 18 }}>Computer Based Testing Platform</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 25 }}>
          {quizzes.map(quiz => {
            const totalQuestions = quiz.questions?.length || 0;
            const examCount = Math.ceil(totalQuestions / 20);
            
            return (
              <div key={quiz._id} style={{ 
                background: 'white', 
                padding: 25, 
                borderRadius: 16, 
                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
                cursor: 'pointer'
              }}>
                <div style={{ fontSize: 48, marginBottom: 10 }}>📚</div>
                <h3 style={{ color: '#2E7D64', marginBottom: 10, fontSize: 22 }}>{quiz.title}</h3>
                <p style={{ color: '#666', marginBottom: 15, lineHeight: 1.5 }}>{quiz.description}</p>
                <div style={{ borderTop: '1px solid #eee', paddingTop: 15, marginTop: 10 }}>
                  <p><strong style={{ color: '#2E7D64' }}>Total Questions:</strong> {totalQuestions}</p>
                  <p><strong style={{ color: '#2E7D64' }}>Examinations:</strong> {examCount} exams (20 questions each)</p>
                  <p><strong style={{ color: '#ff9800' }}>⭐ Free:</strong> Examination 1 only | <strong style={{ color: '#2E7D64' }}>Premium:</strong> Exams 2+</p>
                </div>
                <Link to={`/exam/${quiz._id}`}>
                  <button style={{ 
                    background: 'linear-gradient(135deg, #2E7D64 0%, #1B5E4A 100%)', 
                    color: 'white', 
                    padding: 12, 
                    border: 'none', 
                    borderRadius: 10, 
                    marginTop: 15, 
                    cursor: 'pointer', 
                    width: '100%', 
                    fontWeight: 'bold',
                    fontSize: 16
                  }}>View Examinations</button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Dropdown Menu Component
const DropdownMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#2E7D64',
          color: 'white',
          border: 'none',
          borderRadius: 50,
          width: 45,
          height: 45,
          fontSize: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}
      >
        👤
      </button>

      {isOpen && (
        <>
          <div 
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 198
            }}
          />
          <div style={{
            position: 'absolute',
            top: 55,
            right: 0,
            width: 280,
            background: 'white',
            borderRadius: 12,
            boxShadow: '0 5px 25px rgba(0,0,0,0.15)',
            zIndex: 199,
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '20px', 
              background: 'linear-gradient(135deg, #2E7D64 0%, #1B5E4A 100%)', 
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 48, marginBottom: 5 }}>👤</div>
              <div style={{ fontWeight: 'bold', fontSize: 14, wordBreak: 'break-all' }}>{user?.email}</div>
              {user?.isPremium && (
                <div style={{ 
                  background: '#ff9800', 
                  display: 'inline-block', 
                  padding: '3px 12px', 
                  borderRadius: 20, 
                  fontSize: 11, 
                  marginTop: 8,
                  fontWeight: 'bold'
                }}>⭐ PREMIUM MEMBER</div>
              )}
            </div>
            
            <div style={{ padding: '10px 0' }}>
              <Link to="/" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '12px 20px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 20 }}>🏠</span> Home
              </Link>
              <Link to="/get-premium" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '12px 20px', textDecoration: 'none', color: '#e65100', fontWeight: 'bold', background: '#fff3e0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 20 }}>⭐</span> Get Premium
              </Link>
              <Link to="/about" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '12px 20px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 20 }}>ℹ️</span> About Us
              </Link>
              <Link to="/contact" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '12px 20px', textDecoration: 'none', color: '#333', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 20 }}>📞</span> Contact Us
              </Link>
              <Link to="/whatsapp" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '12px 20px', textDecoration: 'none', color: '#25D366', fontWeight: 'bold', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 20 }}>💬</span> Join WhatsApp
              </Link>
              <button onClick={() => { setIsOpen(false); logout(); }} style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '12px 20px', width: '100%', textDecoration: 'none', color: '#dc3545', fontWeight: 'bold', border: 'none', background: 'white', cursor: 'pointer', borderTop: '1px solid #f0f0f0', fontSize: 16 }}>
                <span style={{ fontSize: 20 }}>🚪</span> Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Main App Component
const AppContent = () => {
  const { token, user } = useContext(AuthContext);

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
        padding: '15px 30px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        boxShadow: '0 2px 15px rgba(0,0,0,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexWrap: 'wrap'
      }}>
        <div>
          <h1 style={{ background: 'linear-gradient(135deg, #2E7D64 0%, #1B5E4A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '22px', margin: 0 }}>ELITE NURSING & MIDWIFERY CBT</h1>
          <p style={{ margin: 0, fontSize: '11px', color: '#2E7D64' }}>Computer Based Testing Platform</p>
        </div>
        <DropdownMenu />
      </nav>
      
      <Routes>
        <Route path="/" element={<QuizList />} />
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

  // Handle payment callback from Flutterwave
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const tx_ref = params.get('tx_ref');
    const transaction_id = params.get('transaction_id');
    
    if (status === 'successful' && tx_ref) {
      const verifyPayment = async () => {
        try {
          const response = await axios.post('/api/verify-payment', {
            reference: tx_ref,
            userId: auth.user?.id
          });
          
          if (response.data.success) {
            alert('✅ Payment successful! Your account has been upgraded to PREMIUM!');
            // Update user in state
            setAuth({ ...auth, user: { ...auth.user, isPremium: true } });
            localStorage.setItem('auth', JSON.stringify({ ...auth, user: { ...auth.user, isPremium: true } }));
            window.location.href = '/';
          } else {
            alert('Payment verification failed. Please contact support.');
          }
        } catch (error) {
          console.error('Verification error:', error);
          alert('Payment verification failed. Please contact support.');
        }
      };
      verifyPayment();
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