// src/routes/admin-coupons.js
const express = require('express');
const { Coupon } = require('../models');
const { isAdmin } = require('../middleware');

const router = express.Router();

// Get all coupons
router.get('/', isAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// Create coupon
router.post('/', isAdmin, async (req, res) => {
  try {
    const { code, discountType, discountValue, planType, minPurchase, maxDiscount, expiryDate, usageLimit, active, description } = req.body;
    if (!code || !discountValue || !expiryDate) {
      return res.status(400).json({ error: 'Code, discount value, and expiry date are required' });
    }
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(400).json({ error: 'Coupon code already exists' });
    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType: discountType || 'percentage',
      discountValue,
      planType: planType || 'all',
      minPurchase: minPurchase || 0,
      maxDiscount: maxDiscount || null,
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit || 1,
      active: active !== undefined ? active : true,
      description: description || ''
    });
    await coupon.save();
    res.json({ success: true, coupon });
  } catch (error) {
    console.error('Coupon create error:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// Update coupon
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    const { code, discountType, discountValue, planType, minPurchase, maxDiscount, expiryDate, usageLimit, active, description } = req.body;
    if (code && code !== coupon.code) {
      const existing = await Coupon.findOne({ code: code.toUpperCase() });
      if (existing) return res.status(400).json({ error: 'Coupon code already exists' });
      coupon.code = code.toUpperCase();
    }
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (planType) coupon.planType = planType;
    if (minPurchase !== undefined) coupon.minPurchase = minPurchase;
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
    if (expiryDate) coupon.expiryDate = new Date(expiryDate);
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (active !== undefined) coupon.active = active;
    if (description !== undefined) coupon.description = description;
    await coupon.save();
    res.json({ success: true, coupon });
  } catch (error) {
    console.error('Coupon update error:', error);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

// Delete coupon
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

module.exports = router;