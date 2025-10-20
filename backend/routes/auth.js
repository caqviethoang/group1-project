// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { upload, handleUploadErrors } = require('../config/multer');
const router = express.Router();
const { requireAdmin, requireModerator } = require('../middleware/roleMiddleware');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const Log = require('../models/Log');

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

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    
    // Kiểm tra token type
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

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

    // Kiểm tra token bị revoke (nếu user logout all)
    if (user.lastLogoutAt && decoded.iat * 1000 < user.lastLogoutAt.getTime()) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token đã hết hạn'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    res.status(401).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

// ==================== HELPER FUNCTIONS ====================

// Helper function để tạo tokens
const generateTokens = (user) => {
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret';
  
  // Access Token (15 phút)
  const accessToken = jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      role: user.role,
      type: 'access'
    },
    jwtSecret,
    { expiresIn: '15m' }
  );
  
  // Refresh Token (7 ngày)
  const refreshToken = jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      type: 'refresh',
      sessionId: crypto.randomBytes(16).toString('hex')
    },
    refreshSecret,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
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

    // Tạo tokens (access + refresh)
    const tokens = generateTokens(newUser);
    await newUser.addRefreshToken(tokens.refreshToken);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
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
      
      // Ghi log login failed
      const ipAddress = req.ip || req.connection.remoteAddress;
      await Log.logActivity(
        null,
        'login_failed',
        ipAddress,
        req.get('User-Agent') || '',
        {
          email: email,
          reason: 'Email is empty'
        }
      );
      
      return res.status(400).json({
        success: false,
        message: 'Email không được để trống'
      });
    }

    if (!password) {
      console.log('ERROR: Password is empty');
      
      // Ghi log login failed
      const ipAddress = req.ip || req.connection.remoteAddress;
      await Log.logActivity(
        null,
        'login_failed',
        ipAddress,
        req.get('User-Agent') || '',
        {
          email: email,
          reason: 'Password is empty'
        }
      );
      
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
      
      // Ghi log login failed
      const ipAddress = req.ip || req.connection.remoteAddress;
      await Log.logActivity(
        null,
        'login_failed',
        ipAddress,
        req.get('User-Agent') || '',
        {
          email: email,
          reason: 'User not found'
        }
      );
      
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
      
      // Ghi log login failed
      const ipAddress = req.ip || req.connection.remoteAddress;
      await Log.logActivity(
        user._id,
        'login_failed',
        ipAddress,
        req.get('User-Agent') || '',
        {
          email: email,
          reason: 'Account inactive',
          userId: user._id
        }
      );
      
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    // Kiểm tra password
    if (!user.password) {
      console.log('ERROR: User has no password in database');
      
      // Ghi log login failed
      const ipAddress = req.ip || req.connection.remoteAddress;
      await Log.logActivity(
        user._id,
        'login_failed',
        ipAddress,
        req.get('User-Agent') || '',
        {
          email: email,
          reason: 'No password in database',
          userId: user._id
        }
      );
      
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
      
      // Ghi log login failed
      const ipAddress = req.ip || req.connection.remoteAddress;
      await Log.logActivity(
        user._id,
        'login_failed',
        ipAddress,
        req.get('User-Agent') || '',
        {
          email: email,
          reason: 'Invalid password',
          userId: user._id
        }
      );
      
      return res.status(400).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    console.log('=== LOGIN SUCCESSFUL ===');
    
    // Tạo tokens (access + refresh)
    const tokens = generateTokens(user);
    await user.addRefreshToken(tokens.refreshToken);

    // Ghi log login success
    const ipAddress = req.ip || req.connection.remoteAddress;
    await Log.logActivity(
      user._id,
      'login_success',
      ipAddress,
      req.get('User-Agent') || '',
      {
        loginMethod: 'email_password'
      }
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
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

// ==================== REFRESH TOKEN ENDPOINTS ====================

// POST /auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không được cung cấp'
      });
    }

    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret';
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, refreshSecret);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Tìm user và kiểm tra refresh token
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User không tồn tại hoặc đã bị vô hiệu hóa'
      });
    }

    // Kiểm tra refresh token có trong database không
    if (!user.isValidRefreshToken(refreshToken)) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không hợp lệ'
      });
    }

    // Tạo tokens mới
    const tokens = generateTokens(user);
    
    // Lưu refresh token mới
    await user.addRefreshToken(tokens.refreshToken);

    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token đã hết hạn'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// ==================== LOGOUT ENDPOINTS ====================

