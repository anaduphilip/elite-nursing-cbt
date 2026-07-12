// src/components/admin/AdminPanel.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg } from '../../utils/theme';
import { LoadingWithBar } from '../common/LoadingWithBar';

// Import tab components
import { DashboardTab } from './tabs/DashboardTab';
import { UsersTab } from './tabs/UsersTab';
import { ContactsTab } from './tabs/ContactsTab';
import { NotificationsTab } from './tabs/NotificationsTab';
import { ManualOtpTab } from './tabs/ManualOtpTab';
import { ManualResetTab } from './tabs/ManualResetTab';
import { BroadcastTab } from './tabs/BroadcastTab';
import { MarketingConsentTab } from './tabs/MarketingConsentTab';
import { AnnouncementTab } from './tabs/AnnouncementTab';
import { SystemSettingsTab } from './tabs/SystemSettingsTab';
import { CategoriesTab } from './tabs/CategoriesTab';
import { CouponsTab } from './tabs/CouponsTab';
import { QuestionEditorTab } from './tabs/QuestionEditorTab';
import { CategoryManagerTab } from './tabs/CategoryManagerTab';
import { FaqTab } from './tabs/FaqTab';
import { WeeklyQuizTab } from './tabs/WeeklyQuizTab';
import { LimitedOfferTab } from './tabs/LimitedOfferTab';

// Import modal components
import { QuestionModal } from './components/QuestionModal';
import { AdjustPremiumModal } from './components/AdjustPremiumModal';

export const AdminPanel = () => {
  // ===== All existing state =====
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

  // ---- Limited Offer states (NEW) ----
  const [limitedOffer, setLimitedOffer] = useState({
    enabled: false,
    discountPercent: 0,
    startDate: '',
    endDate: '',
    message: '🔥 Limited Time Offer!',
    buttonText: 'Get Premium Now',
    buttonLink: '/get-premium',
    targetAudience: 'free'
  });
  const [limitedOfferLoading, setLimitedOfferLoading] = useState(false);
  const [limitedOfferResult, setLimitedOfferResult] = useState('');

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

  const [userFilter, setUserFilter] = useState('all');

  // ========== NEW: Adjust Premium modal ==========
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustUserId, setAdjustUserId] = useState(null);
  const [adjustPlanType, setAdjustPlanType] = useState('daily');
  const [adjustCustomDays, setAdjustCustomDays] = useState('');
  const [adjustCustomHours, setAdjustCustomHours] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustResult, setAdjustResult] = useState('');

  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const [config, setConfig] = useState({});
  const [configLoading, setConfigLoading] = useState(false);
  const [configResult, setConfigResult] = useState('');

  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('📚');
  const [catDescription, setCatDescription] = useState('');
  const [catOrder, setCatOrder] = useState(0);
  const [catActive, setCatActive] = useState(true);
  const [editingCatId, setEditingCatId] = useState(null);
  const [catResult, setCatResult] = useState('');

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
  const [couponPlanType, setCouponPlanType] = useState('all');
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [couponResult, setCouponResult] = useState('');

  const [faqs, setFaqs] = useState([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('General');
  const [faqOrder, setFaqOrder] = useState(0);
  const [faqActive, setFaqActive] = useState(true);
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [faqResult, setFaqResult] = useState('');

  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 1
  });
  const [questionSearch, setQuestionSearch] = useState('');
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [categoryManagerCategory, setCategoryManagerCategory] = useState('');
  const [categoryManagerTitle, setCategoryManagerTitle] = useState('');
  const [categoryManagerTopic, setCategoryManagerTopic] = useState('');
  const [categoryManagerQuestions, setCategoryManagerQuestions] = useState([]);
  const [categoryManagerBatch, setCategoryManagerBatch] = useState('');
  const [categoryManagerSingleQ, setCategoryManagerSingleQ] = useState('');
  const [categoryManagerSingleOpts, setCategoryManagerSingleOpts] = useState(['', '', '', '']);
  const [categoryManagerSingleCorrect, setCategoryManagerSingleCorrect] = useState(0);
  const [categoryManagerSearch, setCategoryManagerSearch] = useState('');
  const [categoryManagerQuizzes, setCategoryManagerQuizzes] = useState([]);
  const [categoryManagerLoading, setCategoryManagerLoading] = useState(false);
  const [categoryManagerResult, setCategoryManagerResult] = useState('');
  const [categoryManagerEditingIdx, setCategoryManagerEditingIdx] = useState(null);
  const [categoryManagerExistingQuizId, setCategoryManagerExistingQuizId] = useState(null);

