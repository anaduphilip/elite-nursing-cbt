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
  const [activeTab, setActiveTab] = useState('dashboard');
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

  // ---- Marketing Consent states ----
  const [consentMessage, setConsentMessage] = useState('');
  const [consentButtonText, setConsentButtonText] = useState('Yes, Opt me in!');
  const [consentActive, setConsentActive] = useState(false);
  const [consentVersion, setConsentVersion] = useState(0);
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentResult, setConsentResult] = useState('');

  // ---- Announcement states ----
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementButtonText, setAnnouncementButtonText] = useState('Learn More');
  const [announcementButtonLink, setAnnouncementButtonLink] = useState('/get-premium');
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [announcementVersion, setAnnouncementVersion] = useState(0);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementResult, setAnnouncementResult] = useState('');

  // ---- Weekly Quiz states ----
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

  // ========== NEW: User filter ==========
  const [userFilter, setUserFilter] = useState('all'); // 'all', 'premium', 'free'

  // ========== NEW: Adjust Premium modal ==========
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustUserId, setAdjustUserId] = useState(null);
  const [adjustPlanType, setAdjustPlanType] = useState('daily');
  const [adjustCustomDays, setAdjustCustomDays] = useState('');
  const [adjustCustomHours, setAdjustCustomHours] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustResult, setAdjustResult] = useState('');

  // ========== Dashboard data ==========
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // ========== Config states ==========
  const [config, setConfig] = useState({});
  const [configLoading, setConfigLoading] = useState(false);
  const [configResult, setConfigResult] = useState('');

  // ========== Category states ==========
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('📚');
  const [catDescription, setCatDescription] = useState('');
  const [catOrder, setCatOrder] = useState(0);
  const [catActive, setCatActive] = useState(true);
  const [editingCatId, setEditingCatId] = useState(null);
  const [catResult, setCatResult] = useState('');

  // ========== Coupon states ==========
  const [coupons, setCoupons] = useState([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscountType, setCouponDiscountType] = useState('percentage');
  const [couponDiscountValue, setCouponDiscountValue] = useState('');
  const [couponMinPurchase, setCouponMinPurchase] = useState('');
  const [couponMaxDiscount, setCouponMaxDiscount] = useState('');
  const [couponExpiryDate, setCouponExpiryDate] = useState('');
  const [couponUsageLimit, setCouponUsageLimit] = useState(1);
  const [couponActive, setCouponActive] = useState(true);
  const [couponDescription, setCouponDescription] = useState('');
  // 👇 NEW: planType for coupon
  const [couponPlanType, setCouponPlanType] = useState('all');
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [couponResult, setCouponResult] = useState('');

  // ========== FAQ states ==========
  const [faqs, setFaqs] = useState([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('General');
  const [faqOrder, setFaqOrder] = useState(0);
  const [faqActive, setFaqActive] = useState(true);
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [faqResult, setFaqResult] = useState('');

  // ============================================================
  // ========== DIRECT ACCESS PROTECTION =======================
  // ============================================================
  // Admin access is controlled by the isAdmin middleware in the backend.
  // This frontend check ensures only the admin email can access this panel.

  // Fetch all data on mount
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
        await Promise.all([
          fetchDashboard(),
          fetchConfig(),
          fetchCategories(),
          fetchCoupons(),
          fetchFaqs()
        ]);
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

  // ========== Dashboard ==========
  const fetchDashboard = async () => {
    setDashboardLoading(true);
    try {
      const res = await axios.get('/api/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } });
      setDashboardData(res.data.dashboard);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  // ========== Config ==========
  const fetchConfig = async () => {
    try {
      const res = await axios.get('/api/admin/config', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setConfig(res.data.config);
      }
    } catch (error) {
      console.error('Config fetch error:', error);
    }
  };

  const handleSaveConfig = async () => {
    setConfigLoading(true);
    setConfigResult('');
    try {
      const res = await axios.put('/api/admin/config', config, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setConfig(res.data.config);
        setConfigResult('✅ Configuration updated successfully!');
      }
    } catch (error) {
      setConfigResult('❌ Failed to update config: ' + (error.response?.data?.error || error.message));
    } finally {
      setConfigLoading(false);
    }
  };

  // ========== Categories ==========
  const fetchCategories = async () => {
    setCatLoading(true);
    try {
      const res = await axios.get('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } });
      setCategories(res.data.categories || []);
    } catch (error) {
      console.error('Category fetch error:', error);
    } finally {
      setCatLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) {
      setCatResult('❌ Category name is required');
      return;
    }
    setCatLoading(true);
    setCatResult('');
    try {
      const payload = {
        name: catName,
        icon: catIcon || '📚',
        description: catDescription,
        order: catOrder || 0,
        active: catActive
      };
      let res;
      if (editingCatId) {
        res = await axios.put(`/api/admin/categories/${editingCatId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        res = await axios.post('/api/admin/categories', payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      if (res.data.success) {
        setCatResult(editingCatId ? '✅ Category updated!' : '✅ Category created!');
        setCatName('');
        setCatIcon('📚');
        setCatDescription('');
        setCatOrder(0);
        setCatActive(true);
        setEditingCatId(null);
        await fetchCategories();
      }
    } catch (error) {
      setCatResult('❌ Failed to save category: ' + (error.response?.data?.error || error.message));
    } finally {
      setCatLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Deactivate this category? It will be hidden from users.')) return;
    try {
      await axios.delete(`/api/admin/categories/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      await fetchCategories();
      setCatResult('✅ Category deactivated');
    } catch (error) {
      setCatResult('❌ Failed to deactivate category');
    }
  };

  const editCategory = (cat) => {
    setCatName(cat.name);
    setCatIcon(cat.icon || '📚');
    setCatDescription(cat.description || '');
    setCatOrder(cat.order || 0);
    setCatActive(cat.active);
    setEditingCatId(cat._id);
  };

  // ========== Coupons ==========
  const fetchCoupons = async () => {
    setCouponLoading(true);
    try {
      const res = await axios.get('/api/admin/coupons', { headers: { Authorization: `Bearer ${token}` } });
      setCoupons(res.data.coupons || []);
    } catch (error) {
      console.error('Coupon fetch error:', error);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSaveCoupon = async () => {
    if (!couponCode.trim() || !couponDiscountValue || !couponExpiryDate) {
      setCouponResult('❌ Code, discount value, and expiry date are required');
      return;
    }
    setCouponLoading(true);
    setCouponResult('');
    try {
      const payload = {
        code: couponCode,
        discountType: couponDiscountType,
        discountValue: parseFloat(couponDiscountValue),
        planType: couponPlanType,
        minPurchase: parseFloat(couponMinPurchase) || 0,
        maxDiscount: couponMaxDiscount ? parseFloat(couponMaxDiscount) : null,
        expiryDate: new Date(couponExpiryDate),
        usageLimit: parseInt(couponUsageLimit) || 1,
        active: couponActive,
        description: couponDescription
      };
      let res;
      if (editingCouponId) {
        res = await axios.put(`/api/admin/coupons/${editingCouponId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        res = await axios.post('/api/admin/coupons', payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      if (res.data.success) {
        setCouponResult(editingCouponId ? '✅ Coupon updated!' : '✅ Coupon created!');
        resetCouponForm();
        await fetchCoupons();
      }
    } catch (error) {
      setCouponResult('❌ Failed to save coupon: ' + (error.response?.data?.error || error.message));
    } finally {
      setCouponLoading(false);
    }
  };

  const resetCouponForm = () => {
    setCouponCode('');
    setCouponDiscountType('percentage');
    setCouponDiscountValue('');
    setCouponMinPurchase('');
    setCouponMaxDiscount('');
    setCouponExpiryDate('');
    setCouponUsageLimit(1);
    setCouponActive(true);
    setCouponDescription('');
    setCouponPlanType('all');
    setEditingCouponId(null);
  };

  const editCoupon = (c) => {
    setCouponCode(c.code);
    setCouponDiscountType(c.discountType);
    setCouponDiscountValue(c.discountValue);
    setCouponMinPurchase(c.minPurchase || '');
    setCouponMaxDiscount(c.maxDiscount || '');
    setCouponExpiryDate(c.expiryDate ? new Date(c.expiryDate).toISOString().slice(0, 16) : '');
    setCouponUsageLimit(c.usageLimit);
    setCouponActive(c.active);
    setCouponDescription(c.description || '');
    setCouponPlanType(c.planType || 'all');
    setEditingCouponId(c._id);
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon permanently?')) return;
    try {
      await axios.delete(`/api/admin/coupons/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      await fetchCoupons();
      setCouponResult('✅ Coupon deleted');
    } catch (error) {
      setCouponResult('❌ Failed to delete coupon');
    }
  };

  // ========== FAQs ==========
  const fetchFaqs = async () => {
    setFaqLoading(true);
    try {
      const res = await axios.get('/api/admin/faqs', { headers: { Authorization: `Bearer ${token}` } });
      setFaqs(res.data.faqs || []);
    } catch (error) {
      console.error('FAQ fetch error:', error);
    } finally {
      setFaqLoading(false);
    }
  };

  const handleSaveFaq = async () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      setFaqResult('❌ Question and answer are required');
      return;
    }
    setFaqLoading(true);
    setFaqResult('');
    try {
      const payload = {
        question: faqQuestion,
        answer: faqAnswer,
        category: faqCategory || 'General',
        order: faqOrder || 0,
        active: faqActive
      };
      let res;
      if (editingFaqId) {
        res = await axios.put(`/api/admin/faqs/${editingFaqId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        res = await axios.post('/api/admin/faqs', payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      if (res.data.success) {
        setFaqResult(editingFaqId ? '✅ FAQ updated!' : '✅ FAQ created!');
        setFaqQuestion('');
        setFaqAnswer('');
        setFaqCategory('General');
        setFaqOrder(0);
        setFaqActive(true);
        setEditingFaqId(null);
        await fetchFaqs();
      }
    } catch (error) {
      setFaqResult('❌ Failed to save FAQ: ' + (error.response?.data?.error || error.message));
    } finally {
      setFaqLoading(false);
    }
  };

  const editFaq = (f) => {
    setFaqQuestion(f.question);
    setFaqAnswer(f.answer);
    setFaqCategory(f.category || 'General');
    setFaqOrder(f.order || 0);
    setFaqActive(f.active);
    setEditingFaqId(f._id);
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm('Delete this FAQ permanently?')) return;
    try {
      await axios.delete(`/api/admin/faqs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      await fetchFaqs();
      setFaqResult('✅ FAQ deleted');
    } catch (error) {
      setFaqResult('❌ Failed to delete FAQ');
    }
  };

  // ========== Existing functions ==========
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

  // Existing weekly quiz functions
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

  // ========== Announcement functions ==========
  const handleSaveAnnouncement = async () => {
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
  };

  const handleDeactivateAnnouncement = async () => {
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
  };

  const loadAnnouncement = async () => {
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
  };

  // ========== Marketing Consent functions ==========
  const handleSaveConsent = async () => {
    if (!consentMessage.trim()) {
      alert('Message is required');
      return;
    }
    setConsentLoading(true);
    setConsentResult('');
    try {
      const res = await axios.post('/api/admin/marketing-consent', {
        message: consentMessage,
        buttonText: consentButtonText,
        active: consentActive
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setConsentResult(`✅ Consent banner updated! Version: ${res.data.consent.version}`);
        setConsentVersion(res.data.consent.version);
      }
    } catch (error) {
      setConsentResult('❌ Failed to update banner: ' + (error.response?.data?.error || error.message));
    } finally {
      setConsentLoading(false);
    }
  };

  const handleDeactivateConsent = async () => {
    if (!window.confirm('Deactivate the consent banner? Users will not see it.')) return;
    setConsentLoading(true);
    try {
      const res = await axios.delete('/api/admin/marketing-consent', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setConsentResult('✅ Consent banner deactivated.');
        setConsentActive(false);
        setConsentVersion(prev => prev + 1);
      }
    } catch (error) {
      setConsentResult('❌ Failed to deactivate: ' + (error.response?.data?.error || error.message));
    } finally {
      setConsentLoading(false);
    }
  };

  const loadConsent = async () => {
    setConsentLoading(true);
    try {
      const res = await axios.get('/api/admin/marketing-consent', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.consent) {
        const c = res.data.consent;
        setConsentMessage(c.message || '');
        setConsentButtonText(c.buttonText || 'Yes, Opt me in!');
        setConsentActive(c.active || false);
        setConsentVersion(c.version || 0);
        setConsentResult('✅ Loaded current consent banner.');
      } else {
        setConsentResult('No consent banner found. Create one now.');
      }
    } catch (error) {
      setConsentResult('❌ Failed to load: ' + (error.response?.data?.error || error.message));
    } finally {
      setConsentLoading(false);
    }
  };

  // ========== Broadcast functions ==========
  const handleBroadcast = async () => {
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
  };

  // ========== NEW: Adjust Premium ==========
  const handleAdjustPremium = async (userId, planType, customDays, customHours) => {
    setAdjustLoading(true);
    setAdjustResult('');
    try {
      const payload = { userId };
      if (planType) {
        payload.planType = planType;
      } else {
        payload.customDays = customDays || 0;
        payload.customHours = customHours || 0;
      }
      const res = await axios.post('/api/admin/add-premium-time', payload, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setAdjustResult(`✅ ${res.data.message}`);
        // Refresh user list
        const usersRes = await axios.get('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
        setUsers(usersRes.data);
        // Close modal after short delay
        setTimeout(() => {
          setShowAdjustModal(false);
          setAdjustUserId(null);
          setAdjustResult('');
        }, 2000);
      } else {
        setAdjustResult('❌ ' + (res.data.error || 'Unknown error'));
      }
    } catch (error) {
      setAdjustResult('❌ Failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setAdjustLoading(false);
    }
  };

  // ========== Render ==========
  if (!dataLoaded) return <LoadingWithBar message="Loading admin panel" />;
  if (user?.email !== 'elitenursingcbt@gmail.com') return <Navigate to="/" />;

  // Filter users by search and premium status
  let filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (userFilter === 'premium') {
    filteredUsers = filteredUsers.filter(u => u.isPremium === true);
  } else if (userFilter === 'free') {
    filteredUsers = filteredUsers.filter(u => u.isPremium === false);
  }

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
            <button onClick={() => setActiveTab('dashboard')} style={{ background: activeTab === 'dashboard' ? '#1e3c72' : 'transparent', color: activeTab === 'dashboard' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'dashboard' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Dashboard</button>
            <button onClick={() => setActiveTab('users')} style={{ background: activeTab === 'users' ? '#1e3c72' : 'transparent', color: activeTab === 'users' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'users' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>All Users ({filteredUsers.length})</button>
            <button onClick={() => setActiveTab('contacts')} style={{ background: activeTab === 'contacts' ? '#1e3c72' : 'transparent', color: activeTab === 'contacts' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'contacts' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Contacts Mail Response ({contacts.length})</button>
            <button onClick={() => setActiveTab('notifications')} style={{ background: activeTab === 'notifications' ? '#ff9800' : 'transparent', color: activeTab === 'notifications' ? 'white' : '#ff9800', padding: '10px 24px', border: activeTab === 'notifications' ? 'none' : '1px solid #ff9800', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Push Notifications</button>
            <button onClick={() => setActiveTab('manualOtp')} style={{ background: activeTab === 'manualOtp' ? '#6c757d' : 'transparent', color: activeTab === 'manualOtp' ? 'white' : '#6c757d', padding: '10px 24px', border: activeTab === 'manualOtp' ? 'none' : '1px solid #6c757d', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}> Manual OTP Verification</button>
            <button onClick={() => setActiveTab('manualReset')} style={{ background: activeTab === 'manualReset' ? '#6c757d' : 'transparent', color: activeTab === 'manualReset' ? 'white' : '#6c757d', padding: '10px 24px', border: activeTab === 'manualReset' ? 'none' : '1px solid #6c757d', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Password Reset</button>
            <button onClick={() => setActiveTab('broadcast')} style={{ background: activeTab === 'broadcast' ? '#1e3c72' : 'transparent', color: activeTab === 'broadcast' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'broadcast' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}> Broadcast Message</button>
            <button onClick={() => setActiveTab('marketingConsent')} style={{ background: activeTab === 'marketingConsent' ? '#1e3c72' : 'transparent', color: activeTab === 'marketingConsent' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'marketingConsent' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Promotional Gmail Consent</button>
            <button onClick={() => setActiveTab('announcement')} style={{ background: activeTab === 'announcement' ? '#1e3c72' : 'transparent', color: activeTab === 'announcement' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'announcement' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>In-App Announcement</button>
            <button onClick={() => setActiveTab('system')} style={{ background: activeTab === 'system' ? '#1e3c72' : 'transparent', color: activeTab === 'system' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'system' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>General System Settings</button>
            <button onClick={() => setActiveTab('categories')} style={{ background: activeTab === 'categories' ? '#1e3c72' : 'transparent', color: activeTab === 'categories' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'categories' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}> Category Management</button>
            <button onClick={() => setActiveTab('coupons')} style={{ background: activeTab === 'coupons' ? '#1e3c72' : 'transparent', color: activeTab === 'coupons' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'coupons' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}> Coupon Code Generation</button>
            <button onClick={() => setActiveTab('faq')} style={{ background: activeTab === 'faq' ? '#1e3c72' : 'transparent', color: activeTab === 'faq' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'faq' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}> FAQ Tab</button>
            <button onClick={() => { setActiveTab('weeklyQuiz'); if (weeklyQuizzes.length === 0) fetchWeeklyQuizzes(); }} style={{ background: activeTab === 'weeklyQuiz' ? '#2E7D64' : 'transparent', color: activeTab === 'weeklyQuiz' ? 'white' : '#2E7D64', padding: '10px 24px', border: activeTab === 'weeklyQuiz' ? 'none' : '1px solid #2E7D64', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}> Weekly Quiz ({weeklyQuizzes.length})</button>
          </div>

          {/* ========== DASHBOARD TAB ========== */}
          {activeTab === 'dashboard' && (
            <div style={{ padding: 20 }}>
              <h2 style={{ color: headingColor, marginBottom: 20 }}>📊 Dashboard</h2>
              {dashboardLoading ? <LoadingWithBar message="Loading dashboard..." /> : dashboardData ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 30 }}>
                    <div style={{ background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 'bold', color: headingColor }}>{dashboardData.users.total}</div>
                      <div style={{ color: secondaryText }}>Total Users</div>
                    </div>
                    <div style={{ background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 'bold', color: '#2e7d32' }}>{dashboardData.users.premium}</div>
                      <div style={{ color: secondaryText }}>Premium Users</div>
                    </div>
                    <div style={{ background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff9800' }}>₦{dashboardData.revenue.total}</div>
                      <div style={{ color: secondaryText }}>Total Revenue</div>
                    </div>
                    <div style={{ background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 'bold', color: headingColor }}>{dashboardData.quizzes.completions}</div>
                      <div style={{ color: secondaryText }}>Quiz Completions</div>
                    </div>
                    <div style={{ background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 'bold', color: headingColor }}>{dashboardData.users.newToday}</div>
                      <div style={{ color: secondaryText }}>New Today</div>
                    </div>
                    <div style={{ background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 'bold', color: headingColor }}>{dashboardData.users.newThisMonth}</div>
                      <div style={{ color: secondaryText }}>New This Month</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div style={{ background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: 16, borderRadius: 12 }}>
                      <h4 style={{ color: headingColor, marginBottom: 12 }}>Popular Categories</h4>
                      {dashboardData.popularCategories.map(cat => (
                        <div key={cat._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid ' + (darkMode ? '#444' : '#eee') }}>
                          <span style={{ color: textColor }}>{cat._id || 'Uncategorized'}</span>
                          <span style={{ color: headingColor }}>{cat.count} quizzes</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: 16, borderRadius: 12 }}>
                      <h4 style={{ color: headingColor, marginBottom: 12 }}>Recent Users</h4>
                      {dashboardData.recentUsers.map(u => (
                        <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid ' + (darkMode ? '#444' : '#eee') }}>
                          <span style={{ color: textColor }}>{u.name || u.email}</span>
                          <span style={{ color: secondaryText, fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : <p>No data</p>}
            </div>
          )}

          {/* ========== SYSTEM SETTINGS TAB ========== */}
          {activeTab === 'system' && (
            <div style={{ padding: 24 }}>
              <h3 style={{ color: headingColor, marginBottom: 24 }}>⚙️ System Settings</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', 
                gap: '24px 32px',
                background: darkMode ? '#1a1a2e' : '#f8f9fa',
                padding: 24,
                borderRadius: 12,
              }}>
                {/* Premium Prices */}
                <div style={{ minWidth: 0 }}>
                  <label style={{ color: textColor, fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Daily Premium Price (₦)</label>
                  <input type="number" value={config.premiumDailyPrice || 500} onChange={(e) => setConfig({...config, premiumDailyPrice: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label style={{ color: textColor, fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Monthly Premium Price (₦)</label>
                  <input type="number" value={config.premiumMonthlyPrice || 2000} onChange={(e) => setConfig({...config, premiumMonthlyPrice: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label style={{ color: textColor, fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Yearly Premium Price (₦)</label>
                  <input type="number" value={config.premiumYearlyPrice || 10000} onChange={(e) => setConfig({...config, premiumYearlyPrice: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label style={{ color: textColor, fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Free Exam Limit</label>
                  <input type="number" value={config.freeExamLimit || 1} onChange={(e) => setConfig({...config, freeExamLimit: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label style={{ color: textColor, fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Default Passing Score (%)</label>
                  <input type="number" value={config.defaultPassingScore || 70} onChange={(e) => setConfig({...config, defaultPassingScore: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label style={{ color: textColor, fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Default Time Limit (minutes)</label>
                  <input type="number" value={config.defaultTimeLimit || 20} onChange={(e) => setConfig({...config, defaultTimeLimit: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
                </div>

                {/* Feature Toggles */}
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: 32, padding: '16px 20px', background: darkMode ? '#2d2d3d' : 'white', borderRadius: 8, marginTop: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: textColor, fontSize: 14, cursor: 'pointer' }}>
                    <input type="checkbox" checked={config.showWeeklyQuiz || false} onChange={(e) => setConfig({...config, showWeeklyQuiz: e.target.checked})} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    Show Weekly Quiz
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: textColor, fontSize: 14, cursor: 'pointer' }}>
                    <input type="checkbox" checked={config.showLeaderboard || false} onChange={(e) => setConfig({...config, showLeaderboard: e.target.checked})} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    Show Leaderboard
                  </label>
                </div>

                {/* Contact Info */}
                <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px 32px', paddingTop: 8 }}>
                  <div>
                    <label style={{ color: textColor, fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Contact Email</label>
                    <input type="email" value={config.contactEmail || ''} onChange={(e) => setConfig({...config, contactEmail: e.target.value})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ color: textColor, fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>Contact Phone</label>
                    <input type="text" value={config.contactPhone || ''} onChange={(e) => setConfig({...config, contactPhone: e.target.value})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
                  </div>
                </div>

                {/* App Name */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ color: textColor, fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 6 }}>App Name</label>
                  <input type="text" value={config.appName || ''} onChange={(e) => setConfig({...config, appName: e.target.value})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
                </div>

                {/* Maintenance Mode */}
                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: darkMode ? '#2d2d3d' : 'white', borderRadius: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: textColor, fontSize: 14, cursor: 'pointer' }}>
                    <input type="checkbox" checked={config.maintenanceMode || false} onChange={(e) => setConfig({...config, maintenanceMode: e.target.checked})} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    Maintenance Mode
                  </label>
                  {config.maintenanceMode && (
                    <div style={{ flex: 1 }}>
                      <input type="text" placeholder="Maintenance message" value={config.maintenanceMessage || ''} onChange={(e) => setConfig({...config, maintenanceMessage: e.target.value})} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, transition: 'border 0.2s', boxSizing: 'border-box' }} />
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: 12, marginTop: 8 }}>
                  <button onClick={handleSaveConfig} disabled={configLoading} style={{ background: '#1e3c72', color: 'white', padding: '12px 32px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 16, opacity: configLoading ? 0.7 : 1, transition: 'opacity 0.2s' }}>{configLoading ? 'Saving...' : 'Save Settings'}</button>
                  {configResult && <p style={{ marginLeft: 16, alignSelf: 'center', color: configResult.includes('✅') ? '#2e7d32' : '#dc3545' }}>{configResult}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ========== CATEGORIES TAB ========== */}
          {activeTab === 'categories' && (
            <div style={{ padding: 20 }}>
              <h3 style={{ color: headingColor, marginBottom: 20 }}>📂 Categories</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <input placeholder="Category name" value={catName} onChange={(e) => setCatName(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
                <input placeholder="Icon (emoji)" value={catIcon} onChange={(e) => setCatIcon(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor, width: 80 }} />
                <input placeholder="Description" value={catDescription} onChange={(e) => setCatDescription(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
                <input type="number" placeholder="Order" value={catOrder} onChange={(e) => setCatOrder(parseInt(e.target.value))} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor, width: 80 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={catActive} onChange={(e) => setCatActive(e.target.checked)} /> Active
                </label>
                <button onClick={handleSaveCategory} disabled={catLoading} style={{ background: '#1e3c72', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>{editingCatId ? 'Update' : 'Add'}</button>
                {editingCatId && <button onClick={() => { setEditingCatId(null); setCatName(''); setCatIcon('📚'); setCatDescription(''); setCatOrder(0); setCatActive(true); }} style={{ background: '#6c757d', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>}
              </div>
              {catResult && <p style={{ marginBottom: 16, color: catResult.includes('✅') ? '#2e7d32' : '#dc3545' }}>{catResult}</p>}
              {catLoading ? <p>Loading...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {categories.map(c => (
                    <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: '12px 16px', borderRadius: 8, border: '1px solid ' + (darkMode ? '#444' : '#eee') }}>
                      <div><span style={{ fontSize: 24 }}>{c.icon}</span> <strong>{c.name}</strong> {c.active ? '✅' : '❌'} <span style={{ color: secondaryText, fontSize: 12 }}>({c.slug})</span></div>
                      <div>
                        <button onClick={() => editCategory(c)} style={{ background: '#ffc107', color: '#333', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 8 }}>Edit</button>
                        <button onClick={() => handleDeleteCategory(c._id)} style={{ background: '#dc3545', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Deactivate</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== COUPONS TAB ========== */}
          {activeTab === 'coupons' && (
            <div style={{ padding: 20 }}>
              <h3 style={{ color: headingColor, marginBottom: 20 }}>🏷️ Coupons</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <input placeholder="Code (e.g. ELITE20)" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
                <select value={couponDiscountType} onChange={(e) => setCouponDiscountType(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
                <input type="number" placeholder="Discount Value" value={couponDiscountValue} onChange={(e) => setCouponDiscountValue(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
                {/* 👇 NEW: Plan Type dropdown */}
                <select value={couponPlanType} onChange={(e) => setCouponPlanType(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }}>
                  <option value="all">All Plans</option>
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <input type="number" placeholder="Min Purchase (₦)" value={couponMinPurchase} onChange={(e) => setCouponMinPurchase(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
                <input type="number" placeholder="Max Discount (₦)" value={couponMaxDiscount} onChange={(e) => setCouponMaxDiscount(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
                <input type="datetime-local" value={couponExpiryDate} onChange={(e) => setCouponExpiryDate(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
                <input type="number" placeholder="Usage Limit" value={couponUsageLimit} onChange={(e) => setCouponUsageLimit(parseInt(e.target.value))} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
                <input placeholder="Description" value={couponDescription} onChange={(e) => setCouponDescription(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={couponActive} onChange={(e) => setCouponActive(e.target.checked)} /> Active
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button onClick={handleSaveCoupon} disabled={couponLoading} style={{ background: '#1e3c72', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>{editingCouponId ? 'Update' : 'Add'}</button>
                {editingCouponId && <button onClick={resetCouponForm} style={{ background: '#6c757d', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>}
              </div>
              {couponResult && <p style={{ marginBottom: 16, color: couponResult.includes('✅') ? '#2e7d32' : '#dc3545' }}>{couponResult}</p>}
              {couponLoading ? <p>Loading...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {coupons.map(c => (
                    <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: '12px 16px', borderRadius: 8, border: '1px solid ' + (darkMode ? '#444' : '#eee') }}>
                      <div><strong>{c.code}</strong> - {c.discountType === 'percentage' ? `${c.discountValue}%` : `₦${c.discountValue}`} {c.active ? '✅' : '❌'} <span style={{ color: secondaryText, fontSize: 12 }}>Used: {c.usedCount}/{c.usageLimit}</span> <span style={{ background: '#e8f5e9', padding: '2px 10px', borderRadius: 12, fontSize: 11, color: '#1e3c72', marginLeft: 6 }}>{c.planType === 'all' ? 'All' : c.planType}</span></div>
                      <div>
                        <button onClick={() => editCoupon(c)} style={{ background: '#ffc107', color: '#333', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 8 }}>Edit</button>
                        <button onClick={() => handleDeleteCoupon(c._id)} style={{ background: '#dc3545', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== FAQ TAB ========== */}
          {activeTab === 'faq' && (
            <div style={{ padding: 20 }}>
              <h3 style={{ color: headingColor, marginBottom: 20 }}>📄 FAQ</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <input placeholder="Question" value={faqQuestion} onChange={(e) => setFaqQuestion(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
                <textarea placeholder="Answer" value={faqAnswer} onChange={(e) => setFaqAnswer(e.target.value)} rows="3" style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
                <input placeholder="Category (e.g. Payments)" value={faqCategory} onChange={(e) => setFaqCategory(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
                <input type="number" placeholder="Order" value={faqOrder} onChange={(e) => setFaqOrder(parseInt(e.target.value))} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor, width: 80 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={faqActive} onChange={(e) => setFaqActive(e.target.checked)} /> Active
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button onClick={handleSaveFaq} disabled={faqLoading} style={{ background: '#1e3c72', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>{editingFaqId ? 'Update' : 'Add'}</button>
                {editingFaqId && <button onClick={() => { setEditingFaqId(null); setFaqQuestion(''); setFaqAnswer(''); setFaqCategory('General'); setFaqOrder(0); setFaqActive(true); }} style={{ background: '#6c757d', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>}
              </div>
              {faqResult && <p style={{ marginBottom: 16, color: faqResult.includes('✅') ? '#2e7d32' : '#dc3545' }}>{faqResult}</p>}
              {faqLoading ? <p>Loading...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {faqs.map(f => (
                    <div key={f._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: '12px 16px', borderRadius: 8, border: '1px solid ' + (darkMode ? '#444' : '#eee') }}>
                      <div><strong>{f.question}</strong> - <span style={{ color: secondaryText }}>{f.category}</span> {f.active ? '✅' : '❌'}</div>
                      <div>
                        <button onClick={() => editFaq(f)} style={{ background: '#ffc107', color: '#333', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 8 }}>Edit</button>
                        <button onClick={() => handleDeleteFaq(f._id)} style={{ background: '#dc3545', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== USERS TAB ========== */}
          {activeTab === 'users' && (
            <>
              <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <input type="text" placeholder="🔍 Search by email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', maxWidth: 400, padding: '10px 16px', borderRadius: 30, border: `1px solid ${darkMode ? '#444' : '#ddd'}`, background: darkMode ? '#2d2d3d' : 'white', color: textColor, fontSize: 14, outline: 'none' }} />
                <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} style={{ padding: '10px 16px', borderRadius: 30, border: `1px solid ${darkMode ? '#444' : '#ddd'}`, background: darkMode ? '#2d2d3d' : 'white', color: textColor, fontSize: 14, outline: 'none' }}>
                  <option value="all">All Users</option>
                  <option value="premium">Premium Users</option>
                  <option value="free">Free Users</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }}>
                {filteredUsers.map(u => {
                  const currentPlan = u.isPremium ? (u.premiumPlan || 'monthly') : 'none';
                  return (
                    <div key={u._id} style={{ width: '350px', background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: 20, borderRadius: 12, border: '1px solid ' + (darkMode ? '#444' : '#e0e0e0'), color: textColor }}>
                      <p><strong>Name:</strong> {u.name || 'N/A'}</p>
                      <p><strong>Email:</strong> {u.email}</p>
                      <p><strong>Premium:</strong> {u.isPremium ? '✅ Yes' : '❌ No'}</p>
                      {u.isPremium && <p><strong>Plan:</strong> {u.premiumPlan ? u.premiumPlan.toUpperCase() : 'N/A'}</p>}
                      {u.isPremium && u.premiumExpiry && <p><strong>Expires:</strong> {new Date(u.premiumExpiry).toLocaleDateString()}</p>}
                      <p><strong>Verified:</strong> {u.isVerified ? '✅ Yes' : '❌ No'}</p>
                      <p><strong>Joined:</strong> {new Date(u.createdAt).toLocaleDateString()}</p>
                      <div style={{ marginTop: 15 }}>
                        <label style={{ fontSize: 13, fontWeight: 'bold', display: 'block', marginBottom: 4, color: textColor }}>Set Premium Plan:</label>
                        <select value={selectedPlan[u._id] || currentPlan} onChange={(e) => setSelectedPlan(prev => ({ ...prev, [u._id]: e.target.value }))} style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #ccc', background: cardBg, fontSize: 14, color: textColor }}>
                          <option value="none">None (Remove Premium)</option>
                          <option value="daily">Daily (₦500)</option>
                          <option value="monthly">Monthly (₦2000)</option>
                          <option value="yearly">Yearly (₦10000)</option>
                        </select>
                        <button onClick={() => applyPlan(u._id)} style={{ width: '100%', marginTop: 6, background: '#1e3c72', color: 'white', border: 'none', padding: '8px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>Apply Plan</button>
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                        <button onClick={() => deleteUser(u._id)} style={{ background: '#dc3545', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}>Delete User</button>
                        <button onClick={() => { setAdjustUserId(u._id); setShowAdjustModal(true); setAdjustResult(''); }} style={{ background: '#ff9800', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 'bold' }}>Adjust Premium</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredUsers.length === 0 && <p style={{ textAlign: 'center', color: secondaryText, marginTop: 20 }}>No users found matching your filters.</p>}
            </>
          )}

          {/* ========== CONTACTS TAB ========== */}
          {activeTab === 'contacts' && (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {contacts.map(c => (
                <div key={c._id} style={{ background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: 20, borderRadius: 12, marginBottom: 16, border: '1px solid ' + (darkMode ? '#444' : '#e0e0e0') }}>
                  <p><strong>From:</strong> {c.name} ({c.email})</p>
                  <p><strong>Message:</strong> {c.message}</p>
                  <p><strong>Received:</strong> {new Date(c.createdAt).toLocaleString()}</p>
                  {replyingTo === c._id ? (
                    <div style={{ marginTop: 16 }}>
                      <textarea placeholder="Type your reply here..." value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} rows="4" style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: 10, fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => sendReply(c.email, c.name, c.message)} disabled={sendingReply} style={{ background: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}>{sendingReply ? 'Sending...' : 'Send Reply'}</button>
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

          {/* ========== NOTIFICATIONS TAB ========== */}
          {activeTab === 'notifications' && (
            <div style={{ padding: 20 }}>
              <h3 style={{ color: headingColor, marginBottom: 20 }}>Send Push Notification to All Users</h3>
              <div style={{ marginBottom: 16 }}><input type="text" placeholder="Notification Title" value={notificationTitle} onChange={(e) => setNotificationTitle(e.target.value)} style={{ width: '100%', padding: '14px 18px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} /></div>
              <div style={{ marginBottom: 16 }}><textarea placeholder="Notification Message" value={notificationMessage} onChange={(e) => setNotificationMessage(e.target.value)} rows="4" style={{ width: '100%', padding: '14px 18px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} /></div>
              <button onClick={sendNotification} disabled={sendingNotification} style={{ background: '#ff9800', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>{sendingNotification ? 'Sending...' : 'Send Notification'}</button>
              {notificationStatus && <p style={{ marginTop: 16, color: '#2e7d32' }}>{notificationStatus}</p>}
            </div>
          )}

          {/* ========== MANUAL OTP TAB ========== */}
          {activeTab === 'manualOtp' && (
            <div style={{ padding: 20 }}>
              <h3 style={{ color: headingColor, marginBottom: 20 }}>Generate Manual Verification Code</h3>
              <p style={{ marginBottom: 16, color: secondaryText }}>Use this only when a user cannot receive email. The code will be shown here and can be given to the user.</p>
              <div style={{ marginBottom: 16 }}><input type="email" placeholder="User's email address" value={manualOtpEmail} onChange={(e) => setManualOtpEmail(e.target.value)} style={{ width: '100%', padding: '14px 18px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} /></div>
              <button onClick={generateManualOtp} disabled={generatingOtp} style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>{generatingOtp ? 'Generating...' : 'Generate Code'}</button>
              {manualOtpResult && <div style={{ marginTop: 16, padding: 12, background: darkMode ? '#2d2d3d' : '#e8f5e9', borderRadius: 8, borderLeft: '4px solid #2e7d32' }}><p style={{ margin: 0, color: '#2e7d32' }}>{manualOtpResult}</p></div>}
            </div>
          )}

          {/* ========== MANUAL RESET TAB ========== */}
          {activeTab === 'manualReset' && (
            <div style={{ padding: 20 }}>
              <h3 style={{ color: headingColor, marginBottom: 20 }}>Generate Password Reset Code</h3>
              <p style={{ marginBottom: 16, color: secondaryText }}>Use this when a user cannot receive password reset email. The code will be shown here and can be given to the user.</p>
              <div style={{ marginBottom: 16 }}><input type="email" placeholder="User's email address" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} style={{ width: '100%', padding: '14px 18px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} /></div>
              <button onClick={generateManualResetOtp} disabled={generatingResetOtp} style={{ background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>{generatingResetOtp ? 'Generating...' : 'Generate Reset Code'}</button>
              {resetOtpResult && <div style={{ marginTop: 16, padding: 12, background: darkMode ? '#2d2d3d' : '#e8f5e9', borderRadius: 8, borderLeft: '4px solid #2e7d32' }}><p style={{ margin: 0, color: '#2e7d32' }}>{resetOtpResult}</p></div>}
            </div>
          )}

          {/* ========== BROADCAST TAB ========== */}
          {activeTab === 'broadcast' && (
            <div style={{ padding: 20 }}>
              <h3 style={{ color: headingColor, marginBottom: 20 }}>Send Email Broadcast to Free Users</h3>
              <p style={{ color: secondaryText, marginBottom: 16 }}>Send a promotional email to all free users who have opted in to marketing emails.</p>
              <div style={{ marginBottom: 16 }}><input type="text" placeholder="Email Subject" value={broadcastSubject} onChange={(e) => setBroadcastSubject(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', boxSizing: 'border-box' }} /></div>
              <div style={{ marginBottom: 16 }}><textarea placeholder="Custom Message (optional – if empty, uses template)" value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} rows="4" style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', resize: 'vertical', boxSizing: 'border-box' }} /></div>
              <div style={{ marginBottom: 16 }}>
                <select value={broadcastTemplate} onChange={(e) => setBroadcastTemplate(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : 'white', color: darkMode ? 'white' : '#333' }}>
                  <option value="upgrade">Upgrade Reminder</option>
                  <option value="reminder">Re-engagement</option>
                  <option value="winback">Win-back</option>
                </select>
              </div>
              <button onClick={handleBroadcast} disabled={broadcastLoading} style={{ background: '#1e3c72', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', opacity: broadcastLoading ? 0.7 : 1 }}>{broadcastLoading ? 'Sending...' : 'Send Broadcast'}</button>
              {broadcastResult && <p style={{ marginTop: 16, color: '#2e7d32' }}>{broadcastResult}</p>}
            </div>
          )}

          {/* ========== MARKETING CONSENT TAB ========== */}
          {activeTab === 'marketingConsent' && (
            <div style={{ padding: 20 }}>
              <h3 style={{ color: headingColor, marginBottom: 20 }}>Marketing Consent Banner</h3>
              <p style={{ color: secondaryText, marginBottom: 16 }}>Show a one‑time consent banner on the Home page to ask users to opt in for promotional emails. Users who have already opted in will not see it.</p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Message</label>
                <textarea placeholder="e.g., Stay updated! Get special offers and new exam notifications via email." value={consentMessage} onChange={(e) => setConsentMessage(e.target.value)} rows="3" style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Button Text</label>
                <input type="text" placeholder="e.g., Yes, Opt me in!" value={consentButtonText} onChange={(e) => setConsentButtonText(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: textColor, fontSize: 14 }}>
                  <input type="checkbox" checked={consentActive} onChange={(e) => setConsentActive(e.target.checked)} /> Active (banner will be shown to users who haven't opted in)
                </label>
                <span style={{ color: secondaryText, fontSize: 13 }}>Version: {consentVersion}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={handleSaveConsent} disabled={consentLoading} style={{ background: '#1e3c72', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', opacity: consentLoading ? 0.7 : 1 }}>{consentLoading ? 'Saving...' : 'Publish Consent Banner'}</button>
                <button onClick={handleDeactivateConsent} style={{ background: '#dc3545', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Deactivate Banner</button>
                <button onClick={loadConsent} style={{ background: '#6c757d', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Load Current</button>
              </div>
              {consentResult && <p style={{ marginTop: 16, color: '#2e7d32' }}>{consentResult}</p>}
            </div>
          )}

          {/* ========== ANNOUNCEMENT TAB ========== */}
          {activeTab === 'announcement' && (
            <div style={{ padding: 20 }}>
              <h3 style={{ color: headingColor, marginBottom: 20 }}>One-Time Home Page Banner</h3>
              <p style={{ color: secondaryText, marginBottom: 16 }}>Create a banner that each user sees once on the home page. Update it anytime – it will reappear for all users with the new version.</p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Message</label>
                <textarea placeholder="Enter the banner message" value={announcementMessage} onChange={(e) => setAnnouncementMessage(e.target.value)} rows="3" style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Button Text</label>
                <input type="text" placeholder="e.g., Get Premium Now" value={announcementButtonText} onChange={(e) => setAnnouncementButtonText(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Button Link</label>
                <input type="text" placeholder="/get-premium, /weekly-quiz, /contact, etc." value={announcementButtonLink} onChange={(e) => setAnnouncementButtonLink(e.target.value)} style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: textColor, fontSize: 14 }}>
                  <input type="checkbox" checked={announcementActive} onChange={(e) => setAnnouncementActive(e.target.checked)} /> Active (banner will be shown)
                </label>
                <span style={{ color: secondaryText, fontSize: 13 }}>Version: {announcementVersion}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={handleSaveAnnouncement} disabled={announcementLoading} style={{ background: '#1e3c72', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', opacity: announcementLoading ? 0.7 : 1 }}>{announcementLoading ? 'Saving...' : 'Publish Banner'}</button>
                <button onClick={handleDeactivateAnnouncement} style={{ background: '#dc3545', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Deactivate Banner</button>
                <button onClick={loadAnnouncement} style={{ background: '#6c757d', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Load Current</button>
              </div>
              {announcementResult && <p style={{ marginTop: 16, color: '#2e7d32' }}>{announcementResult}</p>}
            </div>
          )}

          {/* ========== WEEKLY QUIZ TAB ========== */}
          {activeTab === 'weeklyQuiz' && (
            <div style={{ padding: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <h3 style={{ color: headingColor, margin: 0 }}>Manage Weekly Quizzes</h3>
                <button onClick={() => setShowQuizForm(!showQuizForm)} style={{ background: showQuizForm ? '#dc3545' : '#2E7D64', color: 'white', padding: '10px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>{showQuizForm ? '✕ Cancel' : '+ Create New Quiz'}</button>
              </div>

              {showQuizForm && (
                <div style={{ background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: '24px 28px', borderRadius: 16, marginBottom: 28, border: `1px solid ${darkMode ? '#444' : '#ddd'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <h4 style={{ color: headingColor, marginBottom: 20, fontSize: 18 }}>{editingQuizId ? ' Edit Quiz' : ' New Weekly Quiz'}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px', marginBottom: 18 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Quiz Title <span style={{ color: '#dc3545' }}>*</span></label>
                      <input type="text" placeholder="e.g., Week 1 - Fundamentals" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Week Number <span style={{ color: '#dc3545' }}>*</span></label>
                      <input type="number" placeholder="1, 2, 3..." value={quizWeekNumber} onChange={(e) => setQuizWeekNumber(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }} min="1" />
                    </div>
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Description <span style={{ color: '#999', fontWeight: 'normal' }}>(optional)</span></label>
                    <input type="text" placeholder="Brief description of the quiz" value={quizDescription} onChange={(e) => setQuizDescription(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Instructions <span style={{ color: '#999', fontWeight: 'normal' }}>(shown before quiz starts)</span></label>
                    <textarea placeholder="e.g., Answer all questions carefully. You cannot go back after submitting." value={quizInstructions} onChange={(e) => setQuizInstructions(e.target.value)} rows="3" style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box', resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px', marginBottom: 18 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Start Date <span style={{ color: '#999', fontWeight: 'normal' }}>(optional)</span></label>
                      <input type="datetime-local" value={quizStartDate} onChange={(e) => setQuizStartDate(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>End Date <span style={{ color: '#999', fontWeight: 'normal' }}>(optional)</span></label>
                      <input type="datetime-local" value={quizEndDate} onChange={(e) => setQuizEndDate(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '12px 16px', background: darkMode ? '#2d2d3d' : '#f0f7f4', borderRadius: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 'bold', color: textColor, cursor: 'pointer' }}>
                      <input type="checkbox" checked={quizIsPremium} onChange={(e) => setQuizIsPremium(e.target.checked)} style={{ marginRight: 8, width: 18, height: 18, cursor: 'pointer' }} />
                      Premium Quiz <span style={{ fontWeight: 'normal', color: secondaryText }}>(users need premium to access)</span>
                    </label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px', marginBottom: 20 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Passing Score (%)</label>
                      <input type="number" placeholder="70" value={quizPassingScore} onChange={(e) => setQuizPassingScore(parseInt(e.target.value) || 70)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }} min="0" max="100" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Time Limit (minutes)</label>
                      <input type="number" placeholder="20" value={quizTimeLimit} onChange={(e) => setQuizTimeLimit(parseInt(e.target.value) || 20)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }} min="1" />
                    </div>
                  </div>
                  <div style={{ marginBottom: 20, borderTop: `2px solid ${darkMode ? '#444' : '#e0e0e0'}`, paddingTop: 20 }}>
                    <h5 style={{ color: headingColor, marginBottom: 14, fontSize: 16 }}>Questions ({quizQuestions.length})</h5>
                    
                    <div style={{ background: darkMode ? '#2d2d3d' : '#f0f7f4', padding: '16px 18px', borderRadius: 12, marginBottom: 18, border: `1px dashed ${darkMode ? '#666' : '#aaa'}` }}>
                      <p style={{ fontSize: 13, color: secondaryText, marginBottom: 8 }}><strong>Batch Import:</strong> Paste multiple questions at once.</p>
                      <textarea placeholder="Paste your questions here...&#10;Q1. Question text? (a) Option (b) Option (c) Option (d) Option&#10;Answer: a" value={batchInput} onChange={(e) => setBatchInput(e.target.value)} rows="4" style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'monospace' }} />
                      <button onClick={handleBatchImport} style={{ marginTop: 10, background: '#17a2b8', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}> Import Questions</button>
                    </div>

                    <div style={{ background: darkMode ? '#2d2d3d' : 'white', padding: '18px 20px', borderRadius: 12, marginBottom: 16, border: `1px solid ${darkMode ? '#555' : '#eee'}` }}>
                      <div style={{ marginBottom: 14 }}><input type="text" placeholder="Enter question text" value={qText} onChange={(e) => setQText(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }} /></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: 14 }}>
                        {qOptions.map((opt, idx) => (
                          <input key={idx} type="text" placeholder={`Option ${String.fromCharCode(65 + idx)}`} value={opt} onChange={(e) => { const newOpts = [...qOptions]; newOpts[idx] = e.target.value; setQOptions(newOpts); }} style={{ padding: '10px 12px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, background: cardBg, color: textColor, boxSizing: 'border-box' }} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <label style={{ fontSize: 13, fontWeight: 'bold', color: textColor }}>Correct Answer:</label>
                        <select value={qCorrect} onChange={(e) => setQCorrect(parseInt(e.target.value))} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #ccc', background: cardBg, color: textColor, fontSize: 13 }}>
                          {qOptions.map((_, idx) => <option key={idx} value={idx}>Option {String.fromCharCode(65 + idx)}</option>)}
                        </select>
                        <button onClick={handleAddQuestion} style={{ background: '#2E7D64', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>{editingQuestionIndex !== null ? 'Update' : '➕ Add'}</button>
                        {editingQuestionIndex !== null && <button onClick={() => { setEditingQuestionIndex(null); setQText(''); setQOptions(['', '', '', '']); setQCorrect(0); }} style={{ background: '#6c757d', color: 'white', padding: '6px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Cancel</button>}
                      </div>
                    </div>

                    {quizQuestions.length > 0 && (
                      <div style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                        {quizQuestions.map((q, idx) => (
                          <div key={idx} style={{ background: darkMode ? '#2d2d3d' : 'white', padding: '14px 16px', borderRadius: 10, marginBottom: 10, border: `1px solid ${darkMode ? '#444' : '#eee'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}><strong style={{ color: headingColor, fontSize: 14 }}>Q{idx+1}:</strong> <span style={{ color: textColor, fontSize: 14, wordBreak: 'break-word' }}>{q.questionText}</span></div>
                              <div style={{ fontSize: 12, color: secondaryText, marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {q.options.map((opt, i) => <span key={i} style={{ background: darkMode ? '#333' : '#f0f0f0', padding: '2px 8px', borderRadius: 4 }}>{String.fromCharCode(65 + i)}: {opt}</span>)}
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
                    <button onClick={handleSaveQuiz} style={{ flex: 1, background: '#6c757d', color: 'white', padding: '14px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 16, transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#5a6268'} onMouseLeave={(e) => e.currentTarget.style.background = '#6c757d'}> Save as Draft</button>
                    <button onClick={handlePublishQuiz} style={{ flex: 1, background: '#28a745', color: 'white', padding: '14px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 16, transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#218838'} onMouseLeave={(e) => e.currentTarget.style.background = '#28a745'}>{editingQuizId ? ' Update & Publish' : ' Publish Now'}</button>
                  </div>
                </div>
              )}

              {loadingQuizzes ? <p style={{ textAlign: 'center', color: secondaryText, padding: '30px 0' }}>Loading quizzes...</p> : weeklyQuizzes.length === 0 ? <p style={{ textAlign: 'center', color: secondaryText, padding: '30px 0' }}>No weekly quizzes created yet.</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
                  {weeklyQuizzes.map(quiz => {
                    const status = getQuizStatus(quiz);
                    return (
                      <div key={quiz._id} style={{ background: darkMode ? '#1a1a2e' : 'white', padding: '18px 20px', borderRadius: 14, border: `1px solid ${darkMode ? '#444' : '#ddd'}`, transition: 'box-shadow 0.2s', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ color: headingColor, margin: 0, fontSize: 16 }}>{quiz.title}</h4>
                            <p style={{ fontSize: 12, color: secondaryText, marginTop: 4 }}>Week {quiz.weekNumber} • {quiz.questions.length} questions</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                              <span style={{ background: status.color, color: 'white', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 'bold' }}>{status.label}</span>
                              {quiz.isPremium && <span style={{ background: '#ff9800', color: 'white', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 'bold' }}>⭐ Premium</span>}
                              {quiz.startDate && <span style={{ background: '#17a2b8', color: 'white', padding: '2px 10px', borderRadius: 12, fontSize: 11 }}>Time Published {new Date(quiz.startDate).toLocaleDateString()}</span>}
                            </div>
                            <p style={{ fontSize: 12, color: secondaryText, marginTop: 4 }}>Pass: {quiz.passingScore}% • Time: {quiz.timeLimit}min</p>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button onClick={() => editQuiz(quiz)} style={{ background: '#ffc107', color: '#333', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Edit</button>
                            <button onClick={() => handleTogglePublish(quiz._id, quiz.isActive)} style={{ background: quiz.isActive ? '#dc3545' : '#28a745', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>{quiz.isActive ? ' Unpublish' : ' Publish'}</button>
                            <button onClick={() => handleTogglePremium(quiz._id, quiz.isPremium)} style={{ background: quiz.isPremium ? '#dc3545' : '#ff9800', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>{quiz.isPremium ? '⭐ Remove Premium' : '⭐ Make Premium'}</button>
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
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
                  <div style={{ background: cardBg, borderRadius: 20, padding: 28, maxWidth: 600, width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                      <h3 style={{ color: headingColor, margin: 0 }}>Quiz Results</h3>
                      <button onClick={() => setShowResults(false)} style={{ background: '#6c757d', color: 'white', padding: '6px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Close</button>
                    </div>
                    {selectedQuizResults.length === 0 ? <p style={{ color: secondaryText, textAlign: 'center', padding: '20px 0' }}>No attempts yet.</p> : (
                      <div>
                        <p style={{ color: secondaryText, marginBottom: 14 }}>Total Attempts: <strong>{selectedQuizResults.length}</strong></p>
                        {selectedQuizResults.map((attempt, idx) => (
                          <div key={idx} style={{ background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: '14px 16px', borderRadius: 10, marginBottom: 10, borderLeft: `4px solid ${attempt.passed ? '#2e7d32' : '#dc3545'}` }}>
                            <p style={{ margin: 0, color: textColor, fontWeight: 'bold' }}>{attempt.userId?.name || 'Unknown'}</p>
                            <p style={{ margin: 0, fontSize: 13, color: secondaryText }}>{attempt.userId?.email || 'No email'} • Score: <strong>{attempt.score}/{attempt.total}</strong> ({attempt.percentage.toFixed(1)}%) {attempt.passed ? ' ✅' : ' ❌'}</p>
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

      {/* ========== NEW: ADJUST PREMIUM MODAL ========== */}
      {showAdjustModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: 20
        }}>
          <div style={{
            background: cardBg,
            borderRadius: 20,
            padding: 28,
            maxWidth: 500,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ color: headingColor, marginBottom: 20 }}>Adjust Premium Time</h3>
            <p style={{ color: secondaryText, marginBottom: 16 }}>Add extra time to this user's premium subscription.</p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Add by Plan Type</label>
              <select
                value={adjustPlanType}
                onChange={(e) => setAdjustPlanType(e.target.value)}
                style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333' }}
              >
                <option value="daily">Daily (1 day)</option>
                <option value="monthly">Monthly (30 days)</option>
                <option value="yearly">Yearly (365 days)</option>
              </select>
              <button
                onClick={() => handleAdjustPremium(adjustUserId, adjustPlanType, null, null)}
                disabled={adjustLoading}
                style={{ marginTop: 10, background: '#1e3c72', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
              >
                {adjustLoading ? 'Adding...' : `Add ${adjustPlanType} plan`}
              </button>
            </div>

            <div style={{ marginBottom: 16, borderTop: `1px solid ${darkMode ? '#444' : '#ddd'}`, paddingTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Or add custom time</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    placeholder="Days"
                    value={adjustCustomDays}
                    onChange={(e) => setAdjustCustomDays(e.target.value)}
                    style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    placeholder="Hours"
                    value={adjustCustomHours}
                    onChange={(e) => setAdjustCustomHours(e.target.value)}
                    style={{ width: '100%', padding: 12, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: darkMode ? 'white' : '#333' }}
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  const days = parseInt(adjustCustomDays) || 0;
                  const hours = parseInt(adjustCustomHours) || 0;
                  if (!days && !hours) {
                    alert('Please enter at least one value');
                    return;
                  }
                  handleAdjustPremium(adjustUserId, null, days, hours);
                }}
                disabled={adjustLoading}
                style={{ marginTop: 10, background: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
              >
                {adjustLoading ? 'Adding...' : 'Add Custom Time'}
              </button>
            </div>

            {adjustResult && <p style={{ marginTop: 16, color: adjustResult.includes('✅') ? '#2e7d32' : '#dc3545' }}>{adjustResult}</p>}

            <button
              onClick={() => {
                setShowAdjustModal(false);
                setAdjustUserId(null);
                setAdjustResult('');
                setAdjustCustomDays('');
                setAdjustCustomHours('');
              }}
              style={{ marginTop: 16, background: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

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