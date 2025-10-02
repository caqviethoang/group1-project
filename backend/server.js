const express = require('express');
const app = express();

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

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Group1 Project API',
    endpoints: {
      getUsers: 'GET /users',
      createUser: 'POST /users'
    }
  });
});

// Chạy server trên mọi interface (0.0.0.0) thay vì localhost
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access via:`);
  console.log(`- Local: http://localhost:${PORT}`);
  console.log(`- Network: http://YOUR_BACKEND_IP:${PORT}`);
});