// POST /auth/logout - Logout (revoke current token)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = req.user;

    // Xóa refresh token cụ thể nếu được cung cấp
    if (refreshToken) {
      await user.removeRefreshToken(refreshToken);
    }

    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// POST /auth/logout-all - Logout từ tất cả thiết bị
router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Xóa tất cả refresh tokens
    await user.clearAllRefreshTokens();

    res.json({
      success: true,
      message: 'Đã đăng xuất từ tất cả thiết bị'
    });

  } catch (error) {
    console.error('Logout all error:', error);
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

// POST /auth/upload-avatar - Upload avatar lên Cloudinary
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), handleUploadErrors, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file ảnh'
      });
    }

    console.log('File received:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      user: req.user.email
    });

    const user = await User.findById(req.user._id);
    
    // Xóa avatar cũ từ Cloudinary nếu tồn tại
    if (user.avatar?.public_id) {
      try {
        await deleteFromCloudinary(user.avatar.public_id);
        console.log('Deleted old avatar from Cloudinary');
      } catch (error) {
        console.error('Error deleting old avatar:', error);
      }
    }

    // Upload ảnh mới lên Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      public_id: `avatar_${user._id}_${Date.now()}`
    });

    console.log('Cloudinary upload result:', {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      size: uploadResult.bytes
    });

    // Cập nhật avatar mới với Cloudinary info
    user.avatar = {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: uploadResult.bytes,
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
      message: 'Lỗi upload ảnh: ' + error.message
    });
  }
});

// DELETE /auth/avatar - Xóa avatar từ Cloudinary
router.delete('/avatar', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.avatar?.public_id) {
      return res.status(400).json({
        success: false,
        message: 'Không có avatar để xóa'
      });
    }

    // Xóa avatar từ Cloudinary
    await deleteFromCloudinary(user.avatar.public_id);

    // Xóa thông tin avatar từ database
    user.avatar = undefined;
    await user.save();

    console.log('Avatar deleted from Cloudinary for user:', user.email);

    res.json({
      success: true,
      message: 'Xóa avatar thành công!'
    });

  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa avatar: ' + error.message
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

// ==================== LOG MANAGEMENT ENDPOINTS ====================

// GET /auth/admin/logs - Lấy logs (Admin only)
router.get('/admin/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      action, 
      userId, 
      startDate, 
      endDate,
      ipAddress 
    } = req.query;

    const query = {};
    
    // Filter by action
    if (action) {
      query.action = action;
    }
    
    // Filter by user ID
    if (userId) {
      query.userId = userId;
    }
    
    // Filter by IP address
    if (ipAddress) {
      query.ipAddress = { $regex: ipAddress, $options: 'i' };
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await Log.find(query)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Log.countDocuments(query);

    // Thống kê actions
    const actionStats = await Log.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      count: logs.length,
      total: total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      logs: logs,
      stats: {
        actions: actionStats,
        period: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// GET /auth/admin/logs/stats - Thống kê logs
router.get('/admin/logs/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const stats = await Log.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            action: '$action',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.action',
          dailyStats: {
            $push: {
              date: '$_id.date',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Top IP addresses
    const topIPs = await Log.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$ipAddress',
          count: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Top users
    const topUsers = await Log.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
          userId: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          'user.password': 0
        }
      }
    ]);

    res.json({
      success: true,
      period: {
        days: parseInt(days),
        startDate: startDate,
        endDate: new Date()
      },
      stats: stats,
      topIPs: topIPs,
      topUsers: topUsers
    });
  } catch (error) {
    console.error('Get logs stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

module.exports = router;