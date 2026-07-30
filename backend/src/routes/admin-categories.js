// src/routes/admin-categories.js
const express = require('express');
const { Category } = require('../models');
const { isAdmin } = require('../middleware');

const router = express.Router();

// Get all categories (including inactive)
router.get('/', isAdmin, async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category
router.post('/', isAdmin, async (req, res) => {
  try {
    const { name, icon, description, order, active } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existing = await Category.findOne({ slug });
    if (existing) return res.status(400).json({ error: 'Category with this slug already exists' });
    const category = new Category({ name, slug, icon: icon || '📚', description: description || '', order: order || 0, active: active !== undefined ? active : true });
    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    console.error('Category create error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { name, icon, description, order, active } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    if (name) { category.name = name; category.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); }
    if (icon !== undefined) category.icon = icon;
    if (description !== undefined) category.description = description;
    if (order !== undefined) category.order = order;
    if (active !== undefined) category.active = active;
    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    console.error('Category update error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Soft delete (set active: false)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    category.active = false;
    await category.save();
    res.json({ success: true, message: 'Category deactivated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Hard delete (permanent)
router.delete('/:id/permanent', isAdmin, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;