// ============================================================
// ========== ALL ORIGINAL FUNCTIONS ==========================
// ============================================================

// ===== Dashboard =====
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

// ===== Config =====
const fetchConfig = async () => {
  try {
    const res = await axios.get('/api/admin/config', { headers: { Authorization: `Bearer ${token}` } });
    if (res.data.success) {
      setConfig(res.data.config);
      // Load limited offer from config
      if (res.data.config.limitedOffer) {
        const offer = res.data.config.limitedOffer;
        setLimitedOffer({
          enabled: offer.enabled || false,
          discountPercent: offer.discountPercent || 0,
          startDate: offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 16) : '',
          endDate: offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 16) : '',
          message: offer.message || '🔥 Limited Time Offer!',
          buttonText: offer.buttonText || 'Get Premium Now',
          buttonLink: offer.buttonLink || '/get-premium',
          targetAudience: offer.targetAudience || 'free'
        });
      }
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

// ===== Limited Offer Functions (NEW) =====
const handleSaveLimitedOffer = async () => {
  setLimitedOfferLoading(true);
  setLimitedOfferResult('');
  try {
    // Create a copy of config and update limitedOffer
    const updatedConfig = { ...config };
    updatedConfig.limitedOffer = {
      enabled: limitedOffer.enabled,
      discountPercent: parseFloat(limitedOffer.discountPercent) || 0,
      startDate: limitedOffer.startDate ? new Date(limitedOffer.startDate) : null,
      endDate: limitedOffer.endDate ? new Date(limitedOffer.endDate) : null,
      message: limitedOffer.message || '🔥 Limited Time Offer!',
      buttonText: limitedOffer.buttonText || 'Get Premium Now',
      buttonLink: limitedOffer.buttonLink || '/get-premium',
      targetAudience: limitedOffer.targetAudience || 'free'
    };

    const res = await axios.put('/api/admin/config', updatedConfig, { headers: { Authorization: `Bearer ${token}` } });
    if (res.data.success) {
      setConfig(res.data.config);
      // Update local limited offer state with saved data
      if (res.data.config.limitedOffer) {
        const offer = res.data.config.limitedOffer;
        setLimitedOffer({
          enabled: offer.enabled || false,
          discountPercent: offer.discountPercent || 0,
          startDate: offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 16) : '',
          endDate: offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 16) : '',
          message: offer.message || '🔥 Limited Time Offer!',
          buttonText: offer.buttonText || 'Get Premium Now',
          buttonLink: offer.buttonLink || '/get-premium',
          targetAudience: offer.targetAudience || 'free'
        });
      }
      setLimitedOfferResult('✅ Limited offer updated successfully!');
    }
  } catch (error) {
    setLimitedOfferResult('❌ Failed to update limited offer: ' + (error.response?.data?.error || error.message));
  } finally {
    setLimitedOfferLoading(false);
  }
};

