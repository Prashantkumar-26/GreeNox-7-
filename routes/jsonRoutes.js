const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const MENU_FILE = path.join(__dirname, '..', 'menu.json');
const DATA_DIR = path.join(__dirname, '..', 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Make sure orders file exists before reading/writing
function ensureOrdersFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

// Read menu from local menu.json
router.get('/menu', async (req, res) => {
  try {
    if (!fs.existsSync(MENU_FILE)) {
      return res.status(404).json({ success: false, message: 'menu.json not found' });
    }
    const rawData = await fs.promises.readFile(MENU_FILE, 'utf8');
    return res.json({
      success: true,
      source: 'local file (menu.json)',
      data: JSON.parse(rawData)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error reading menu.json', error: err.message });
  }
});

// Add a new dish to menu.json
router.post('/menu', async (req, res) => {
  try {
    const { categoryId, name, desc, price, calories, protein, chicken, image } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Dish name and price are required' });
    }

    const rawData = await fs.promises.readFile(MENU_FILE, 'utf8');
    const menuData = JSON.parse(rawData);

    let targetCategory = menuData.categories.find(c => c.id === categoryId) || menuData.categories[0];
    if (!targetCategory) {
      return res.status(400).json({ success: false, message: 'Category not found' });
    }

    const newItem = {
      name: String(name).trim(),
      desc: desc ? String(desc).trim() : '',
      price: Number(price),
      calories: calories !== undefined ? Number(calories) : 250,
      protein: protein !== undefined ? Number(protein) : 10,
      chicken: Boolean(chicken),
      popular: false,
      rating: 4.8,
      image: image || 'images/salads.jpg'
    };

    targetCategory.items.push(newItem);
    await fs.promises.writeFile(MENU_FILE, JSON.stringify(menuData, null, 2), 'utf8');

    return res.status(201).json({
      success: true,
      message: `Dish added to ${targetCategory.name}`,
      savedItem: newItem
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error writing to menu.json', error: err.message });
  }
});

// Read orders from data/orders.json
router.get('/orders', async (req, res) => {
  try {
    ensureOrdersFile();
    const rawData = await fs.promises.readFile(ORDERS_FILE, 'utf8');
    const orders = JSON.parse(rawData || '[]');
    return res.json({
      success: true,
      source: 'local file (data/orders.json)',
      count: orders.length,
      orders: orders
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error reading orders', error: err.message });
  }
});

// Save new order to data/orders.json
router.post('/orders', async (req, res) => {
  try {
    ensureOrdersFile();
    const orderData = req.body;

    if (!orderData.orderId || !orderData.items || !orderData.total) {
      return res.status(400).json({ success: false, message: 'Missing order details' });
    }

    const rawData = await fs.promises.readFile(ORDERS_FILE, 'utf8');
    const orders = JSON.parse(rawData || '[]');

    const newOrder = {
      orderId: orderData.orderId,
      orderDate: orderData.orderDate || new Date().toISOString(),
      customer: orderData.customer || { name: 'Student', phone: '', address: 'BML Munjal University' },
      items: orderData.items,
      subtotal: Number(orderData.subtotal) || 0,
      taxes: Number(orderData.taxes) || 0,
      total: Number(orderData.total) || 0,
      paymentMethod: orderData.paymentMethod || 'UPI',
      notes: orderData.notes || '',
      status: orderData.status || 'Order Placed',
      createdAt: new Date().toISOString()
    };

    orders.unshift(newOrder);
    await fs.promises.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');

    return res.status(201).json({
      success: true,
      message: `Saved order ${newOrder.orderId} to file`,
      order: newOrder
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error saving order to file', error: err.message });
  }
});

// Fetch single order by ID from orders.json
router.get('/orders/:id', async (req, res) => {
  try {
    ensureOrdersFile();
    const rawData = await fs.promises.readFile(ORDERS_FILE, 'utf8');
    const orders = JSON.parse(rawData || '[]');
    const found = orders.find(o => o.orderId.toLowerCase() === req.params.id.toLowerCase());

    if (!found) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.json({ success: true, order: found });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error reading order', error: err.message });
  }
});

module.exports = router;
