const express = require('express');
const app = express();

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));