// ===== Categories =====
const fetchCategories = async () => {
  setCatLoading(true);
  try {
    const res = await axios.get('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } });
    const sorted = (res.data.categories || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    setCategories(sorted);
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

// ===== Coupons =====
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

// ===== FAQs =====
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

// ===== Users =====
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

// ===== Contacts =====
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

// ===== Notifications =====
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

// ===== Manual OTP =====
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

// ===== Manual Reset =====
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

// ===== Broadcast =====
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

// ===== Marketing Consent =====
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

// ===== Announcement =====
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

// ===== Weekly Quiz =====
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

// ===== Question Editor =====
const fetchQuizzes = async () => {
  try {
    const res = await axios.get('/api/admin/quizzes', { headers: { Authorization: `Bearer ${token}` } });
    if (res.data.success) {
      setQuizzes(res.data.quizzes || []);
    }
  } catch (error) {
    console.error('Failed to fetch quizzes:', error);
  }
};

const fetchQuestions = async (quizId) => {
  setLoadingQuestions(true);
  try {
    const res = await axios.get(`/api/admin/quizzes/${quizId}/questions`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.data.success) {
      setQuestions(res.data.questions || []);
    }
  } catch (error) {
    alert('Failed to load questions: ' + (error.response?.data?.error || error.message));
  } finally {
    setLoadingQuestions(false);
  }
};

const openEditQuestionInQuiz = (question) => {
  setEditingQuestion(question);
  setQuestionForm({
    questionText: question.questionText,
    options: [...question.options],
    correctAnswer: question.correctAnswer,
    points: question.points || 1
  });
  setShowQuestionModal(true);
};

const handleAddQuestionToQuiz = async () => {
  const { questionText, options, correctAnswer, points } = questionForm;
  if (!questionText.trim()) {
    alert('Please enter a question');
    return;
  }
  if (options.some(opt => !opt.trim())) {
    alert('Please fill in all 4 options');
    return;
  }
  if (!selectedQuiz) {
    alert('Please select a quiz first');
    return;
  }
  try {
    const res = await axios.post(`/api/admin/quizzes/${selectedQuiz}/questions`, {
      questionText: questionText.trim(),
      options: options.map(o => o.trim()),
      correctAnswer: correctAnswer,
      points: points || 1
    }, { headers: { Authorization: `Bearer ${token}` } });
    if (res.data.success) {
      setQuestions([...questions, res.data.question]);
      resetQuestionForm();
      setShowQuestionModal(false);
    }
  } catch (error) {
    alert('Failed to add question: ' + (error.response?.data?.error || error.message));
  }
};

const handleUpdateQuestionInQuiz = async () => {
  const { questionText, options, correctAnswer, points } = questionForm;
  if (!questionText.trim()) {
    alert('Please enter a question');
    return;
  }
  if (options.some(opt => !opt.trim())) {
    alert('Please fill in all 4 options');
    return;
  }
  if (!selectedQuiz || !editingQuestion) {
    alert('Missing data');
    return;
  }
  try {
    const res = await axios.put(`/api/admin/quizzes/${selectedQuiz}/questions/${editingQuestion._id}`, {
      questionText: questionText.trim(),
      options: options.map(o => o.trim()),
      correctAnswer: correctAnswer,
      points: points || 1
    }, { headers: { Authorization: `Bearer ${token}` } });
    if (res.data.success) {
      setQuestions(questions.map(q => q._id === editingQuestion._id ? res.data.question : q));
      resetQuestionForm();
      setShowQuestionModal(false);
    }
  } catch (error) {
    alert('Failed to update question: ' + (error.response?.data?.error || error.message));
  }
};

const handleDeleteQuestionFromQuiz = async (questionId) => {
  if (!window.confirm('Delete this question permanently?')) return;
  if (!selectedQuiz) return;
  try {
    await axios.delete(`/api/admin/quizzes/${selectedQuiz}/questions/${questionId}`, { headers: { Authorization: `Bearer ${token}` } });
    setQuestions(questions.filter(q => q._id !== questionId));
  } catch (error) {
    alert('Failed to delete question: ' + (error.response?.data?.error || error.message));
  }
};

const resetQuestionForm = () => {
  setQuestionForm({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 1
  });
  setEditingQuestion(null);
};

// ===== Category Manager =====
const fetchCategoryManagerQuizzes = async () => {
  try {
    const res = await axios.get('/api/admin/quizzes', { headers: { Authorization: `Bearer ${token}` } });
    if (res.data.success) {
      setCategoryManagerQuizzes(res.data.quizzes || []);
    }
  } catch (error) {
    console.error('Failed to fetch quizzes for manager:', error);
  }
};

const handleCategoryManagerBatchImport = () => {
  if (!categoryManagerBatch.trim()) {
    alert('Please paste some questions first.');
    return;
  }
  if (!categoryManagerCategory) {
    alert('Please select a category.');
    return;
  }
  if (!categoryManagerTitle.trim()) {
    alert('Please enter a title.');
    return;
  }

  const lines = categoryManagerBatch.split('\n').map(l => l.trim()).filter(l => l);
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

    let questionText = fullText.replace(/\s*\([a-d]\)[^(]*/g, '').trim();
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
    alert('No valid questions found. Please check the format.\n\nSupported formats:\n1. Q1. Question text? (a) Option (b) Option (c) Option (d) Option\n2. Q1. Question text?\n(a) Option\n(b) Option\n(c) Option\n(d) Option\nAnswer: a');
    return;
  }

  const existingQuestions = categoryManagerQuestions || [];
  setCategoryManagerQuestions([...existingQuestions, ...parsedQuestions]);
  setCategoryManagerBatch('');
  alert(`✅ ${parsedQuestions.length} questions added to the list.`);
};

const handleCategoryManagerAddSingle = () => {
  if (!categoryManagerSingleQ.trim()) {
    alert('Please enter a question.');
    return;
  }
  if (categoryManagerSingleOpts.some(opt => !opt.trim())) {
    alert('Please fill in all 4 options.');
    return;
  }
  const newQ = {
    questionText: categoryManagerSingleQ.trim(),
    options: categoryManagerSingleOpts.map(o => o.trim()),
    correctAnswer: categoryManagerSingleCorrect,
    points: 1
  };
  if (categoryManagerEditingIdx !== null) {
    const updated = [...categoryManagerQuestions];
    updated[categoryManagerEditingIdx] = newQ;
    setCategoryManagerQuestions(updated);
    setCategoryManagerEditingIdx(null);
  } else {
    setCategoryManagerQuestions([...categoryManagerQuestions, newQ]);
  }
  setCategoryManagerSingleQ('');
  setCategoryManagerSingleOpts(['', '', '', '']);
  setCategoryManagerSingleCorrect(0);
};

const handleCategoryManagerEditQuestion = (idx) => {
  const q = categoryManagerQuestions[idx];
  setCategoryManagerSingleQ(q.questionText);
  setCategoryManagerSingleOpts([...q.options]);
  setCategoryManagerSingleCorrect(q.correctAnswer);
  setCategoryManagerEditingIdx(idx);
};

const handleCategoryManagerDeleteQuestion = (idx) => {
  const updated = [...categoryManagerQuestions];
  updated.splice(idx, 1);
  setCategoryManagerQuestions(updated);
  if (categoryManagerEditingIdx === idx) {
    setCategoryManagerEditingIdx(null);
    setCategoryManagerSingleQ('');
    setCategoryManagerSingleOpts(['', '', '', '']);
    setCategoryManagerSingleCorrect(0);
  }
};

// ===== Category Manager Clear =====
const handleClearCategoryManager = () => {
  setCategoryManagerQuestions([]);
  setCategoryManagerBatch('');
  setCategoryManagerTopic('');
  setCategoryManagerTitle('');
  setCategoryManagerEditingIdx(null);
  setCategoryManagerSingleQ('');
  setCategoryManagerSingleOpts(['', '', '', '']);
  setCategoryManagerSingleCorrect(0);
  setCategoryManagerExistingQuizId(null);
  setCategoryManagerResult('');
};

const handleCategoryManagerSaveQuiz = async () => {
  if (!categoryManagerCategory) {
    alert('Please select a category.');
    return;
  }
  if (!categoryManagerTitle.trim()) {
    alert('Please enter a title.');
    return;
  }
  if (!categoryManagerTopic.trim()) {
    alert('Please enter a topic name.');
    return;
  }
  if (categoryManagerQuestions.length === 0) {
    alert('Please add at least one question.');
    return;
  }

  setCategoryManagerLoading(true);
  setCategoryManagerResult('');
  try {
    const existingQuizMeta = categoryManagerQuizzes.find(
      q => q.title === categoryManagerTitle.trim() && q.category === categoryManagerCategory
    );

    let res;
    if (existingQuizMeta) {
      const fullQuizRes = await axios.get(`/api/admin/quizzes/${existingQuizMeta._id}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const existingQuestions = fullQuizRes.data.questions || [];
      const updatedQuestions = [...existingQuestions, ...categoryManagerQuestions];

      setCategoryManagerResult(`📝 Appending ${categoryManagerQuestions.length} questions to "${existingQuizMeta.title}"...`);

      res = await axios.put(`/api/admin/quizzes/${existingQuizMeta._id}`, {
        title: existingQuizMeta.title,
        description: existingQuizMeta.description || `${existingQuizMeta.title} - ${updatedQuestions.length} practice questions`,
        category: existingQuizMeta.category,
        topic: categoryManagerTopic.trim(),
        questions: updatedQuestions,
        passingScore: existingQuizMeta.passingScore || 70,
        isPremium: existingQuizMeta.isPremium || false
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setCategoryManagerResult(`✅ Appended ${categoryManagerQuestions.length} questions to "${existingQuizMeta.title}"! Total: ${updatedQuestions.length} questions.`);
      }
    } else {
      const payload = {
        title: categoryManagerTitle.trim(),
        description: `${categoryManagerTitle.trim()} - ${categoryManagerQuestions.length} practice questions`,
        category: categoryManagerCategory,
        topic: categoryManagerTopic.trim(),
        questions: categoryManagerQuestions,
        passingScore: 70,
        isPremium: false
      };
      res = await axios.post('/api/admin/quizzes', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCategoryManagerResult(`✅ Quiz created with ${categoryManagerQuestions.length} questions under "${categoryManagerCategory}"!`);
      }
    }

    if (res?.data?.success) {
      setCategoryManagerQuestions([]);
      setCategoryManagerTopic('');
      setCategoryManagerTitle('');
      setCategoryManagerBatch('');
      setCategoryManagerExistingQuizId(null);
      await fetchCategoryManagerQuizzes();
      await fetchQuizzes();
    }
  } catch (error) {
    console.error('Save quiz error:', error);
    setCategoryManagerResult('❌ Failed to save quiz: ' + (error.response?.data?.error || error.message));
  } finally {
    setCategoryManagerLoading(false);
  }
};

const handleCategoryManagerEditQuiz = async (quizId) => {
  try {
    const res = await axios.get(`/api/admin/quizzes/${quizId}/questions`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.data.success) {
      const quiz = categoryManagerQuizzes.find(q => q._id === quizId);
      if (quiz) {
        setCategoryManagerCategory(quiz.category);
        setCategoryManagerTitle(quiz.title);
        setCategoryManagerTopic(quiz.topic || quiz.title);
        setCategoryManagerQuestions(res.data.questions || []);
        setCategoryManagerResult(`✅ Loaded "${quiz.title}" for editing.`);
      }
    }
  } catch (error) {
    alert('Failed to load quiz: ' + (error.response?.data?.error || error.message));
  }
};

const handleCategoryManagerDeleteQuiz = async (quizId) => {
  if (!window.confirm('Delete this quiz permanently? This will remove all questions.')) return;
  try {
    await axios.delete(`/api/admin/quizzes/${quizId}`, { headers: { Authorization: `Bearer ${token}` } });
    await fetchCategoryManagerQuizzes();
    setCategoryManagerResult('✅ Quiz deleted.');
  } catch (error) {
    setCategoryManagerResult('❌ Failed to delete quiz: ' + (error.response?.data?.error || error.message));
  }
};

// ===== Adjust Premium =====
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
      const usersRes = await axios.get('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(usersRes.data);
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

// ============================================================
// ========== FETCH ALL DATA ON MOUNT =========================
// ============================================================
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
        fetchFaqs(),
        fetchQuizzes(),
        fetchCategoryManagerQuizzes()
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

  // ===== Render =====
  if (!dataLoaded) return <LoadingWithBar message="Loading admin panel" />;
  if (user?.email !== 'elitenursingcbt@gmail.com') return <Navigate to="/" />;

  // ===== FIXED: Use let instead of const for filteredUsers =====
  let filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (userFilter === 'premium') {
    filteredUsers = filteredUsers.filter(u => u.isPremium === true);
  } else if (userFilter === 'free') {
    filteredUsers = filteredUsers.filter(u => u.isPremium === false);
  }

  // ===== Tab props =====
  const commonProps = {
    darkMode,
    headingColor,
    secondaryText,
    textColor,
    cardBg,
    token
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
            <button onClick={() => setActiveTab('questionEditor')} style={{ background: activeTab === 'questionEditor' ? '#1e3c72' : 'transparent', color: activeTab === 'questionEditor' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'questionEditor' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>📝 Question Editor</button>
            <button onClick={() => setActiveTab('categoryManager')} style={{ background: activeTab === 'categoryManager' ? '#2E7D64' : 'transparent', color: activeTab === 'categoryManager' ? 'white' : '#2E7D64', padding: '10px 24px', border: activeTab === 'categoryManager' ? 'none' : '1px solid #2E7D64', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>📂 Category Question Manager</button>
            <button onClick={() => setActiveTab('faq')} style={{ background: activeTab === 'faq' ? '#1e3c72' : 'transparent', color: activeTab === 'faq' ? 'white' : '#1e3c72', padding: '10px 24px', border: activeTab === 'faq' ? 'none' : '1px solid #1e3c72', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}> FAQ Tab</button>
            <button onClick={() => setActiveTab('weeklyQuiz')} style={{ background: activeTab === 'weeklyQuiz' ? '#2E7D64' : 'transparent', color: activeTab === 'weeklyQuiz' ? 'white' : '#2E7D64', padding: '10px 24px', border: activeTab === 'weeklyQuiz' ? 'none' : '1px solid #2E7D64', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}> Weekly Quiz ({weeklyQuizzes.length})</button>
            {/* ===== NEW TAB ===== */}
            <button onClick={() => setActiveTab('limitedOffer')} style={{ background: activeTab === 'limitedOffer' ? '#ff9800' : 'transparent', color: activeTab === 'limitedOffer' ? 'white' : '#ff9800', padding: '10px 24px', border: activeTab === 'limitedOffer' ? 'none' : '1px solid #ff9800', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>🔥 Limited Offer</button>
          </div>

          {/* ===== Render the active tab ===== */}
          {activeTab === 'dashboard' && <DashboardTab {...{ dashboardData, dashboardLoading, ...commonProps }} />}
          {activeTab === 'users' && <UsersTab {...{ users, filteredUsers, searchQuery, setSearchQuery, userFilter, setUserFilter, selectedPlan, setSelectedPlan, applyPlan, deleteUser, setAdjustUserId, setShowAdjustModal, ...commonProps }} />}
          {activeTab === 'contacts' && <ContactsTab {...{ contacts, replyingTo, setReplyingTo, replyMessage, setReplyMessage, sendingReply, sendReply, ...commonProps }} />}
          {activeTab === 'notifications' && <NotificationsTab {...{ notificationTitle, setNotificationTitle, notificationMessage, setNotificationMessage, sendingNotification, sendNotification, notificationStatus, ...commonProps }} />}
          {activeTab === 'manualOtp' && <ManualOtpTab {...{ manualOtpEmail, setManualOtpEmail, generatingOtp, generateManualOtp, manualOtpResult, ...commonProps }} />}
          {activeTab === 'manualReset' && <ManualResetTab {...{ resetEmail, setResetEmail, generatingResetOtp, generateManualResetOtp, resetOtpResult, ...commonProps }} />}
          {activeTab === 'broadcast' && <BroadcastTab {...{ broadcastSubject, setBroadcastSubject, broadcastMessage, setBroadcastMessage, broadcastTemplate, setBroadcastTemplate, broadcastLoading, handleBroadcast, broadcastResult, ...commonProps }} />}
          {activeTab === 'marketingConsent' && <MarketingConsentTab {...{ consentMessage, setConsentMessage, consentButtonText, setConsentButtonText, consentActive, setConsentActive, consentVersion, consentLoading, handleSaveConsent, handleDeactivateConsent, loadConsent, consentResult, ...commonProps }} />}
          {activeTab === 'announcement' && <AnnouncementTab {...{ announcementMessage, setAnnouncementMessage, announcementButtonText, setAnnouncementButtonText, announcementButtonLink, setAnnouncementButtonLink, announcementActive, setAnnouncementActive, announcementVersion, announcementLoading, handleSaveAnnouncement, handleDeactivateAnnouncement, loadAnnouncement, announcementResult, ...commonProps }} />}
          {activeTab === 'system' && <SystemSettingsTab {...{ config, setConfig, configLoading, handleSaveConfig, configResult, ...commonProps }} />}
          {activeTab === 'categories' && <CategoriesTab {...{ categories, catLoading, catName, setCatName, catIcon, setCatIcon, catDescription, setCatDescription, catOrder, setCatOrder, catActive, setCatActive, editingCatId, catResult, handleSaveCategory, handleDeleteCategory, editCategory, setCatResult, fetchCategories, ...commonProps }} />}
          {activeTab === 'coupons' && <CouponsTab {...{ coupons, couponLoading, couponCode, setCouponCode, couponDiscountType, setCouponDiscountType, couponDiscountValue, setCouponDiscountValue, couponMinPurchase, setCouponMinPurchase, couponMaxDiscount, setCouponMaxDiscount, couponExpiryDate, setCouponExpiryDate, couponUsageLimit, setCouponUsageLimit, couponActive, setCouponActive, couponDescription, setCouponDescription, couponPlanType, setCouponPlanType, editingCouponId, couponResult, handleSaveCoupon, handleDeleteCoupon, editCoupon, resetCouponForm, ...commonProps }} />}
          {activeTab === 'questionEditor' && <QuestionEditorTab {...{ 
            selectedQuiz, 
            setSelectedQuiz, 
            quizzes, 
            questions, 
            loadingQuestions, 
            questionSearch, 
            setQuestionSearch, 
            setShowQuestionModal, 
            resetQuestionForm, 
            handleDeleteQuestionFromQuiz,
            fetchQuestions,
            openEditQuestionInQuiz,
            ...commonProps 
          }} />}
          {activeTab === 'categoryManager' && <CategoryManagerTab {...{ 
            categoryManagerCategory, setCategoryManagerCategory, 
            categoryManagerTitle, setCategoryManagerTitle, 
            categoryManagerTopic, setCategoryManagerTopic, 
            categoryManagerQuestions, setCategoryManagerQuestions, 
            categoryManagerBatch, setCategoryManagerBatch, 
            categoryManagerSingleQ, setCategoryManagerSingleQ, 
            categoryManagerSingleOpts, setCategoryManagerSingleOpts, 
            categoryManagerSingleCorrect, setCategoryManagerSingleCorrect, 
            categoryManagerSearch, setCategoryManagerSearch, 
            categoryManagerQuizzes, setCategoryManagerQuizzes, 
            categoryManagerLoading, 
            categoryManagerResult, setCategoryManagerResult, 
            categoryManagerEditingIdx, setCategoryManagerEditingIdx, 
            categoryManagerExistingQuizId, setCategoryManagerExistingQuizId,
            handleCategoryManagerBatchImport, 
            handleCategoryManagerAddSingle, 
            handleCategoryManagerEditQuestion, 
            handleCategoryManagerDeleteQuestion, 
            handleCategoryManagerSaveQuiz, 
            handleCategoryManagerEditQuiz, 
            handleCategoryManagerDeleteQuiz,
            handleClearCategoryManager,
            categories, 
            ...commonProps 
          }} />}
          {activeTab === 'faq' && <FaqTab {...{ faqs, faqLoading, faqQuestion, setFaqQuestion, faqAnswer, setFaqAnswer, faqCategory, setFaqCategory, faqOrder, setFaqOrder, faqActive, setFaqActive, editingFaqId, faqResult, handleSaveFaq, handleDeleteFaq, editFaq, ...commonProps }} />}
          {activeTab === 'weeklyQuiz' && <WeeklyQuizTab {...{ weeklyQuizzes, loadingQuizzes, quizTitle, setQuizTitle, quizDescription, setQuizDescription, quizInstructions, setQuizInstructions, quizWeekNumber, setQuizWeekNumber, quizQuestions, quizPassingScore, setQuizPassingScore, quizTimeLimit, setQuizTimeLimit, quizStartDate, setQuizStartDate, quizEndDate, setQuizEndDate, quizIsPremium, setQuizIsPremium, editingQuizId, showQuizForm, setShowQuizForm, qText, setQText, qOptions, setQOptions, qCorrect, setQCorrect, editingQuestionIndex, batchInput, setBatchInput, selectedQuizResults, showResults, setShowResults, handleAddQuestion, handleBatchImport, handleEditQuestion, handleDeleteQuestion, handleSaveQuiz, handlePublishQuiz, handleTogglePublish, handleTogglePremium, handleDeleteQuiz, handleViewResults, editQuiz, resetQuizForm, fetchWeeklyQuizzes, setActiveTab, ...commonProps }} />}
          {/* ===== NEW TAB ===== */}
          {activeTab === 'limitedOffer' && <LimitedOfferTab {...{ 
            limitedOffer, 
            setLimitedOffer, 
            limitedOfferLoading, 
            limitedOfferResult, 
            handleSaveLimitedOffer,
            ...commonProps 
          }} />}

          {/* ===== Modals ===== */}
          <QuestionModal
            showQuestionModal={showQuestionModal}
            setShowQuestionModal={setShowQuestionModal}
            editingQuestion={editingQuestion}
            questionForm={questionForm}
            setQuestionForm={setQuestionForm}
            resetQuestionForm={resetQuestionForm}
            handleAddQuestionToQuiz={handleAddQuestionToQuiz}
            handleUpdateQuestionInQuiz={handleUpdateQuestionInQuiz}
            cardBg={cardBg}
            headingColor={headingColor}
            textColor={textColor}
          />

          <AdjustPremiumModal
            showAdjustModal={showAdjustModal}
            setShowAdjustModal={setShowAdjustModal}
            adjustUserId={adjustUserId}
            adjustPlanType={adjustPlanType}
            setAdjustPlanType={setAdjustPlanType}
            adjustCustomDays={adjustCustomDays}
            setAdjustCustomDays={setAdjustCustomDays}
            adjustCustomHours={adjustCustomHours}
            setAdjustCustomHours={setAdjustCustomHours}
            adjustLoading={adjustLoading}
            adjustResult={adjustResult}
            handleAdjustPremium={handleAdjustPremium}
            cardBg={cardBg}
            headingColor={headingColor}
            textColor={textColor}
            secondaryText={secondaryText}
            darkMode={darkMode}
          />

          <div style={{ textAlign: 'center', padding: '20px', marginTop: 20 }}>
            <p style={{ color: secondaryText, fontSize: 12 }}>© 2026 ELITE Nursing & Midwifery CBT. All rights reserved.{' '}
              <Link to="/privacy" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none', marginLeft: 4 }}>Privacy Policy</Link>
              <span style={{ color: secondaryText, margin: '0 6px' }}>|</span>
              <Link to="/terms" style={{ color: '#2196f3', fontSize: 11, textDecoration: 'none' }}>Terms & Conditions</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};