const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    orderDate: {
      type: Date,
      default: Date.now
    },
    customer: {
      name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
      },
      phone: {
        type: String,
        required: [true, 'Customer phone is required'],
        trim: true
      },
      address: {
        type: String,
        required: [true, 'Delivery address is required'],
        trim: true
      }
    },
    items: {
      type: [orderItemSchema],
      validate: [val => val.length > 0, 'Order must contain at least one item']
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    taxes: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      default: 'UPI'
    },
    notes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['Order Placed', 'In Kitchen', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Order Placed'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);
