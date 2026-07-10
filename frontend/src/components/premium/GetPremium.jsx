// src/components/premium/GetPremium.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { AuthContext } from '../../context/AuthContext';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg, getBorderColor } from '../../utils/theme';

export const GetPremium = () => {
  const { token, user, darkMode, login } = useContext(AuthContext);
  const borderColor = getBorderColor(darkMode);
  const cardBg = getCardBg(darkMode);
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [timeLeft, setTimeLeft] = useState(null);

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponAppliedPlan, setCouponAppliedPlan] = useState(null);
  // ===================================

  const plans = {
    daily: { label: 'Daily', amount: 500, duration: '24 hours' },
    monthly: { label: 'Monthly', amount: 2000, duration: '30 days' },
    yearly: { label: 'Yearly', amount: 10000, duration: '365 days' }
  };

  // Live countdown timer
  useEffect(() => {
    if (!user?.premiumExpiry) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(user.premiumExpiry);
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [user?.premiumExpiry]);

  // Poll premium status every 5 seconds while on this page
  useEffect(() => {
    let isMounted = true;

    const refreshStatus = async () => {
      if (!token) return;
      try {
        const response = await axios.get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const freshUser = response.data;
        if (isMounted) {
          const currentUser = user;
          const hasChanged = (
            currentUser?.isPremium !== freshUser.isPremium ||
            currentUser?.premiumPlan !== freshUser.premiumPlan ||
            currentUser?.premiumExpiry !== freshUser.premiumExpiry
          );
          if (hasChanged) {
            login(token, freshUser);
            console.log('Premium status refreshed:', freshUser);
          }
        }
      } catch (error) {
        console.error('Failed to refresh premium status:', error);
      }
    };

    refreshStatus();
    const interval = setInterval(refreshStatus, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, user?.id, user?.isPremium, user?.premiumExpiry]);

  // Re‑validate coupon when plan changes
  useEffect(() => {
    // If a coupon is applied and the plan changed, re‑validate or clear
    if (couponApplied && couponAppliedPlan && couponAppliedPlan !== selectedPlan) {
      const revalidateCoupon = async () => {
        try {
          const res = await axios.post('/api/validate-coupon', {
            code: couponCode,
            amount: plans[selectedPlan].amount,
            planType: selectedPlan
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) {
            setCouponApplied(res.data.coupon);
            setCouponAppliedPlan(selectedPlan);
            setCouponError('');
          } else {
            // Coupon invalid for new plan – clear it
            setCouponApplied(null);
            setCouponAppliedPlan(null);
            setCouponError('Coupon not valid for this plan. Please re-apply.');
            setCouponCode('');
          }
        } catch (error) {
          setCouponApplied(null);
          setCouponAppliedPlan(null);
          setCouponError('Error re-validating coupon. Please try again.');
        }
      };
      revalidateCoupon();
    }
  }, [selectedPlan, couponApplied, couponAppliedPlan, couponCode, token]);
  // ============================================================

  // Apply coupon
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    setCouponLoading(true);
    setCouponError('');
    setCouponApplied(null);
    setCouponAppliedPlan(null);
    try {
      const res = await axios.post('/api/validate-coupon', {
        code: couponCode,
        amount: plans[selectedPlan].amount,
        planType: selectedPlan
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCouponApplied(res.data.coupon);
        setCouponAppliedPlan(selectedPlan);
        setCouponError('');
      } else {
        setCouponError(res.data.error || 'Invalid coupon');
      }
    } catch (error) {
      setCouponError('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };
  // ==================================

  // Payment handler
  const handlePayment = async () => {
    if (!user?.id) {
      alert('Please log in again to make payment.');
      return;
    }

    setLoading(true);
    try {
      console.log('User ID for payment:', user.id);

      const amountToPay = plans[selectedPlan].amount; // original amount

      const isNative = Capacitor.isNativePlatform();
      const redirectUrl = isNative
        ? 'https://elite-nursing-cbt.vercel.app/payment-success.html'
        : 'https://elite-nursing-cbt.vercel.app/payment-return';

      const response = await axios.post('/api/initialize-payment', {
        email: user.email,
        amount: amountToPay,
        userId: user.id,
        planType: selectedPlan,
        examId: null,
        examTitle: null,
        sectionNumber: null,
        redirect_url: redirectUrl,
        couponCode: couponApplied ? couponCode : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.setItem('payment_reference', response.data.reference);

      if (isNative) {
        // Open the payment page in the browser
        await Browser.open({ url: response.data.authorization_url });
        // When the browser closes (user returns), reset loading
        setLoading(false);
        localStorage.setItem('waiting_for_payment', 'true');
        // Optionally, the PaymentReturn page will handle verification.
      } else {
        // For web, redirect – the page will reload, so no need to reset loading
        window.location.href = response.data.authorization_url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      // Show a specific message if available, otherwise a generic one
      const errorMsg = error.response?.data?.error || error.message || 'Payment initialization failed.';
      alert('Payment initialization failed: ' + errorMsg + '. Please try again.');
      setLoading(false);
    }
  };
  // ==========================================

  const formatExpiry = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if premium is still active
  const isPremiumActive = user?.isPremium && user?.premiumExpiry && new Date(user.premiumExpiry) > new Date();

  // Determine the display amount
  const displayAmount = couponApplied ? couponApplied.finalAmount : plans[selectedPlan].amount;
  const originalAmount = plans[selectedPlan].amount;
  const hasDiscount = couponApplied && displayAmount < originalAmount;

  return (
    <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: darkMode ? '#16213e' : 'white', borderRadius: 20, padding: 24, textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <Link to="/profile" style={{ display: 'inline-block', marginBottom: 16, color: headingColor, textDecoration: 'none', fontWeight: 'bold', textAlign: 'left' }}>
          ← Back to Profile
        </Link>

        <div style={{ fontSize: 56, marginBottom: 16 }}>⭐</div>
        <h2 style={{ color: headingColor }}>Upgrade to Premium</h2>
        <p style={{ marginBottom: 20 }}>Get unlimited access to all examinations and features</p>

        {/* ---- Premium Status (always shown if active) ---- */}
        {isPremiumActive && (
          <div style={{ background: darkMode ? '#2d2d3d' : '#e8f5e9', padding: 20, borderRadius: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
            <h3 style={{ color: headingColor }}>You are already a Premium Member!</h3>
            <div style={{ marginTop: 12, padding: 12, background: darkMode ? '#2d2d3d' : '#f5f5f5', borderRadius: 8 }}>
              <p style={{ margin: '4px 0' }}>
                <strong>Plan:</strong> {user.premiumPlan ? user.premiumPlan.toUpperCase() : 'N/A'}
              </p>
              <p style={{ margin: '4px 0' }}>
                <strong>Expires:</strong> {formatExpiry(user.premiumExpiry)}
              </p>

              {timeLeft && (
                <div style={{ marginTop: 12, padding: 12, background: '#fff3e0', borderRadius: 8 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 'bold', color: '#e65100' }}>
                    Time remaining:
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                    {timeLeft.days > 0 && (
                      <div>
                        <span style={{ fontSize: 24, fontWeight: 'bold', color: headingColor }}>{timeLeft.days}</span>
                        <span style={{ fontSize: 11, color: secondaryText, display: 'block' }}>days</span>
                      </div>
                    )}
                    <div>
                      <span style={{ fontSize: 24, fontWeight: 'bold', color: headingColor }}>{String(timeLeft.hours).padStart(2, '0')}</span>
                      <span style={{ fontSize: 11, color: secondaryText, display: 'block' }}>hrs</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 24, fontWeight: 'bold', color: headingColor }}>{String(timeLeft.minutes).padStart(2, '0')}</span>
                      <span style={{ fontSize: 11, color: secondaryText, display: 'block' }}>min</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 24, fontWeight: 'bold', color: headingColor }}>{String(timeLeft.seconds).padStart(2, '0')}</span>
                      <span style={{ fontSize: 11, color: secondaryText, display: 'block' }}>sec</span>
                    </div>
                  </div>
                </div>
              )}
              {!timeLeft && user.premiumExpiry && new Date(user.premiumExpiry) <= new Date() && (
                <p style={{ marginTop: 12, color: '#dc3545', fontWeight: 'bold' }}>
                  ⚠️ Your premium has expired. Please select a plan below to renew.
                </p>
              )}
            </div>
            <div style={{ marginTop: 16, padding: 12, background: '#e3f2fd', borderRadius: 8 }}>
              <p style={{ margin: 0, color: '#0d47a1', fontSize: 14 }}>
                Purchasing a new plan will <strong>extend</strong> your current premium access by the plan's duration.
              </p>
            </div>
          </div>
        )}

        {/* ---- Plan Selection (always visible) ---- */}
        <div style={{ marginTop: isPremiumActive ? 0 : 20 }}>
          <h3 style={{ color: headingColor, fontSize: 18, marginBottom: 16 }}>
            {isPremiumActive ? 'Renew or Upgrade Your Plan' : 'Choose Your Plan'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, margin: '20px 0' }}>
            {Object.entries(plans).map(([key, plan]) => (
              <div
                key={key}
                onClick={() => {
                  setSelectedPlan(key);
                  if (loading) setLoading(false);
                }}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: selectedPlan === key ? `3px solid ${headingColor}` : `2px solid ${borderColor}`,
                  background: selectedPlan === key ? (darkMode ? '#333' : '#e8f5e9') : cardBg,
                  cursor: 'pointer',
                  transition: '0.2s',
                  boxShadow: selectedPlan === key ? `0 4px 12px rgba(0,0,0,0.15)` : 'none'
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 'bold', color: headingColor }}>₦{plan.amount}</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: textColor }}>{plan.label}</div>
                <div style={{ fontSize: 12, color: secondaryText }}>{plan.duration}</div>
                {selectedPlan === key && (
                  <div style={{ marginTop: 8, fontSize: 11, color: headingColor, fontWeight: 'bold' }}>✓ SELECTED</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ---- Coupon Section ---- */}
        <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              style={{ padding: '8px 14px', border: '1px solid #ccc', borderRadius: 8, background: cardBg, color: textColor, fontSize: 14, width: 200 }}
            />
            <button
              onClick={applyCoupon}
              disabled={couponLoading}
              style={{ background: '#6c757d', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
            >
              {couponLoading ? '...' : 'Apply'}
            </button>
          </div>
          {couponError && <p style={{ color: '#dc3545', fontSize: 13, margin: 0 }}>{couponError}</p>}
          {couponApplied && (
            <div style={{ background: '#e8f5e9', padding: '8px 16px', borderRadius: 8, display: 'inline-block' }}>
              <p style={{ color: '#2e7d32', fontSize: 14, margin: 0 }}>
                ✅ Coupon applied! You save {couponApplied.discountType === 'percentage' ? `${couponApplied.discountValue}%` : `₦${couponApplied.discountValue}`}.
                {hasDiscount && <span> New total: ₦{displayAmount}</span>}
              </p>
            </div>
          )}
        </div>

        {/* ---- Total and Pay Button ---- */}
        <div style={{ background: darkMode ? '#1a1a2e' : '#f0f7f4', padding: 16, borderRadius: 12, margin: '20px 0' }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: headingColor }}>
            Selected: <span style={{ color: '#ff9800' }}>{plans[selectedPlan].label}</span> –
            {hasDiscount ? (
              <>
                <span style={{ textDecoration: 'line-through', color: secondaryText }}>₦{originalAmount}</span>
                <span style={{ color: '#2e7d32', marginLeft: 8 }}>₦{displayAmount}</span>
              </>
            ) : (
              <span> ₦{displayAmount}</span>
            )}
          </div>
        </div>

        <button onClick={handlePayment} disabled={loading} style={{ background: '#ff9800', color: 'white', padding: '12px 32px', border: 'none', borderRadius: 30, cursor: 'pointer', fontSize: 16, fontWeight: 'bold' }}>
          {loading ? 'Processing...' : `Pay ₦${displayAmount} (${plans[selectedPlan].label})`}
        </button>
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