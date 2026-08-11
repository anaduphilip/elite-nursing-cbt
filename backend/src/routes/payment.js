// src/routes/payment.js
const express = require('express');
const axios = require('axios');
const { User, Config, Coupon } = require('../models');
const { authenticate } = require('../middleware');

const router = express.Router();

// ---- Initialize payment ----
router.post('/initialize-payment', async (req, res) => {
  try {
    const { email, amount, userId, planType, examId, examTitle, sectionNumber, redirect_url, couponCode } = req.body;
    if (!userId) {
      console.error('❌ Payment initialization failed: userId is missing');
      return res.status(400).json({ error: 'User ID is required' });
    }

    // ---- Fetch user early (needed for all discount checks) ----
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: 'Your account has been deleted. Please log out and contact support.' });

    // ---- Limited offer check ----
    let finalAmount = amount;
    let appliedDiscount = 0;
    let offerApplied = false;
    const config = await Config.findOne();
    if (config && config.limitedOffer && config.limitedOffer.enabled) {
      const now = new Date();
      const start = config.limitedOffer.startDate ? new Date(config.limitedOffer.startDate) : null;
      const end = config.limitedOffer.endDate ? new Date(config.limitedOffer.endDate) : null;
      const discount = config.limitedOffer.discountPercent || 0;
      const target = config.limitedOffer.targetAudience || 'free';
      const isWithinDateRange = (!start || start <= now) && (!end || end >= now);
      let userQualifies = false;
      if (target === 'all') userQualifies = true;
      else if (target === 'free') {
        const user = await User.findById(userId);
        if (user && !user.isPremium) userQualifies = true;
      } else if (target === 'premium') {
        const user = await User.findById(userId);
        if (user && user.isPremium) userQualifies = true;
      }
      if (isWithinDateRange && userQualifies && discount > 0) {
        appliedDiscount = (amount * discount) / 100;
        finalAmount = Math.max(0, amount - appliedDiscount);
        offerApplied = true;
        console.log(`🎉 Limited offer applied: ${discount}% off for user ${userId}. Original: ${amount}, Final: ${finalAmount}`);
      }
    }

    // ---- Referral discount (applied after limited offer, before coupon) ----
    let referralDiscountAmount = 0;
    if (user.referralDiscount && user.referralDiscount.code && !user.referralDiscount.used) {
      const discount = user.referralDiscount;
      if (discount.expiresAt && new Date(discount.expiresAt) > new Date()) {
        referralDiscountAmount = (finalAmount * discount.discountPercent) / 100;
        finalAmount = Math.max(0, finalAmount - referralDiscountAmount);
        // Mark as used so it can't be reused
        user.referralDiscount.used = true;
        await user.save();
        console.log(`🎁 Referral discount applied: ${discount.discountPercent}% off for user ${userId}. Reduced by ${referralDiscountAmount}`);
      } else {
        // Expired – mark as used
        user.referralDiscount.used = true;
        await user.save();
      }
    }

    // ---- Coupon validation (applied AFTER offer and referral) ----
    let appliedCoupon = null;
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true, expiryDate: { $gt: new Date() } });
      if (coupon && coupon.usedCount < coupon.usageLimit) {
        const user = await User.findById(userId);
        const alreadyUsed = user.appliedCoupons.some(c => c.code === coupon.code);
        if (!alreadyUsed) {
          if (coupon.discountType === 'percentage') {
            discountAmount = (finalAmount * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) discountAmount = coupon.maxDiscount;
          } else {
            discountAmount = coupon.discountValue;
          }
          finalAmount = Math.max(0, finalAmount - discountAmount);
          appliedCoupon = coupon;
        }
      }
    }

    const tx_ref = `ELITE-${Date.now()}-${userId}-${Math.random().toString(36).substring(2, 8)}`;
    console.log(`💰 INITIALIZING PAYMENT: ${tx_ref} for user ${userId}, original: ${amount}, final: ${finalAmount}, offer: ${offerApplied}, referral: ${referralDiscountAmount > 0}, coupon: ${!!appliedCoupon}`);

    // ---- Apply coupon usage (if any) ----
    if (appliedCoupon) {
      appliedCoupon.usedCount += 1;
      await appliedCoupon.save();
      user.appliedCoupons.push({ code: appliedCoupon.code, discountAmount, appliedAt: new Date() });
    }

    const finalRedirectUrl = redirect_url || `https://elite-nursing-cbt.vercel.app/payment-return?reference=${tx_ref}`;
    const response = await axios.post('https://api.flutterwave.com/v3/payments', {
      tx_ref,
      amount: finalAmount,
      currency: "NGN",
      redirect_url: finalRedirectUrl,
      customer: { email, name: user.name || email },
      customizations: {
        title: "ELITE Nursing CBT",
        description: planType === 'single' ? `Exam ${sectionNumber} Access` : "Complete Premium Package"
      }
    }, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, 'Content-Type': 'application/json' }
    });

    const flutterwaveLink = response.data.data.link;
    const flutterwaveId = response.data.data.id;
    console.log(`✅ Payment initialized, Flutterwave ID: ${flutterwaveId}`);

    // ---- Save transaction record ----
    user.transactions.push({
      reference: tx_ref,
      flutterwaveId: flutterwaveId,
      amount: finalAmount,
      originalAmount: amount,
      discountAmount: discountAmount + (offerApplied ? appliedDiscount : 0) + referralDiscountAmount,
      couponCode: appliedCoupon?.code || null,
      offerApplied: offerApplied,
      offerDiscount: appliedDiscount,
      referralDiscountApplied: referralDiscountAmount > 0,
      referralDiscountAmount: referralDiscountAmount,
      status: 'pending',
      planType: planType || 'premium',
      examId: examId || null,
      examTitle: examTitle || null,
      sectionNumber: sectionNumber || null,
      date: new Date()
    });
    await user.save();

    res.json({ authorization_url: flutterwaveLink, reference: tx_ref, flutterwaveId });
  } catch (error) {
    console.error('❌ Payment initialization error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

// ---- Verify payment ----
router.post('/verify-payment', async (req, res) => {
  try {
    const { reference, transactionId, userId } = req.body;
    console.log(`🔍 VERIFYING - Reference: ${reference}, TransactionId: ${transactionId}, UserId: ${userId}`);
    if ((!reference && !transactionId) || !userId) {
      return res.status(400).json({ success: false, error: 'Missing reference or userId' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    console.log(`🧑‍💻 User: ${user.email}, isPremium: ${user.isPremium}, current premiumExpiry: ${user.premiumExpiry}`);
    const transactionIndex = user.transactions.findIndex(t => t.reference === reference);
    if (transactionIndex === -1) {
      console.log(`Transaction not found for reference: ${reference}`);
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    const transaction = user.transactions[transactionIndex];
    if (transaction.status === 'completed') {
      console.log(`⚠️ Transaction ${reference} already processed. Returning current state.`);
      return res.json({ success: true, isPremium: user.isPremium, plan: user.premiumPlan, expiry: user.premiumExpiry, alreadyProcessed: true });
    }
    const verifyId = transactionId || transaction.flutterwaveId;
    if (!verifyId) {
      return res.json({ success: false, pending: true, message: 'No transaction ID available' });
    }
    console.log(`Verifying with Flutterwave ID: ${verifyId}`);
    const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${verifyId}/verify`, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
      timeout: 30000
    });
    const txData = response.data.data;
    console.log(`📊 Flutterwave status: ${txData?.status}, amount: ${txData?.amount}`);
    if (txData?.status === 'successful') {
      const plan = transaction.planType || 'monthly';
      console.log(`📦 Plan from transaction: ${plan}`);
      const now = new Date();
      let expiry;
      if (!user.isPremium) {
        console.log(`ℹ️ User is not premium – starting fresh from now.`);
        expiry = new Date(now);
      } else {
        expiry = (user.premiumExpiry && user.premiumExpiry > now) ? new Date(user.premiumExpiry) : new Date(now);
        console.log(`ℹ️ User is premium – starting from existing expiry: ${expiry.toISOString()}`);
      }
      console.log(`📆 Starting expiry (before adding plan): ${expiry.toISOString()}`);
      switch (plan) {
        case 'daily': expiry.setDate(expiry.getDate() + 1); break;
        case 'monthly': expiry.setMonth(expiry.getMonth() + 1); break;
        case 'yearly': expiry.setFullYear(expiry.getFullYear() + 1); break;
        default: expiry.setFullYear(expiry.getFullYear() + 1);
      }
      console.log(`📆 Final expiry (after adding ${plan}): ${expiry.toISOString()}`);
      user.isPremium = true;
      user.premiumPlan = plan;
      user.premiumExpiry = expiry;
      user.purchaseDate = new Date();
      user.transactions[transactionIndex].status = 'completed';
      user.transactions[transactionIndex].flutterwaveId = txData.id;

      // ===== REFERRAL BONUS: Award referrer when referred user purchases =====
      if (user.referredBy && !user.referralBonusClaimed) {
        try {
          const referrer = await User.findById(user.referredBy);
          if (referrer) {
            // Give referrer +1 day
            let referrerExpiry = referrer.premiumExpiry && referrer.premiumExpiry > new Date() 
              ? referrer.premiumExpiry 
              : new Date();
            referrerExpiry.setDate(referrerExpiry.getDate() + 1);
            
            referrer.isPremium = true;
            referrer.premiumExpiry = referrerExpiry;
            referrer.premiumPlan = 'daily';
            referrer.referralCount = (referrer.referralCount || 0) + 1;
            referrer.referralRewards.push({
              rewardedAt: new Date(),
              type: 'premium_days',
              value: 1
            });
            await referrer.save();
            
            // Mark bonus as claimed for the buyer
            user.referralBonusClaimed = true;
            
            console.log(`🎁 [REFERRAL] Referrer ${referrer.email} awarded +1 day because ${user.email} purchased Premium!`);
          } else {
            console.log(`⚠️ [REFERRAL] Referrer not found for user ${user.email} (referredBy: ${user.referredBy})`);
          }
        } catch (bonusError) {
          console.error('❌ [REFERRAL] Failed to award referral bonus:', bonusError);
          // Do not block the main flow; just log
        }
      }

      await user.save();
      console.log(`✅ User ${user.email} premium extended to ${expiry.toISOString()}`);
      return res.json({ success: true, isPremium: true, plan: plan, expiry: expiry, user: user });
    } else if (txData?.status === 'pending') {
      return res.json({ success: false, pending: true, message: 'Payment still processing' });
    } else {
      return res.json({ success: false, error: `Payment status: ${txData?.status}` });
    }
  } catch (error) {
    console.error('Verification error:', error.response?.data || error.message);
    res.status(200).json({ success: false, error: 'Verification failed. Contact support.' });
  }
});

// ---- Validate coupon (for checkout) ----
router.post('/validate-coupon', authenticate, async (req, res) => {
  try {
    const { code, amount, planType } = req.body;
    if (!code || !planType) return res.status(400).json({ error: 'Code and plan type are required' });
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true, expiryDate: { $gt: new Date() } });
    if (!coupon) return res.json({ success: false, error: 'Invalid or expired coupon code' });
    if (coupon.planType !== 'all' && coupon.planType !== planType) {
      return res.json({ success: false, error: `This coupon is valid for ${coupon.planType} plan only.` });
    }
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.json({ success: false, error: 'Coupon has reached its usage limit' });
    }
    const user = await User.findById(req.user._id);
    const alreadyUsed = user.appliedCoupons.some(c => c.code === coupon.code);
    if (alreadyUsed) {
      return res.json({ success: false, error: 'You have already used this coupon' });
    }
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) discountAmount = coupon.maxDiscount;
    } else {
      discountAmount = coupon.discountValue;
    }
    const finalAmount = Math.max(0, amount - discountAmount);
    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount * 100) / 100,
        finalAmount: Math.round(finalAmount * 100) / 100,
        planType: coupon.planType
      }
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

module.exports = router;