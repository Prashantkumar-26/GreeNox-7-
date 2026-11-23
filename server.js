require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const externalApiRoutes = require('./routes/externalApiRoutes');
const jsonRoutes = require('./routes/jsonRoutes');
const mongoDishRoutes = require('./routes/mongoDishRoutes');
const mongoOrderRoutes = require('./routes/mongoOrderRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/greenox';

// Core middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for debugging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.originalUrl.startsWith('/api')) {
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now() - start}ms)`);
    }
  });
  next();
});

// Serve frontend files
app.use(express.static(__dirname));

// Route handlers
app.use('/api/external', externalApiRoutes);
app.use('/api/json', jsonRoutes);
app.use('/api/dishes', mongoDishRoutes);
app.use('/api/orders', mongoOrderRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'online',
    database: isConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// 404 for unknown api routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong'
  });
});

// Connect to database and start server
async function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`GreeNox server running on http://localhost:${PORT}`);
  });

  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 6000 });
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.warn('MongoDB connection note:', err.message);
    console.log('Running with local JSON fallback support enabled');
  }

  return server;
}

startServer();

module.exports = app;
