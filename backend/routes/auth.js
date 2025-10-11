// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { upload, handleUploadErrors } = require('../config/multer');
const router = express.Router();

// ==================== MIDDLEWARES ====================

// Middleware xác thực JWT
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Middleware phân quyền Admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

// ==================== AUTHENTICATION ENDPOINTS ====================

// POST /auth/signup - Đăng ký tài khoản
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;

    console.log('Signup attempt:', { name, email, passwordLength: password?.length, role });

    // Validation
    if (!name?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tên không được để trống' 
      });
    }

    if (!email?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email không được để trống' 
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mật khẩu phải có ít nhất 6 ký tự' 
      });
    }

    // Kiểm tra email tồn tại
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email đã được sử dụng' 
      });
    }

    // Tạo user mới - GỬI PASSWORD GỐC, pre-save hook sẽ hash
    const newUser = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password,
      role: role
    });

    await newUser.save();

    // Tạo JWT token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      { 
        userId: newUser._id,
        email: newUser.email,
        role: newUser.role
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      token: token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// POST /auth/login - Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('=== LOGIN DEBUG START ===');
    console.log('Raw request body:', req.body);
    console.log('Email received:', email);
    console.log('Password received:', password);
    console.log('Password length:', password?.length);

    // VALIDATION: Kiểm tra input
    if (!email?.trim()) {
      console.log('ERROR: Email is empty');
      return res.status(400).json({
        success: false,
        message: 'Email không được để trống'
      });
    }

    if (!password) {
      console.log('ERROR: Password is empty');
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu không được để trống'
      });
    }

    // Tìm user theo email
    const userEmail = email.trim().toLowerCase();
    console.log('Searching for user with email:', userEmail);
    
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('ERROR: User not found in database');
      return res.status(400).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    console.log('User found:', {
      id: user._id,
      name: user.name,
      email: user.email,
      hasPassword: !!user.password,
      passwordLength: user.password?.length,
      isActive: user.isActive
    });

    // Kiểm tra tài khoản active
    if (!user.isActive) {
      console.log('ERROR: User account is inactive');
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    // Kiểm tra password
    if (!user.password) {
      console.log('ERROR: User has no password in database');
      return res.status(400).json({
        success: false,
        message: 'Tài khoản không hợp lệ'
      });
    }

    console.log('Comparing passwords...');
    console.log('Input password:', `"${password}"`);
    console.log('Stored password hash:', user.password.substring(0, 20) + '...');
    
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      console.log('ERROR: Password does not match');
      // Debug thêm
      const testHash = await bcrypt.hash(password, 10);
      console.log('Test hash of input password:', testHash.substring(0, 20) + '...');
      console.log('Hashes identical:', user.password === testHash);
      
      return res.status(400).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    console.log('=== LOGIN SUCCESSFUL ===');
    
    // Tạo JWT token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// ==================== PASSWORD RESET ENDPOINTS ====================

// POST /auth/forgot-password - Quên mật khẩu
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('Forgot password request:', { email });

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email'
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    
    // Trả về thành công ngay cả khi email không tồn tại (bảo mật)
    if (!user) {
      return res.json({
        success: true,
        message: 'Nếu email tồn tại, chúng tôi đã gửi link reset password'
      });
    }

    // Tạo reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 phút
    
    await user.save();

    console.log('Reset token created for user:', user.email);

    // Trong development, trả về token trực tiếp
    res.json({
      success: true,
      message: 'Nếu email tồn tại, chúng tôi đã gửi link reset password',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
      resetUrl: `${process.env.CLIENT_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// POST /auth/reset-password/:token - Reset password
router.post('/reset-password/:token', async (req, res) => {
  try {
    let { token } = req.params;
    const { password } = req.body;

    // Fix token format nếu có vấn đề
    if (token.startsWith(':')) {
      token = token.substring(1);
    }

    console.log('Reset password attempt:', { token: token?.substring(0, 10) + '...', passwordLength: password?.length });

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    // Hash token để so sánh
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token reset password không hợp lệ hoặc đã hết hạn'
      });
    }

    // Cập nhật mật khẩu mới - GỬI PASSWORD GỐC, pre-save hook sẽ hash
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    console.log('Password reset successful for user:', user.email);

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// ==================== PROFILE ENDPOINTS ====================

// GET /auth/profile - Lấy thông tin profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// PUT /auth/profile - Cập nhật profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    console.log('Update profile request:', { name, email, currentPassword: !!currentPassword, newPassword: !!newPassword });

    // Cập nhật thông tin cơ bản
    if (name?.trim()) {
      user.name = name.trim();
    }

    // Kiểm tra email mới
    if (email?.trim() && email !== user.email) {
      const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }
      user.email = email.trim().toLowerCase();
    }

    // Đổi mật khẩu
    if (currentPassword && newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại không đúng'
        });
      }

      // GÁN PASSWORD MỚI, pre-save hook sẽ hash
      user.password = newPassword;
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      message: 'Cập nhật profile thành công',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// DELETE /auth/profile - Tự xóa tài khoản
router.delete('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Tài khoản đã được xóa thành công'
    });
  } catch (error) {
    console.error('Delete own account error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// ==================== AVATAR ENDPOINTS ====================

// POST /auth/upload-avatar - Upload avatar
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), handleUploadErrors, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file ảnh'
      });
    }

    console.log('Avatar upload successful:', {
      user: req.user.email,
      originalName: req.file.originalname,
      savedAs: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    const user = await User.findById(req.user._id);
    
    // Xóa avatar cũ nếu tồn tại
    if (user.avatar?.filename) {
      try {
        const fs = require('fs');
        const path = require('path');
        const oldFilePath = path.join(__dirname, '../uploads/avatars', user.avatar.filename);
        
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log('Deleted old avatar:', user.avatar.filename);
        }
      } catch (error) {
        console.error('Error deleting old avatar:', error);
      }
    }

    // Cập nhật avatar mới
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;
    
    user.avatar = {
      url: avatarUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date()
    };

    await user.save();

    res.json({
      success: true,
      message: 'Upload avatar thành công!',
      avatar: user.avatar
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// DELETE /auth/avatar - Xóa avatar
router.delete('/avatar', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.avatar?.filename) {
      return res.status(400).json({
        success: false,
        message: 'Không có avatar để xóa'
      });
    }

    const fs = require('fs');
    const path = require('path');
    
    // Xóa file từ server
    const filePath = path.join(__dirname, '../uploads/avatars', user.avatar.filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Deleted avatar file:', user.avatar.filename);
    } else {
      console.log('Avatar file not found:', filePath);
    }

    // Xóa thông tin avatar từ database
    user.avatar = undefined;
    await user.save();

    console.log('Avatar deleted for user:', user.email);

    res.json({
      success: true,
      message: 'Xóa avatar thành công!'
    });

  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// ==================== ADMIN ENDPOINTS ====================

// GET /auth/admin/users - Lấy danh sách users
router.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total: total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      users: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// GET /auth/admin/users/:id - Lấy thông tin user
router.get('/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// DELETE /auth/admin/users/:id - Xóa user
router.delete('/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // Không cho phép xóa chính mình
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể xóa tài khoản của chính mình'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Không cho phép xóa admin khác
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa tài khoản Admin'
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// PUT /auth/admin/users/:id/role - Cập nhật role
router.put('/admin/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "user" or "admin"'
      });
    }

    // Không cho phép thay đổi role của chính mình
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể thay đổi role của chính mình'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `Role updated to ${role} successfully`,
      user: user
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// PUT /auth/admin/users/:id/status - Cập nhật trạng thái
router.put('/admin/users/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const userId = req.params.id;

    // Không cho phép deactivate chính mình
    if (userId === req.user._id.toString() && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể vô hiệu hóa tài khoản của chính mình'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const statusText = isActive ? 'activated' : 'deactivated';
    res.json({
      success: true,
      message: `User ${statusText} successfully`,
      user: user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// ==================== UTILITY ENDPOINTS ====================

// GET /auth/verify - Xác thực token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      user: user,
      tokenValid: true
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// GET /auth/test - Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString()
  });
});

// GET /auth/debug-user/:email - Debug user
router.get('/debug-user/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        avatar: user.avatar,
        password: user.password ? `exists (length: ${user.password.length})` : 'NULL',
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET /auth/debug-all-users - Debug all users
router.get('/debug-all-users', async (req, res) => {
  try {
    const users = await User.find({}).select('name email role isActive avatar createdAt');
    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// POST /auth/test-password - Test password matching
router.post('/test-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    res.json({
      success: true,
      isMatch: isMatch,
      debug: {
        inputPassword: `"${password}"`,
        inputLength: password.length,
        storedHashLength: user.password.length,
        storedHashStart: user.password.substring(0, 20),
        userExists: true,
        userActive: user.isActive
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;