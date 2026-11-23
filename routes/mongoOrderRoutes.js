const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Ensure database connection
function requireMongo(req, res, next) {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database is offline'
    });
  }
  next();
}

// Place a new order
router.post('/', requireMongo, async (req, res) => {
  try {
    const { orderId, orderDate, customer, items, subtotal, taxes, total, paymentMethod, notes, status } = req.body;

    if (!orderId || !customer || !items || items.length === 0 || total === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required order details' });
    }

    const existing = await Order.findOne({ orderId: orderId.trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Order ID already exists' });
    }

    const order = new Order({
      orderId: orderId.trim(),
      orderDate: orderDate ? new Date(orderDate) : new Date(),
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        address: customer.address.trim()
      },
      items: items.map(it => ({
        name: it.name,
        price: Number(it.price),
        quantity: Number(it.quantity)
      })),
      subtotal: Number(subtotal) || 0,
      taxes: Number(taxes) || 0,
      total: Number(total),
      paymentMethod: paymentMethod || 'UPI',
      notes: notes || '',
      status: status || 'Order Placed'
    });

    const savedOrder = await order.save();
    return res.status(201).json({ success: true, message: 'Order placed successfully', order: savedOrder });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not create order', error: err.message });
  }
});

// Fetch all orders
router.get('/', requireMongo, async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not fetch orders', error: err.message });
  }
});

// Fetch single order by ID
router.get('/:id', requireMongo, async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const order = isObjectId ? await Order.findById(id) : await Order.findOne({ orderId: new RegExp(`^${id.trim()}$`, 'i') });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    return res.json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not retrieve order', error: err.message });
  }
});

// Update order delivery status
router.patch('/:id/status', requireMongo, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['Order Placed', 'In Kitchen', 'Out for Delivery', 'Delivered', 'Cancelled'];

    if (!status || !valid.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${valid.join(', ')}` });
    }

    const { id } = req.params;
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: id } : { orderId: new RegExp(`^${id.trim()}$`, 'i') };

    const order = await Order.findOneAndUpdate(query, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.json({ success: true, message: `Status updated to ${status}`, order });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not update status', error: err.message });
  }
});

// Cancel / delete order
router.delete('/:id', requireMongo, async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: id } : { orderId: new RegExp(`^${id.trim()}$`, 'i') };

    const deleted = await Order.findOneAndDelete(query);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.json({ success: true, message: `Deleted order ${deleted.orderId}`, deletedOrder: deleted });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not delete order', error: err.message });
  }
});

module.exports = router;
