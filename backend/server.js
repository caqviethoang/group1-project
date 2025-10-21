// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
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
console.log('- NODE_ENV:', process.env.NODE_ENV);

// Security headers - QUAN TRỌNG cho production
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - TỐI ƯU CHO RENDER
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://group1-project-frontend.vercel.app', // Thay bằng domain Vercel thực tế
  'https://your-frontend-app.vercel.app' // Thay bằng domain của bạn
];

app.use(cors({
  origin: function (origin, callback) {
    // Cho phép requests không có origin (như mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Trong production, chỉ cho phép các origins được định nghĩa
      if (process.env.NODE_ENV === 'production') {
        callback(new Error('Not allowed by CORS'));
      } else {
        // Trong development, cho phép tất cả
        callback(null, true);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));

// Handle preflight requests
app.options('*', cors());

// Rate limiting - ĐẶT TRƯỚC body parser để tối ưu performance
app.use(apiRateLimiter);

// Body parser middleware với limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(logActivity);

// Serve static files từ thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('Static files served from:', path.join(__dirname, 'uploads'));

// Kết nối MongoDB với xử lý lỗi
connectDB();

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.once('open', async () => {
  try {
    const User = require('./models/User');
    await User.createSampleUsers();
    console.log('✅ Sample users created (if not exists)');
  } catch (error) {
    console.error('❌ Error creating sample users:', error);
  }
});

// Import routes
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');

// Use routes với rate limiting cho login
app.use('/auth/login', loginRateLimiter);
app.use('/users', userRoutes);
app.use('/auth', authRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Group1 Project API - MongoDB Integrated',
    database: 'MongoDB Atlas Connected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
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

// Health check endpoint - QUAN TRỌNG cho Render
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  
  // Nếu database disconnected, trả về 503
  if (dbStatus === 'Disconnected') {
    return res.status(503).json({
      status: 'Service Unavailable',
      database: 'Disconnected',
      timestamp: new Date().toISOString()
    });
  }
  
  res.json({ 
    status: 'OK',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
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
  
  // Xử lý CORS errors
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy: Origin not allowed'
    });
  }
  
  // Xử lý các loại lỗi khác nhau
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      error: error.message
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: 'The provided ID is not valid'
    });
  }
  
  // MongoDB duplicate key error
  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered',
      error: 'A user with this email already exists'
    });
  }
  
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
  console.log(`🌐 Render URL: https://group1-project-dsc3.onrender.com`);
  console.log(`📊 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'MISSING!'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Static files: https://group1-project-dsc3.onrender.com/uploads/`);
  console.log(`🔧 CORS: Enabled for defined origins`);
  console.log(`🛡️ Security: Helmet enabled`);
});