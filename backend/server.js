// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/database');
const mongoose = require('mongoose');
const cors = require('cors');
const { logActivity } = require('./middleware/logMiddleware');
const { loginRateLimiter, apiRateLimiter } = require('./middleware/rateLimitMiddleware');

const app = express();

// Kiểm tra environment variables
console.log('Environment check:');
console.log('- PORT:', process.env.PORT);
console.log('- JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);

// Kết nối MongoDB
connectDB();

mongoose.connection.once('open', async () => {
  try {
    const User = require('./models/User');
    await User.createSampleUsers();
    console.log('✅ Sample users created (if not exists)');
  } catch (error) {
    console.error('❌ Error creating sample users:', error);
  }
});

// CORS configuration - SỬA LẠI
app.use(cors({
  origin: true, // Cho phép tất cả origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));

// Handle preflight requests
app.options('*', cors());

// Body parser middleware
app.use(express.json());

// Rate limiting - nên đặt sau body parser
app.use(apiRateLimiter); // Rate limiting chung

// Logging middleware
app.use(logActivity);

// Serve static files từ thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('Static files served from:', path.join(__dirname, 'uploads'));

// Import routes
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');

// Use routes
app.use('/auth/login', loginRateLimiter);
app.use('/users', userRoutes);
app.use('/auth', authRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Group1 Project API - MongoDB Integrated',
    database: 'MongoDB Atlas Connected',
    timestamp: new Date().toISOString(),
    endpoints: {
      // User endpoints
      getUsers: 'GET /users',
      getUser: 'GET /users/:id',
      createUser: 'POST /users',
      updateUser: 'PUT /users/:id',
      deleteUser: 'DELETE /users/:id',
      
      // Auth endpoints
      signup: 'POST /auth/signup',
      login: 'POST /auth/login',
      verify: 'GET /auth/verify',
      profile: 'GET /auth/profile',
      updateProfile: 'PUT /auth/profile',
      uploadAvatar: 'POST /auth/upload-avatar',
      deleteAvatar: 'DELETE /auth/avatar',
      forgotPassword: 'POST /auth/forgot-password',
      resetPassword: 'POST /auth/reset-password/:token',
      
      // Debug endpoints
      health: 'GET /health'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    jwtSecret: !!process.env.JWT_SECRET ? 'Configured' : 'Missing',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    availableRoutes: {
      users: '/users',
      auth: '/auth',
      health: '/health',
      root: '/'
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://26.178.21.116:${PORT}`);
  console.log(`📊 MongoDB: Connected to groupDB`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'MISSING!'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Static files: http://localhost:${PORT}/uploads/`);
  console.log(`🔧 CORS: Enabled for all origins`);
});