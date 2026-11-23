require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Dish = require('./models/Dish');
const Order = require('./models/Order');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/greenox';
const MENU_FILE = path.join(__dirname, 'menu.json');

const sampleOrders = [
  {
    orderId: 'GX-20261120-A101',
    customer: {
      name: 'Aarav Sharma',
      phone: '9876543210',
      address: 'BSH (Bhagat Singh Hostel), Room 204, BML Munjal University'
    },
    items: [
      { name: 'High Protein Chicken Bowl', price: 129, quantity: 1 },
      { name: 'Whey Protein Shake', price: 149, quantity: 1 }
    ],
    subtotal: 278,
    taxes: 13.9,
    total: 291.9,
    paymentMethod: 'UPI',
    notes: 'Less spicy, call on arrival outside BSH gate',
    status: 'Delivered'
  },
  {
    orderId: 'GX-20261121-B202',
    customer: {
      name: 'Kavya Patel',
      phone: '9834567890',
      address: 'KCH (Kalpana Chawla Hostel), Room 411, BML Munjal University'
    },
    items: [
      { name: 'Avocado Veg Burrito Bowl', price: 199, quantity: 1 },
      { name: 'Watermelon Mint Mojito', price: 79, quantity: 1 }
    ],
    subtotal: 278,
    taxes: 13.9,
    total: 291.9,
    paymentMethod: 'UPI',
    notes: 'Keep extra napkins',
    status: 'In Kitchen'
  }
];

// Seed dishes and sample orders into MongoDB
async function seedDatabase() {
  console.log('Seeding GreeNox database...');

  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });

    const menuData = JSON.parse(fs.readFileSync(MENU_FILE, 'utf8'));
    const dishes = [];

    menuData.categories.forEach(cat => {
      cat.items.forEach(it => {
        dishes.push({
          name: it.name,
          category: cat.id,
          categoryName: cat.name,
          desc: it.desc || '',
          price: it.price,
          calories: it.calories || 250,
          protein: it.protein || 10,
          chicken: Boolean(it.chicken),
          popular: Boolean(it.popular),
          rating: it.rating || 4.8,
          image: it.image || 'images/salads.jpg',
          available: true
        });
      });
    });

    await Dish.deleteMany({});
    await Order.deleteMany({});

    await Dish.insertMany(dishes);
    await Order.insertMany(sampleOrders);

    console.log(`Seeded ${dishes.length} dishes and ${sampleOrders.length} sample orders.`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
}

seedDatabase();
