const express = require('express');
const router = express.Router();
const Dish = require('../models/Dish');

// Verify database connection before running queries
function requireMongo(req, res, next) {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database is currently offline. Please check your connection string in .env'
    });
  }
  next();
}

// Add a new dish
router.post('/', requireMongo, async (req, res) => {
  try {
    const { name, category, categoryName, desc, price, calories, protein, chicken, popular, rating, image, available } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ success: false, message: 'Name, price, and category are required' });
    }

    const existing = await Dish.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
    if (existing) {
      return res.status(409).json({ success: false, message: `Dish "${name}" already exists` });
    }

    const dish = new Dish({
      name: name.trim(),
      category: category.trim(),
      categoryName: categoryName || category,
      desc: desc || '',
      price: Number(price),
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      chicken: Boolean(chicken),
      popular: Boolean(popular),
      rating: rating ? Number(rating) : 4.8,
      image: image || 'images/salads.jpg',
      available: available !== undefined ? Boolean(available) : true
    });

    const savedDish = await dish.save();
    return res.status(201).json({ success: true, message: 'Dish created successfully', dish: savedDish });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not create dish', error: err.message });
  }
});

// Get all dishes with optional filters (category, highProtein, search)
router.get('/', requireMongo, async (req, res) => {
  try {
    const { category, highProtein, chicken, search, available } = req.query;
    const filter = {};

    if (category && category !== 'all') filter.category = category;
    if (highProtein === 'true') filter.protein = { $gte: 20 };
    if (chicken !== undefined) filter.chicken = chicken === 'true';
    if (available !== undefined) filter.available = available === 'true';

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { desc: { $regex: q, $options: 'i' } }
      ];
    }

    const dishes = await Dish.find(filter).sort({ category: 1, name: 1 });
    return res.json({ success: true, count: dishes.length, dishes });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not fetch dishes', error: err.message });
  }
});

// Get a single dish by ID or name
router.get('/:id', requireMongo, async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const dish = isObjectId ? await Dish.findById(id) : await Dish.findOne({ name: new RegExp(`^${id}$`, 'i') });

    if (!dish) {
      return res.status(404).json({ success: false, message: 'Dish not found' });
    }
    return res.json({ success: true, dish });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving dish', error: err.message });
  }
});

// Update an existing dish
router.put('/:id', requireMongo, async (req, res) => {
  try {
    const dish = await Dish.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!dish) {
      return res.status(404).json({ success: false, message: 'Dish not found' });
    }
    return res.json({ success: true, message: 'Dish updated', dish });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not update dish', error: err.message });
  }
});

// Update specific fields (e.g. price or availability)
router.patch('/:id', requireMongo, async (req, res) => {
  try {
    const dish = await Dish.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!dish) {
      return res.status(404).json({ success: false, message: 'Dish not found' });
    }
    return res.json({ success: true, message: 'Dish updated', dish });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not update dish', error: err.message });
  }
});

// Delete a dish
router.delete('/:id', requireMongo, async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const deleted = isObjectId ? await Dish.findByIdAndDelete(id) : await Dish.findOneAndDelete({ name: new RegExp(`^${id}$`, 'i') });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Dish not found' });
    }
    return res.json({ success: true, message: `Removed ${deleted.name}`, deletedDish: deleted });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not delete dish', error: err.message });
  }
});

module.exports = router;
