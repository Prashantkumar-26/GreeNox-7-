const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Dish name is required'],
      trim: true,
      unique: true
    },
    category: {
      type: String,
      required: [true, 'Category identifier is required'],
      trim: true
    },
    categoryName: {
      type: String,
      trim: true
    },
    desc: {
      type: String,
      trim: true,
      default: ''
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive']
    },
    calories: {
      type: Number,
      default: 0,
      min: 0
    },
    protein: {
      type: Number,
      default: 0,
      min: 0
    },
    chicken: {
      type: Boolean,
      default: false
    },
    popular: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5
    },
    image: {
      type: String,
      default: 'images/salads.jpg'
    },
    available: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Dish', dishSchema);
