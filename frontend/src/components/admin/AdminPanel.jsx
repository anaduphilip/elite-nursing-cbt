// src/components/admin/AdminPanel.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

export const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [weeklyQuizzes, setWeeklyQuizzes] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const { token, user, darkMode, logout } = useContext(AuthContext);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const cardBg = getCardBg(darkMode);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('');

  // ---- Broadcast states ----
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTemplate, setBroadcastTemplate] = useState('upgrade');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState('');

  // ---- Announcement states ----
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementButtonText, setAnnouncementButtonText] = useState('Learn More');
  const [announcementButtonLink, setAnnouncementButtonLink] = useState('/get-premium');
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [announcementVersion, setAnnouncementVersion] = useState(0);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementResult, setAnnouncementResult] = useState('');

  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizInstructions, setQuizInstructions] = useState('');
  const [quizWeekNumber, setQuizWeekNumber] = useState('');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizPassingScore, setQuizPassingScore] = useState(70);
  const [quizTimeLimit, setQuizTimeLimit] = useState(20);
  const [quizStartDate, setQuizStartDate] = useState('');
  const [quizEndDate, setQuizEndDate] = useState('');
  const [quizIsPremium, setQuizIsPremium] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [selectedQuizResults, setSelectedQuizResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState(0);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [batchInput, setBatchInput] = useState('');

  const [manualOtpEmail, setManualOtpEmail] = useState('');
  const [manualOtpResult, setManualOtpResult] = useState('');
  const [generatingOtp, setGeneratingOtp] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [resetOtpResult, setResetOtpResult] = useState('');
  const [generatingResetOtp, setGeneratingResetOtp] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user || user.email !== 'elitenursingcbt@gmail.com') {
      alert('Admin access only');
      window.location.href = '/';
      return;
    }

    const fetchData = async () => {
      try {
        const [usersRes, contactsRes, quizzesRes] = await Promise.all([
          axios.get('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/contacts', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/weekly-quizzes', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setUsers(usersRes.data);
        setContacts(contactsRes.data);
        setWeeklyQuizzes(quizzesRes.data);
        const initial = {};
        usersRes.data.forEach(u => {
          initial[u._id] = u.isPremium ? (u.premiumPlan || 'monthly') : 'none';
        });
        setSelectedPlan(initial);
        setDataLoaded(true);
      } catch (error) {
        if (error.response?.status === 403 || error.response?.status === 401) {
          alert('Admin access only. You will be redirected.');
          logout();
          window.location.href = '/login';
        } else {
          console.error('Error fetching admin data:', error);
        }
      }
    };

    fetchData();
  }, []);

  const applyPlan = async (userId) => {
    const plan = selectedPlan[userId];
    if (!plan) return alert('Please select a plan first.');
    try {
      const response = await axios.post('/api/admin/set-premium-plan',
        { userId, planType: plan },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        const updatedUser = response.data.user || { ...users.find(u => u._id === userId), isPremium: plan !== 'none', premiumPlan: plan !== 'none' ? plan : null };
        setUsers(users.map(u => u._id === userId ? updatedUser : u));
        alert(response.data.message);
      }
    } catch (error) {
      alert('Failed to apply plan: ' + (error.response?.data?.error || error.message));
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
        setUsers(users.filter(u => u._id !== userId));
        alert('User deleted successfully');
      } catch (error) {
        alert('Failed to delete user');
      }
    }
  };

  const sendReply = async (contactEmail, contactName, originalMessage) => {
    if (!replyMessage.trim()) {
      alert('Please enter a reply message');
      return;
    }
    setSendingReply(true);
    try {
      await axios.post('/api/admin/reply-message', {
        to: contactEmail,
        name: contactName,
        originalMessage: originalMessage,
        reply: replyMessage
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Reply sent successfully!');
      setReplyingTo(null);
      setReplyMessage('');
    } catch (error) {
      alert('Failed to send reply: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setSendingReply(false);
    }
  };

  const sendNotification = async () => {
    if (!notificationTitle || !notificationMessage) {
      alert('Please enter both a title and a message.');
      return;
    }
    setSendingNotification(true);
    setNotificationStatus('');
    try {
      const response = await axios.post('/api/admin/send-notification', {
        title: notificationTitle,
        message: notificationMessage
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        setNotificationStatus(`✅ Sent successfully to ${response.data.successCount} devices.`);
        setNotificationTitle('');
        setNotificationMessage('');
      } else {
        setNotificationStatus('❌ Failed to send notifications.');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setNotificationStatus('❌ An error occurred.');
    } finally {
      setSendingNotification(false);
    }
  };

  const generateManualOtp = async () => {
    if (!manualOtpEmail.trim()) {
      alert('Please enter an email address');
      return;
    }
    setGeneratingOtp(true);
    setManualOtpResult('');
    try {
      const response = await axios.post('/api/admin/generate-verification-code', 
        { email: manualOtpEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.otp) {
        setManualOtpResult(`✅ Verification code for ${manualOtpEmail}: ${response.data.otp} (valid 10 minutes)`);
      } else {
        setManualOtpResult('❌ Failed to generate code');
      }
    } catch (error) {
      console.error('Generate OTP error:', error);
      setManualOtpResult(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setGeneratingOtp(false);
    }
  };

  const generateManualResetOtp = async () => {
    if (!resetEmail.trim()) {
      alert('Please enter an email address');
      return;
    }
    setGeneratingResetOtp(true);
    setResetOtpResult('');
    try {
      const response = await axios.post('/api/admin/generate-reset-code', 
        { email: resetEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.otp) {
        setResetOtpResult(`✅ Reset code for ${resetEmail}: ${response.data.otp} (valid 10 minutes)`);
      } else {
        setResetOtpResult('❌ Failed to generate code');
      }
    } catch (error) {
      console.error('Generate reset OTP error:', error);
      setResetOtpResult(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setGeneratingResetOtp(false);
    }
  };

  const fetchWeeklyQuizzes = async () => {
    setLoadingQuizzes(true);
    try {
      const res = await axios.get('/api/admin/weekly-quizzes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWeeklyQuizzes(res.data);
    } catch (error) {
      alert('Failed to fetch weekly quizzes');
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const handleAddQuestion = () => {
    if (!qText.trim()) {
      alert('Please enter a question');
      return;
    }
    if (qOptions.some(opt => !opt.trim())) {
      alert('Please fill in all 4 options');
      return;
    }
    const newQuestion = {
      questionText: qText.trim(),
      options: qOptions.map(opt => opt.trim()),
      correctAnswer: qCorrect,
      points: 1
    };
    if (editingQuestionIndex !== null) {
      const updated = [...quizQuestions];
      updated[editingQuestionIndex] = newQuestion;
      setQuizQuestions(updated);
      setEditingQuestionIndex(null);
    } else {
      setQuizQuestions([...quizQuestions, newQuestion]);
    }
    setQText('');
    setQOptions(['', '', '', '']);
    setQCorrect(0);
  };

  const handleBatchImport = () => {
    if (!batchInput.trim()) {
      alert('Please paste some questions first.');
      return;
    }

    const lines = batchInput.split('\n').map(l => l.trim()).filter(l => l);
    const parsedQuestions = [];
    
    let currentBlock = '';
    const blocks = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^Q\d+\./i)) {
        if (currentBlock.trim()) {
          blocks.push(currentBlock.trim());
        }
        currentBlock = line;
      } else {
        currentBlock += '\n' + line;
      }
    }
    if (currentBlock.trim()) {
      blocks.push(currentBlock.trim());
    }

    for (const block of blocks) {
      const qMatch = block.match(/^Q\d+\.\s*(.*)/i);
      if (!qMatch) continue;
      
      const fullText = qMatch[1];
      let questionText = fullText;
      const options = [];
      let answerLetter = null;

      const optionPattern = /\(([a-d])\)\s*([^(]+?)(?=\s*\([a-d]\)|$)/gi;
      let match;
      while ((match = optionPattern.exec(fullText)) !== null) {
        options.push(match[2].trim());
      }

      if (options.length !== 4) {
        const linesInBlock = block.split('\n');
        for (const line of linesInBlock) {
          const optMatch = line.match(/^\(([a-d])\)\s*(.*)/i);
          if (optMatch) {
            options.push(optMatch[2].trim());
          }
        }
      }

      questionText = fullText.replace(/\s*\([a-d]\)[^(]*/g, '').trim();
      
      if (!questionText) {
        const firstLine = block.split('\n')[0];
        if (firstLine) {
          questionText = firstLine.replace(/^Q\d+\.\s*/i, '').trim();
        }
      }

      const answerMatch = block.match(/Answer:\s*([a-d])/i);
      if (answerMatch) {
        answerLetter = answerMatch[1].toUpperCase();
      } else {
        const lastLines = block.split('\n').slice(-3);
        for (const line of lastLines) {
          const ansMatch = line.match(/^([a-d])\.?\s*$/i);
          if (ansMatch) {
            answerLetter = ansMatch[1].toUpperCase();
            break;
          }
        }
      }

      if (options.length === 4 && questionText) {
        const correctIndex = answerLetter ? answerLetter.charCodeAt(0) - 65 : 0;
        parsedQuestions.push({
          questionText: questionText,
          options: options,
          correctAnswer: correctIndex,
          points: 1
        });
      }
    }

    if (parsedQuestions.length === 0) {
      for (const line of lines) {
        if (line.match(/^Q\d+\./i)) {
          const qText2 = line.replace(/^Q\d+\.\s*/i, '').trim();
          const options2 = [];
          const optPattern2 = /\(([a-d])\)\s*([^(]+?)(?=\s*\([a-d]\)|$)/gi;
          let match2;
          while ((match2 = optPattern2.exec(qText2)) !== null) {
            options2.push(match2[2].trim());
          }
          let questionText2 = qText2.replace(/\s*\([a-d]\)[^(]*/g, '').trim();
          if (options2.length === 4 && questionText2) {
            parsedQuestions.push({
              questionText: questionText2,
              options: options2,
              correctAnswer: 0,
              points: 1
            });
          }
        }
      }
    }

    if (parsedQuestions.length === 0) {
      alert('No valid questions found. Please check the format.\n\nSupported formats:\n1. Q1. Question text? (a) Option (b) Option (c) Option (d) Option\n2. Q1. Question text?\n(a) Option\n(b) Option\n(c) Option\n(d) Option\nAnswer: a');
      return;
    }

    setQuizQuestions(prev => [...prev, ...parsedQuestions]);
    setBatchInput('');
    alert(`✅ ${parsedQuestions.length} questions added successfully!`);
  };

  const handleEditQuestion = (index) => {
    const q = quizQuestions[index];
    setQText(q.questionText);
    setQOptions(q.options);
    setQCorrect(q.correctAnswer);
    setEditingQuestionIndex(index);
  };

  const handleDeleteQuestion = (index) => {
    const updated = [...quizQuestions];
    updated.splice(index, 1);
    setQuizQuestions(updated);
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(null);
      setQText('');
      setQOptions(['', '', '', '']);
      setQCorrect(0);
    }
  };

  const handleSaveQuiz = async () => {
    if (!quizTitle.trim()) {
      alert('Please enter a quiz title');
      return;
    }
    if (!quizWeekNumber || isNaN(quizWeekNumber)) {
      alert('Please enter a valid week number');
      return;
    }
    if (quizQuestions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    const payload = {
      title: quizTitle.trim(),
      description: quizDescription.trim() || `${quizTitle.trim()} - Week ${quizWeekNumber}`,
      instructions: quizInstructions.trim() || '',
      weekNumber: parseInt(quizWeekNumber),
      questions: quizQuestions,
      passingScore: quizPassingScore || 70,
      timeLimit: quizTimeLimit || 20,
      startDate: quizStartDate ? new Date(quizStartDate) : null,
      endDate: quizEndDate ? new Date(quizEndDate) : null,
      isActive: false,
      isPremium: quizIsPremium
    };

    try {
      let res;
      if (editingQuizId) {
        res = await axios.put(`/api/admin/weekly-quiz/${editingQuizId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        res = await axios.post('/api/admin/weekly-quiz', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      if (res.data.success) {
        alert(editingQuizId ? 'Quiz updated successfully!' : 'Quiz created successfully!');
        resetQuizForm();
        await fetchWeeklyQuizzes();
      }
    } catch (error) {
      alert('Failed to save quiz: ' + (error.response?.data?.error || error.message));
    }
  };

  const handlePublishQuiz = async () => {
    if (!quizTitle.trim()) {
      alert('Please enter a quiz title');
      return;
    }
    if (!quizWeekNumber || isNaN(quizWeekNumber)) {
      alert('Please enter a valid week number');
      return;
    }
    if (quizQuestions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    const payload = {
      title: quizTitle.trim(),
      description: quizDescription.trim() || `${quizTitle.trim()} - Week ${quizWeekNumber}`,
      instructions: quizInstructions.trim() || '',
      weekNumber: parseInt(quizWeekNumber),
      questions: quizQuestions,
      passingScore: quizPassingScore || 70,
      timeLimit: quizTimeLimit || 20,
      startDate: quizStartDate ? new Date(quizStartDate) : null,
      endDate: quizEndDate ? new Date(quizEndDate) : null,
      isActive: true,
      isPremium: quizIsPremium
    };

    try {
      let res;
      if (editingQuizId) {
        res = await axios.put(`/api/admin/weekly-quiz/${editingQuizId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        res = await axios.post('/api/admin/weekly-quiz', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      if (res.data.success) {
        alert('✅ Quiz published successfully!');
        resetQuizForm();
        await fetchWeeklyQuizzes();
      }
    } catch (error) {
      alert('Failed to publish quiz: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleTogglePublish = async (quizId, currentStatus) => {
    try {
      const res = await axios.post(`/api/admin/weekly-quiz/${quizId}/toggle-publish`, 
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        await fetchWeeklyQuizzes();
        alert(currentStatus ? 'Quiz unpublished' : 'Quiz published!');
      }
    } catch (error) {
      alert('Failed to toggle publish status: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleTogglePremium = async (quizId, currentStatus) => {
    try {
      const res = await axios.post(`/api/admin/weekly-quiz/${quizId}/toggle-premium`, 
        { isPremium: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        await fetchWeeklyQuizzes();
        alert(currentStatus ? 'Premium removed' : 'Quiz is now Premium!');
      }
    } catch (error) {
      alert('Failed to toggle premium status: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz? All attempts will be lost.')) return;
    try {
      await axios.delete(`/api/admin/weekly-quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Quiz deleted successfully');
      await fetchWeeklyQuizzes();
    } catch (error) {
      alert('Failed to delete quiz');
    }
  };

  const handleViewResults = async (quizId) => {
    try {
      const res = await axios.get(`/api/admin/weekly-quiz/${quizId}/results`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedQuizResults(res.data);
      setShowResults(true);
    } catch (error) {
      alert('Failed to fetch results');
    }
  };

  const resetQuizForm = () => {
    setQuizTitle('');
    setQuizDescription('');
    setQuizInstructions('');
    setQuizWeekNumber('');
    setQuizQuestions([]);
    setQuizPassingScore(70);
    setQuizTimeLimit(20);
    setQuizStartDate('');
    setQuizEndDate('');
    setQuizIsPremium(false);
    setEditingQuizId(null);
    setEditingQuestionIndex(null);
    setQText('');
    setQOptions(['', '', '', '']);
    setQCorrect(0);
    setBatchInput('');
    setShowQuizForm(false);
  };

  const editQuiz = (quiz) => {
    setQuizTitle(quiz.title);
    setQuizDescription(quiz.description || '');
    setQuizInstructions(quiz.instructions || '');
    setQuizWeekNumber(quiz.weekNumber.toString());
    setQuizQuestions(quiz.questions);
    setQuizPassingScore(quiz.passingScore || 70);
    setQuizTimeLimit(quiz.timeLimit || 20);
    setQuizStartDate(quiz.startDate ? new Date(quiz.startDate).toISOString().slice(0, 16) : '');
    setQuizEndDate(quiz.endDate ? new Date(quiz.endDate).toISOString().slice(0, 16) : '');
    setQuizIsPremium(quiz.isPremium || false);
    setEditingQuizId(quiz._id);
    setShowQuizForm(true);
  };

  if (!dataLoaded) return <LoadingWithBar message="Loading admin panel" />;

  if (user?.email !== 'elitenursingcbt@gmail.com') return <Navigate to="/" />;

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getQuizStatus = (quiz) => {
    if (!quiz.isActive) return { label: 'Draft', color: '#6c757d' };
    if (quiz.startDate && new Date(quiz.startDate) > new Date()) return { label: 'Scheduled', color: '#17a2b8' };
    if (quiz.endDate && new Date(quiz.endDate) < new Date()) return { label: 'Expired', color: '#dc3545' };
    return { label: 'Published', color: '#28a745' };
  };

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 24, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <h1 style={{ color: headingColor, textAlign: 'center', marginBottom: 20, fontSize: 28 }}>Admin Panel</h1>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '2px solid #e0e0e0', paddingBottom: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setActiveTab('users')} style={{ background: activeTab === 'users' ? '#1e3c72' : 'transparent', color: activeTab === 'users' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'users' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Users ({filteredUsers.length})</button>
            <button onClick={() => setActiveTab('contacts')} style={{ background: activeTab === 'contacts' ? '#1e3c72' : 'transparent', color: activeTab === 'contacts' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'contacts' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Contact Messages ({contacts.length})</button>
            <button onClick={() => setActiveTab('notifications')} style={{ background: activeTab === 'notifications' ? '#ff9800' : 'transparent', color: activeTab === 'notifications' ? 'white' : '#ff9800', padding: '10px 24px', border: activeTab === 'notifications' ? 'none' : '1px solid #ff9800', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Send Notification</button>
            <button onClick={() => setActiveTab('manualOtp')} style={{ background: activeTab === 'manualOtp' ? '#6c757d' : 'transparent', color: activeTab === 'manualOtp' ? 'white' : '#6c757d', padding: '10px 24px', border: activeTab === 'manualOtp' ? 'none' : '1px solid #6c757d', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Manual OTP</button>
            <button onClick={() => setActiveTab('manualReset')} style={{ background: activeTab === 'manualReset' ? '#6c757d' : 'transparent', color: activeTab === 'manualReset' ? 'white' : '#6c757d', padding: '10px 24px', border: activeTab === 'manualReset' ? 'none' : '1px solid #6c757d', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Manual Reset</button>
            <button onClick={() => setActiveTab('broadcast')} style={{ background: activeTab === 'broadcast' ? '#1e3c72' : 'transparent', color: activeTab === 'broadcast' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'broadcast' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Broadcast</button>
            <button onClick={() => setActiveTab('announcement')} style={{ background: activeTab === 'announcement' ? '#1e3c72' : 'transparent', color: activeTab === 'announcement' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'announcement' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Announcement</button>
            <button onClick={() => { setActiveTab('weeklyQuiz'); if (weeklyQuizzes.length === 0) fetchWeeklyQuizzes(); }} style={{ background: activeTab === 'weeklyQuiz' ? '#2E7D64' : 'transparent', color: activeTab === 'weeklyQuiz' ? 'white' : '#2E7D64', padding: '10px 24px', border: activeTab === 'weeklyQuiz' ? 'none' : '1px solid #2E7D64', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}> Weekly Quiz ({weeklyQuizzes.length})</button>
          </div>

          {activeTab === 'users' && (
            <>
              <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
                <input
                  type="text"
                  placeholder="🔍 Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: 400,
                    padding: '10px 16px',
                    borderRadius: 30,
                    border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                    background: darkMode ? '#2d2d3d' : 'white',
                    color: textColor,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1e3c72'}
                  onBlur={(e) => e.target.style.borderColor = darkMode ? '#444' : '#ddd'}
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }}>
                {filteredUsers.map(u => {
                  const currentPlan = u.isPremium ? (u.premiumPlan || 'monthly') : 'none';
                  return (
                    <div key={u._id} style={{ width: '350px', background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: 20, borderRadius: 12, border: '1px solid ' + (darkMode ? '#444' : '#e0e0e0') }}>
                      <p><strong>Name:</strong> {u.name || 'N/A'}</p>
                      <p><strong>Email:</strong> {u.email}</p>
                      <p><strong>Premium:</strong> {u.isPremium ? '✅ Yes' : '❌ No'}</p>
                      {u.isPremium && <p><strong>Plan:</strong> {u.premiumPlan ? u.premiumPlan.toUpperCase() : 'N/A'}</p>}
                      {u.isPremium && u.premiumExpiry && <p><strong>Expires:</strong> {new Date(u.premiumExpiry).toLocaleDateString()}</p>}
                      <p><strong>Verified:</strong> {u.isVerified ? '✅ Yes' : '❌ No'}</p>
                      <p><strong>Joined:</strong> {new Date(u.createdAt).toLocaleDateString()}</p>
                      
                      <div style={{ marginTop: 15 }}>
                        <label style={{ fontSize: 13, fontWeight: 'bold', display: 'block', marginBottom: 4 }}>Set Premium Plan:</label>
                        <select 
                          value={selectedPlan[u._id] || currentPlan}
                          onChange={(e) => setSelectedPlan(prev => ({ ...prev, [u._id]: e.target.value }))}
                          style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #ccc', background: cardBg, fontSize: 14 }}
                        >
                          <option value="none">None (Remove Premium)</option>
                          <option value="daily">Daily (₦500)</option>
                          <option value="monthly">Monthly (₦2000)</option>
                          <option value="yearly">Yearly (₦10000)</option>
                        </select>
                        <button 
                          onClick={() => applyPlan(u._id)}
                          style={{ width: '100%', marginTop: 6, background: '#1e3c72', color: 'white', border: 'none', padding: '8px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}
                        >
                          Apply Plan
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <button onClick={() => deleteUser(u._id)} style={{ background: '#dc3545', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}>Delete User</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredUsers.length === 0 && (
                <p style={{ textAlign: 'center', color: secondaryText, marginTop: 20 }}>
                  No users found matching "{searchQuery}"
                </p>
              )}
            </>
          )}

          {activeTab === 'contacts' && (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {contacts.map(c => (
                <div key={c._id} style={{ background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: 20, borderRadius: 12, marginBottom: 16, border: '1px solid ' + (darkMode ? '#444' : '#e0e0e0') }}>
                  <p><strong>From:</strong> {c.name} ({c.email})</p>
                  <p><strong>Message:</strong> {c.message}</p>
                  <p><strong>Received:</strong> {new Date(c.createdAt).toLocaleString()}</p>
                  {replyingTo === c._id ? (
                    <div style={{ marginTop: 16 }}>
                      <textarea
                        placeholder="Type your reply here..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        rows="4"
                        style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: 10, fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => sendReply(c.email, c.name, c.message)} disabled={sendingReply} style={{ background: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}>
                          {sendingReply ? 'Sending...' : 'Send Reply'}
                        </button>
                        <button onClick={() => { setReplyingTo(null); setReplyMessage(''); }} style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setReplyingTo(c._id)} style={{ marginTop: 12, background: '#1e3c72', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}>📧 Reply to Message</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div style={{ padding: 20 }}>
              <h3 style={{ color: headingColor, marginBottom: 20 }}>Send Push Notification to All Users</h3>
              <div style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="Notification Title"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14 }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <textarea
                  placeholder="Notification Message"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  rows="4"
                  style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
                />
              </div>
              <button
                onClick={sendNotification}
                disabled={sendingNotification}
                style={{ background: '#ff9800', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
              >
                {sendingNotification ? 'Sending...' : 'Send Notification'}
              </button>
              {notificationStatus && <p style={{ marginTop: 16, color: '#2e7d32' }}>{notificationStatus}</p>}
            </div>
          )}

          {activeTab === 'manualOtp' && (
            <div style={{ padding: 20 }}>
              <h3 style={{ color: headingColor, marginBottom: 20 }}>Generate Manual Verification Code</h3>
              <p style={{ marginBottom: 16, color: secondaryText }}>Use this only when a user cannot receive email. The code will be shown here and can be given to the user.</p>
              <div style={{ marginBottom: 16 }}>
                <input
                  type="email"
                  placeholder="User's email address"
                  value={manualOtpEmail}
                  onChange={(e) => setManualOtpEmail(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14 }}
                />
              </div>
              <button
                onClick={generateManualOtp}
                disabled={generatingOtp}
                style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
              >
                {generatingOtp ? 'Generating...' : 'Generate Code'}
              </button>
              {manualOtpResult && (
                <div style={{ marginTop: 16, padding: 12, background: darkMode ? '#2d2d3d' : '#e8f5e9', borderRadius: 8, borderLeft: '4px solid #2e7d32' }}>
                  <p style={{ margin: 0, color: '#2e7d32' }}>{manualOtpResult}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'manualReset' && (
            <div style={{ padding: 20 }}>
              <h3 style={{ color: headingColor, marginBottom: 20 }}>Generate Password Reset Code</h3>
              <p style={{ marginBottom: 16, color: secondaryText }}>Use this when a user cannot receive password reset email. The code will be shown here and can be given to the user.</p>
              <div style={{ marginBottom: 16 }}>
                <input
                  type="email"
                  placeholder="User's email address"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14 }}
                />
              </div>
              <button
                onClick={generateManualResetOtp}
                disabled={generatingResetOtp}
                style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
              >
                {generatingResetOtp ? 'Generating...' : 'Generate Reset Code'}
              </button>
              {resetOtpResult && (
                <div style={{ marginTop: 16, padding: 12, background: darkMode ? '#2d2d3d' : '#e8f5e9', borderRadius: 8, borderLeft: '4px solid #2e7d32' }}>
                  <p style={{ margin: 0, color: '#2e7d32' }}>{resetOtpResult}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'broadcast' && (
            <div style={{ padding: 20 }}>
              <h3 style={{ color: headingColor, marginBottom: 20 }}>Send Email Broadcast to Free Users</h3>
              <p style={{ color: secondaryText, marginBottom: 16 }}>
                Send a promotional email to all free users who have opted in to marketing emails.
              </p>
              <div style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="Email Subject"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <textarea
                  placeholder="Custom Message (optional – if empty, uses template)"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows="4"
                  style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <select
                  value={broadcastTemplate}
                  onChange={(e) => setBroadcastTemplate(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : 'white', color: darkMode ? 'white' : '#333' }}
                >
                  <option value="upgrade">Upgrade Reminder</option>
                  <option value="reminder">Re-engagement</option>
                  <option value="winback">Win-back</option>
                </select>
              </div>
              <button
                onClick={async () => {
                  setBroadcastLoading(true);
                  setBroadcastResult('');
                  try {
                    const res = await axios.post('/api/admin/broadcast-email', {
                      subject: broadcastSubject,
                      message: broadcastMessage,
                      templateType: broadcastTemplate
                    }, { headers: { Authorization: `Bearer ${token}` } });
                    setBroadcastResult(`✅ ${res.data.message}`);
                  } catch (error) {
                    setBroadcastResult('❌ Failed to send broadcast: ' + (error.response?.data?.error || error.message));
                  } finally {
                    setBroadcastLoading(false);
                  }
                }}
                disabled={broadcastLoading}
                style={{ background: '#1e3c72', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', opacity: broadcastLoading ? 0.7 : 1 }}
              >
                {broadcastLoading ? 'Sending...' : 'Send Broadcast'}
              </button>
              {broadcastResult && <p style={{ marginTop: 16, color: '#2e7d32' }}>{broadcastResult}</p>}
            </div>
          )}

          {activeTab === 'announcement' && (
            <div style={{ padding: 20 }}>
              <h3 style={{ color: headingColor, marginBottom: 20 }}>One-Time Home Page Banner</h3>
              <p style={{ color: secondaryText, marginBottom: 16 }}>
                Create a banner that each user sees once on the home page. Update it anytime – it will reappear for all users with the new version.
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Message</label>
                <textarea
                  placeholder="Enter the banner message"
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  rows="3"
                  style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Button Text</label>
                <input
                  type="text"
                  placeholder="e.g., Get Premium Now"
                  value={announcementButtonText}
                  onChange={(e) => setAnnouncementButtonText(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Button Link</label>
                <input
                  type="text"
                  placeholder="/get-premium, /weekly-quiz, /contact, etc."
                  value={announcementButtonLink}
                  onChange={(e) => setAnnouncementButtonLink(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: textColor, fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={announcementActive}
                    onChange={(e) => setAnnouncementActive(e.target.checked)}
                  />
                  Active (banner will be shown)
                </label>
                <span style={{ color: secondaryText, fontSize: 13 }}>
                  Version: {announcementVersion}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={async () => {
                    if (!announcementMessage.trim()) {
                      alert('Message is required');
                      return;
                    }
                    setAnnouncementLoading(true);
                    setAnnouncementResult('');
                    try {
                      const res = await axios.post('/api/admin/announcement', {
                        message: announcementMessage,
                        buttonText: announcementButtonText,
                        buttonLink: announcementButtonLink,
                        active: announcementActive
                      }, { headers: { Authorization: `Bearer ${token}` } });
                      if (res.data.success) {
                        setAnnouncementResult(`✅ Banner updated! Version: ${res.data.announcement.version}`);
                        setAnnouncementVersion(res.data.announcement.version);
                      }
                    } catch (error) {
                      setAnnouncementResult('❌ Failed to update banner: ' + (error.response?.data?.error || error.message));
                    } finally {
                      setAnnouncementLoading(false);
                    }
                  }}
                  disabled={announcementLoading}
                  style={{ background: '#1e3c72', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', opacity: announcementLoading ? 0.7 : 1 }}
                >
                  {announcementLoading ? 'Saving...' : 'Publish Banner'}
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm('Deactivate the banner? Users who haven\'t seen it will not see it.')) return;
                    setAnnouncementLoading(true);
                    try {
                      const res = await axios.delete('/api/admin/announcement', { headers: { Authorization: `Bearer ${token}` } });
                      if (res.data.success) {
                        setAnnouncementResult('✅ Banner deactivated.');
                        setAnnouncementActive(false);
                        setAnnouncementVersion(prev => prev + 1);
                      }
                    } catch (error) {
                      setAnnouncementResult('❌ Failed to deactivate: ' + (error.response?.data?.error || error.message));
                    } finally {
                      setAnnouncementLoading(false);
                    }
                  }}
                  style={{ background: '#dc3545', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Deactivate Banner
                </button>
                <button
                  onClick={async () => {
                    setAnnouncementLoading(true);
                    try {
                      const res = await axios.get('/api/admin/announcement', { headers: { Authorization: `Bearer ${token}` } });
                      if (res.data.announcement) {
                        const a = res.data.announcement;
                        setAnnouncementMessage(a.message || '');
                        setAnnouncementButtonText(a.buttonText || 'Learn More');
                        setAnnouncementButtonLink(a.buttonLink || '/get-premium');
                        setAnnouncementActive(a.active || false);
                        setAnnouncementVersion(a.version || 0);
                        setAnnouncementResult('✅ Loaded current banner.');
                      } else {
                        setAnnouncementResult('No banner found. Create one now.');
                      }
                    } catch (error) {
                      setAnnouncementResult('❌ Failed to load: ' + (error.response?.data?.error || error.message));
                    } finally {
                      setAnnouncementLoading(false);
                    }
                  }}
                  style={{ background: '#6c757d', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Load Current
                </button>
              </div>
              {announcementResult && <p style={{ marginTop: 16, color: '#2e7d32' }}>{announcementResult}</p>}
            </div>
          )}

          {activeTab === 'weeklyQuiz' && (
            <div style={{ padding: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <h3 style={{ color: headingColor, margin: 0 }}>Manage Weekly Quizzes</h3>
                <button
                  onClick={() => setShowQuizForm(!showQuizForm)}
                  style={{ background: showQuizForm ? '#dc3545' : '#2E7D64', color: 'white', padding: '10px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {showQuizForm ? '✕ Cancel' : '+ Create New Quiz'}
                </button>
              </div>

              {showQuizForm && (
                <div style={{ 
                  background: darkMode ? '#1a1a2e' : '#f8f9fa', 
                  padding: '24px 28px', 
                  borderRadius: 16, 
                  marginBottom: 28, 
                  border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <h4 style={{ color: headingColor, marginBottom: 20, fontSize: 18 }}>{editingQuizId ? ' Edit Quiz' : ' New Weekly Quiz'}</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px', marginBottom: 18 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Quiz Title <span style={{ color: '#dc3545' }}>*</span></label>
                      <input
                        type="text"
                        placeholder="e.g., Week 1 - Fundamentals"
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                        style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Week Number <span style={{ color: '#dc3545' }}>*</span></label>
                      <input
                        type="number"
                        placeholder="1, 2, 3..."
                        value={quizWeekNumber}
                        onChange={(e) => setQuizWeekNumber(e.target.value)}
                        style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }}
                        min="1"
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Description <span style={{ color: '#999', fontWeight: 'normal' }}>(optional)</span></label>
                    <input
                      type="text"
                      placeholder="Brief description of the quiz"
                      value={quizDescription}
                      onChange={(e) => setQuizDescription(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Instructions <span style={{ color: '#999', fontWeight: 'normal' }}>(shown before quiz starts)</span></label>
                    <textarea
                      placeholder="e.g., Answer all questions carefully. You cannot go back after submitting."
                      value={quizInstructions}
                      onChange={(e) => setQuizInstructions(e.target.value)}
                      rows="3"
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px', marginBottom: 18 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Start Date <span style={{ color: '#999', fontWeight: 'normal' }}>(optional)</span></label>
                      <input
                        type="datetime-local"
                        value={quizStartDate}
                        onChange={(e) => setQuizStartDate(e.target.value)}
                        style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>End Date <span style={{ color: '#999', fontWeight: 'normal' }}>(optional)</span></label>
                      <input
                        type="datetime-local"
                        value={quizEndDate}
                        onChange={(e) => setQuizEndDate(e.target.value)}
                        style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '12px 16px', background: darkMode ? '#2d2d3d' : '#f0f7f4', borderRadius: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 'bold', color: textColor, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={quizIsPremium}
                        onChange={(e) => setQuizIsPremium(e.target.checked)}
                        style={{ marginRight: 8, width: 18, height: 18, cursor: 'pointer' }}
                      />
                      Premium Quiz <span style={{ fontWeight: 'normal', color: secondaryText }}>(users need premium to access)</span>
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px', marginBottom: 20 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Passing Score (%)</label>
                      <input
                        type="number"
                        placeholder="70"
                        value={quizPassingScore}
                        onChange={(e) => setQuizPassingScore(parseInt(e.target.value) || 70)}
                        style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }}
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Time Limit (minutes)</label>
                      <input
                        type="number"
                        placeholder="20"
                        value={quizTimeLimit}
                        onChange={(e) => setQuizTimeLimit(parseInt(e.target.value) || 20)}
                        style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }}
                        min="1"
                      />
                    </div>
                  </div>

                  <div style={{ 
                    marginBottom: 20, 
                    borderTop: `2px solid ${darkMode ? '#444' : '#e0e0e0'}`, 
                    paddingTop: 20 
                  }}>
                    <h5 style={{ color: headingColor, marginBottom: 14, fontSize: 16 }}>Questions ({quizQuestions.length})</h5>
                    
                    <div style={{ 
                      background: darkMode ? '#2d2d3d' : '#f0f7f4', 
                      padding: '16px 18px', 
                      borderRadius: 12, 
                      marginBottom: 18,
                      border: `1px dashed ${darkMode ? '#666' : '#aaa'}`
                    }}>
                      <p style={{ fontSize: 13, color: secondaryText, marginBottom: 8 }}>
                        <strong>Batch Import:</strong> Paste multiple questions at once.
                      </p>
                      <textarea
                        placeholder="Paste your questions here...&#10;Q1. Question text? (a) Option (b) Option (c) Option (d) Option&#10;Answer: a"
                        value={batchInput}
                        onChange={(e) => setBatchInput(e.target.value)}
                        rows="4"
                        style={{ 
                          width: '100%', 
                          padding: '12px 14px', 
                          border: '1px solid #ccc', 
                          borderRadius: 8, 
                          fontSize: 14, 
                          background: cardBg, 
                          color: textColor,
                          boxSizing: 'border-box',
                          resize: 'vertical',
                          fontFamily: 'monospace'
                        }}
                      />
                      <button
                        onClick={handleBatchImport}
                        style={{ 
                          marginTop: 10, 
                          background: '#17a2b8', 
                          color: 'white', 
                          padding: '8px 20px', 
                          border: 'none', 
                          borderRadius: 6, 
                          cursor: 'pointer', 
                          fontWeight: 'bold',
                          fontSize: 13
                        }}
                      >
                         Import Questions
                      </button>
                    </div>

                    <div style={{ 
                      background: darkMode ? '#2d2d3d' : 'white', 
                      padding: '18px 20px', 
                      borderRadius: 12, 
                      marginBottom: 16,
                      border: `1px solid ${darkMode ? '#555' : '#eee'}`
                    }}>
                      <div style={{ marginBottom: 14 }}>
                        <input
                          type="text"
                          placeholder="Enter question text"
                          value={qText}
                          onChange={(e) => setQText(e.target.value)}
                          style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: 14 }}>
                        {qOptions.map((opt, idx) => (
                          <input
                            key={idx}
                            type="text"
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...qOptions];
                              newOpts[idx] = e.target.value;
                              setQOptions(newOpts);
                            }}
                            style={{ padding: '10px 12px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, background: cardBg, color: textColor, boxSizing: 'border-box' }}
                          />
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <label style={{ fontSize: 13, fontWeight: 'bold', color: textColor }}>Correct Answer:</label>
                        <select
                          value={qCorrect}
                          onChange={(e) => setQCorrect(parseInt(e.target.value))}
                          style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #ccc', background: cardBg, color: textColor, fontSize: 13 }}
                        >
                          {qOptions.map((_, idx) => (
                            <option key={idx} value={idx}>Option {String.fromCharCode(65 + idx)}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleAddQuestion}
                          style={{ background: '#2E7D64', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}
                        >
                          {editingQuestionIndex !== null ? 'Update' : '➕ Add'}
                        </button>
                        {editingQuestionIndex !== null && (
                          <button
                            onClick={() => { setEditingQuestionIndex(null); setQText(''); setQOptions(['', '', '', '']); setQCorrect(0); }}
                            style={{ background: '#6c757d', color: 'white', padding: '6px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {quizQuestions.length > 0 && (
                      <div style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                        {quizQuestions.map((q, idx) => (
                          <div key={idx} style={{ 
                            background: darkMode ? '#2d2d3d' : 'white', 
                            padding: '14px 16px', 
                            borderRadius: 10, 
                            marginBottom: 10, 
                            border: `1px solid ${darkMode ? '#444' : '#eee'}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                                <strong style={{ color: headingColor, fontSize: 14 }}>Q{idx+1}:</strong>
                                <span style={{ color: textColor, fontSize: 14, wordBreak: 'break-word' }}>{q.questionText}</span>
                              </div>
                              <div style={{ fontSize: 12, color: secondaryText, marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {q.options.map((opt, i) => (
                                  <span key={i} style={{ background: darkMode ? '#333' : '#f0f0f0', padding: '2px 8px', borderRadius: 4 }}>
                                    {String.fromCharCode(65 + i)}: {opt}
                                  </span>
                                ))}
                                <span style={{ color: '#2E7D64', fontWeight: 'bold' }}>✓ Answer: {String.fromCharCode(65 + q.correctAnswer)}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                              <button onClick={() => handleEditQuestion(idx)} style={{ background: '#ffc107', color: '#333', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                              <button onClick={() => handleDeleteQuestion(idx)} style={{ background: '#dc3545', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      onClick={handleSaveQuiz}
                      style={{ 
                        flex: 1,
                        background: '#6c757d', 
                        color: 'white', 
                        padding: '14px', 
                        border: 'none', 
                        borderRadius: 10, 
                        cursor: 'pointer', 
                        fontWeight: 'bold', 
                        fontSize: 16,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#5a6268'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#6c757d'}
                    >
                       Save as Draft
                    </button>
                    <button
                      onClick={handlePublishQuiz}
                      style={{ 
                        flex: 1,
                        background: '#28a745', 
                        color: 'white', 
                        padding: '14px', 
                        border: 'none', 
                        borderRadius: 10, 
                        cursor: 'pointer', 
                        fontWeight: 'bold', 
                        fontSize: 16,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#218838'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#28a745'}
                    >
                      {editingQuizId ? ' Update & Publish' : ' Publish Now'}
                    </button>
                  </div>
                </div>
              )}

              {loadingQuizzes ? (
                <p style={{ textAlign: 'center', color: secondaryText, padding: '30px 0' }}>Loading quizzes...</p>
              ) : weeklyQuizzes.length === 0 ? (
                <p style={{ textAlign: 'center', color: secondaryText, padding: '30px 0' }}>No weekly quizzes created yet.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
                  {weeklyQuizzes.map(quiz => {
                    const status = getQuizStatus(quiz);
                    return (
                      <div key={quiz._id} style={{ 
                        background: darkMode ? '#1a1a2e' : 'white', 
                        padding: '18px 20px', 
                        borderRadius: 14, 
                        border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                        transition: 'box-shadow 0.2s',
                        position: 'relative'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ color: headingColor, margin: 0, fontSize: 16 }}>{quiz.title}</h4>
                            <p style={{ fontSize: 12, color: secondaryText, marginTop: 4 }}>
                              Week {quiz.weekNumber} • {quiz.questions.length} questions
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                              <span style={{ 
                                background: status.color, 
                                color: 'white', 
                                padding: '2px 10px', 
                                borderRadius: 12, 
                                fontSize: 11,
                                fontWeight: 'bold'
                              }}>
                                {status.label}
                              </span>
                              {quiz.isPremium && (
                                <span style={{ 
                                  background: '#ff9800', 
                                  color: 'white', 
                                  padding: '2px 10px', 
                                  borderRadius: 12, 
                                  fontSize: 11,
                                  fontWeight: 'bold'
                                }}>
                                  ⭐ Premium
                                </span>
                              )}
                              {quiz.startDate && (
                                <span style={{ 
                                  background: '#17a2b8', 
                                  color: 'white', 
                                  padding: '2px 10px', 
                                  borderRadius: 12, 
                                  fontSize: 11
                                }}>
                                  Time Published {new Date(quiz.startDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 12, color: secondaryText, marginTop: 4 }}>
                              Pass: {quiz.passingScore}% • Time: {quiz.timeLimit}min
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button onClick={() => editQuiz(quiz)} style={{ background: '#ffc107', color: '#333', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Edit</button>
                            <button onClick={() => handleTogglePublish(quiz._id, quiz.isActive)} style={{ background: quiz.isActive ? '#dc3545' : '#28a745', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
                              {quiz.isActive ? ' Unpublish' : ' Publish'}
                            </button>
                            <button onClick={() => handleTogglePremium(quiz._id, quiz.isPremium)} style={{ background: quiz.isPremium ? '#dc3545' : '#ff9800', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
                              {quiz.isPremium ? '⭐ Remove Premium' : '⭐ Make Premium'}
                            </button>
                            <button onClick={() => handleViewResults(quiz._id)} style={{ background: '#17a2b8', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Quiz Results</button>
                            <button onClick={() => handleDeleteQuiz(quiz._id)} style={{ background: '#dc3545', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Delete</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {showResults && selectedQuizResults && (
                <div style={{
                  position: 'fixed',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2000,
                  padding: '20px'
                }}>
                  <div style={{
                    background: cardBg,
                    borderRadius: 20,
                    padding: 28,
                    maxWidth: 600,
                    width: '100%',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                      <h3 style={{ color: headingColor, margin: 0 }}>Quiz Results</h3>
                      <button onClick={() => setShowResults(false)} style={{ background: '#6c757d', color: 'white', padding: '6px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Close</button>
                    </div>
                    {selectedQuizResults.length === 0 ? (
                      <p style={{ color: secondaryText, textAlign: 'center', padding: '20px 0' }}>No attempts yet.</p>
                    ) : (
                      <div>
                        <p style={{ color: secondaryText, marginBottom: 14 }}>Total Attempts: <strong>{selectedQuizResults.length}</strong></p>
                        {selectedQuizResults.map((attempt, idx) => (
                          <div key={idx} style={{ 
                            background: darkMode ? '#1a1a2e' : '#f8f9fa', 
                            padding: '14px 16px', 
                            borderRadius: 10, 
                            marginBottom: 10,
                            borderLeft: `4px solid ${attempt.passed ? '#2e7d32' : '#dc3545'}`
                          }}>
                            <p style={{ margin: 0, color: textColor, fontWeight: 'bold' }}>{attempt.userId?.name || 'Unknown'}</p>
                            <p style={{ margin: 0, fontSize: 13, color: secondaryText }}>
                              {attempt.userId?.email || 'No email'} • 
                              Score: <strong>{attempt.score}/{attempt.total}</strong> ({attempt.percentage.toFixed(1)}%) 
                              {attempt.passed ? ' ✅' : ' ❌'}
                            </p>
                            <p style={{ margin: 0, fontSize: 11, color: secondaryText }}>{new Date(attempt.completedAt).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
        <p style={{ color: secondaryText, fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
          <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>Privacy Policy</Link>
          <span style={{ color: secondaryText, margin: '0 6px' }}>|</span>
          <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>Terms & Conditions</Link>
        </p>
      </div>
    </div>
  );
};