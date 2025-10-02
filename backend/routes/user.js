const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET /users - Lấy danh sách tất cả users
router.get('/', userController.getAllUsers);

// POST /users - Tạo user mới
router.post('/', userController.createUser);

module.exports = router;