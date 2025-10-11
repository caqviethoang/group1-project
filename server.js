require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');

const app = express();

// Kết nối MongoDB
connectDB();

// Thêm CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(express.json());

// Import routes
const userRoutes = require('./routes/user');

// Use routes
app.use('/users', userRoutes);

// Default route - Hiển thị thông tin API
app.get('/', (req, res) => {
  res.json({ 
    message: 'Group1 Project API - MongoDB Integrated',
    database: 'MongoDB Atlas Connected',
    timestamp: new Date().toISOString(),
    endpoints: {
      getUsers: 'GET /users',
      getUser: 'GET /users/:id',
      createUser: 'POST /users',
      updateUser: 'PUT /users/:id',
      deleteUser: 'DELETE /users/:id'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://26.178.21.116:${PORT}`);
  console.log(`📊 MongoDB: Connected to groupDB`);
});