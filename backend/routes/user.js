const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET /users - Lấy danh sách tất cả users
router.get('/', userController.getAllUsers);

// GET /users/:id - Lấy user theo ID
router.get('/:id', userController.getUserById);

// POST /users - Tạo user mới
router.post('/', userController.createUser);

// PUT /users/:id - Cập nhật user
router.put('/:id', userController.updateUser);

// DELETE /users/:id - Xóa user
router.delete('/:id', userController.deleteUser);

module.exports = router;