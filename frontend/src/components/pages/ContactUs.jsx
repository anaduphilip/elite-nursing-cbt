// src/components/pages/ContactUs.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor } from '../../utils/theme';

export const ContactUs = () => {
  const { darkMode, token, user } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [fetching, setFetching] = useState(true);

  const goBack = () => navigate(-1);

  const backButtonStyle = {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    background: darkMode ? '#2d2d3d' : '#ffffff',
    color: headingColor,
    border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
    borderRadius: '30px',
    padding: '10px 28px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    backdropFilter: 'blur(4px)',
    backgroundColor: darkMode ? 'rgba(26, 26, 46, 0.85)' : 'rgba(255, 255, 255, 0.9)'
  };

  // Fetch user's messages if logged in
  useEffect(() => {
    if (token) {
      const fetchMessages = async () => {
        try {
          const res = await axios.get('/api/user/contact-messages', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) {
            setMessages(res.data.messages);
          }
        } catch (err) {
          console.error('Failed to fetch messages:', err);
        } finally {
          setFetching(false);
        }
      };
      fetchMessages();
    } else {
      setFetching(false);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSubmitted(false);
    try {
      await axios.post(
        '/api/contact',
        { name, email, message },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setSubmitted(true);
      // Refresh messages if logged in
      if (token) {
        const res = await axios.get('/api/user/contact-messages', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setMessages(res.data.messages);
        }
      }
      setMessage('');
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <button onClick={goBack} style={backButtonStyle}>Back</button>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 24, marginBottom: 24, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: headingColor, textAlign: 'center', marginBottom: 20 }}>Get in Touch</h2>
          <p style={{ textAlign: 'center', marginBottom: 30, color: secondaryText }}>We'd love to hear from you! Choose your preferred way to reach us.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
            <div style={{ textAlign: 'center', padding: 16, background: darkMode ? '#1a1a2e' : '#f0f7f4', borderRadius: 12 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📧</div>
              <h3 style={{ color: headingColor, fontSize: 16, marginBottom: 4 }}>Email</h3>
              <p style={{ fontSize: 13, wordBreak: 'break-all' }}>
                <a href="mailto:elitenursingcbt@gmail.com" style={{ color: '#2196f3', textDecoration: 'none' }}>
                  elitenursingcbt@gmail.com
                </a>
              </p>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: darkMode ? '#1a1a2e' : '#f0f7f4', borderRadius: 12 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📞</div>
              <h3 style={{ color: headingColor, fontSize: 16, marginBottom: 4 }}>Phone / WhatsApp</h3>
              <p style={{ fontSize: 13 }}>
                <a href="https://wa.me/2349063908476" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', textDecoration: 'none', fontWeight: 'bold' }}>
                  09063908476
                </a>
              </p>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: darkMode ? '#1a1a2e' : '#f0f7f4', borderRadius: 12 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
              <h3 style={{ color: headingColor, fontSize: 16, marginBottom: 4 }}>WhatsApp Group</h3>
              <a href="https://chat.whatsapp.com/HdpwnXzyrLrIqwnpjZqVsb" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', textDecoration: 'none', fontWeight: 'bold', fontSize: 13 }}>
                Join Community
              </a>
            </div>
          </div>
        </div>

        {/* Conversation History */}
        {token && (
          <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 24, marginBottom: 24, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: headingColor, marginBottom: 16 }}>Your Conversation History</h3>
            {fetching ? (
              <p style={{ color: secondaryText }}>Loading your messages…</p>
            ) : messages.length === 0 ? (
              <p style={{ color: secondaryText }}>You haven't sent any messages yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {messages.map((msg) => (
                  <div key={msg._id} style={{ borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`, paddingBottom: 16 }}>
                    {/* User's original message */}
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div style={{ maxWidth: '80%', background: darkMode ? '#2d2d3d' : '#f1f3f5', padding: '10px 14px', borderRadius: '12px 12px 12px 4px', borderLeft: `4px solid #1e3c72` }}>
                        <p style={{ margin: 0, fontSize: 14, color: textColor }}>{msg.message}</p>
                        <span style={{ fontSize: 11, color: secondaryText }}>{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                    {/* Admin reply if exists */}
                    {msg.adminReply && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                        <div style={{ maxWidth: '80%', background: darkMode ? '#1a2e2a' : '#e8f5e9', padding: '10px 14px', borderRadius: '12px 12px 4px 12px', borderRight: `4px solid #2e7d32` }}>
                          <p style={{ margin: 0, fontSize: 14, color: textColor }}>{msg.adminReply}</p>
                          <span style={{ fontSize: 11, color: secondaryText }}>{msg.adminReplyDate ? formatTime(msg.adminReplyDate) : 'Replied'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contact Form */}
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 24, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: headingColor, textAlign: 'center', marginBottom: 20, fontSize: 18 }}>Send us a Message</h3>
          
          {error && (
            <div style={{ background: '#ffebee', padding: 12, borderRadius: 10, marginBottom: 16, textAlign: 'center' }}>
              <p style={{ color: '#c62828', margin: 0, fontSize: 13 }}>{error}</p>
            </div>
          )}
          {submitted && (
            <div style={{ background: darkMode ? '#2d2d3d' : '#e8f5e9', padding: 12, borderRadius: 10, marginBottom: 16, textAlign: 'center' }}>
              <p style={{ color: '#2e7d32', margin: 0, fontSize: 13 }}>✅ Message sent! We'll respond soon.</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <input 
                type="text" 
                placeholder="Your Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 10, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: textColor, boxSizing: 'border-box' }} 
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <input 
                type="email" 
                placeholder="Your Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 10, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: textColor, boxSizing: 'border-box' }} 
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <textarea 
                placeholder="Your Message" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                required 
                rows="4" 
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: 10, fontSize: 14, resize: 'vertical', background: darkMode ? '#1a1a2e' : '#f8f9fa', color: textColor, boxSizing: 'border-box' }} 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              style={{ width: '100%', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white', padding: '12px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 14, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
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