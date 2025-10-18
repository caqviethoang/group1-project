// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  avatar: {
    url: String,
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    uploadedAt: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date
  }],
  lastLogoutAt: Date
}, {
  timestamps: true
});

// Middleware để đảm bảo password luôn được hash trước khi save
userSchema.pre('save', async function(next) {
  // CHỈ hash password khi nó được modified và không phải đã được hash
  if (!this.isModified('password')) return next();
  
  try {
    // Kiểm tra nếu password chưa được hash (không bắt đầu với $2b$)
    if (this.password && !this.password.startsWith('$2b$')) {
      const bcrypt = require('bcryptjs');
      const saltRounds = 10;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Loại bỏ password khi chuyển thành JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  delete user.refreshTokens;
  return user;
};

// Tạo reset token
userSchema.methods.getResetPasswordToken = function() {
  const crypto = require('crypto');
  
  // Tạo token
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Hash và set resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set thời gian hết hạn (10 phút)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

userSchema.methods.hasRole = function(role) {
  const roleHierarchy = {
    'user': 1,
    'moderator': 2, 
    'admin': 3
  };
  return roleHierarchy[this.role] >= roleHierarchy[role];
};

userSchema.statics.createSampleUsers = async function() {
  const users = [
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    },
    {
      name: 'Moderator User', 
      email: 'moderator@example.com',
      password: 'moderator123',
      role: 'moderator'
    },
    {
      name: 'Regular User',
      email: 'user@example.com', 
      password: 'user123',
      role: 'user'
    }
  ];
  for (const userData of users) {
    const existingUser = await this.findOne({ email: userData.email });
    if (!existingUser) {
      const user = new this(userData);
      await user.save();
      console.log(`✅ Created sample user: ${userData.email} (${userData.role})`);
    }
  }
};

// Thêm method để thêm refresh token
userSchema.methods.addRefreshToken = function(token, expiresIn = '7d') {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 ngày
  
  this.refreshTokens.push({
    token,
    expiresAt
  });
  
  // Giữ chỉ 5 token gần nhất
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
  
  return this.save();
};

// Thêm method để xóa refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(t => t.token !== token);
  return this.save();
};

// Thêm method để xóa tất cả refresh tokens
userSchema.methods.clearAllRefreshTokens = function() {
  this.refreshTokens = [];
  this.lastLogoutAt = new Date();
  return this.save();
};

// Thêm method để kiểm tra token hợp lệ
userSchema.methods.isValidRefreshToken = function(token) {
  const tokenData = this.refreshTokens.find(t => t.token === token);
  if (!tokenData) return false;
  
  return new Date() < new Date(tokenData.expiresAt);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
// Các phương thức quản lý refresh token cho User model

// Thêm method để thêm refresh token
userSchema.methods.addRefreshToken = function(token, expiresIn = '7d') {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 ngày
  
  this.refreshTokens.push({
    token,
    expiresAt
  });
  
  // Giữ chỉ 5 token gần nhất
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
  
  return this.save();
};

// Thêm method để xóa refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(t => t.token !== token);
  return this.save();
};

// Thêm method để xóa tất cả refresh tokens
userSchema.methods.clearAllRefreshTokens = function() {
  this.refreshTokens = [];
  this.lastLogoutAt = new Date();
  return this.save();
};

// Thêm method để kiểm tra token hợp lệ
userSchema.methods.isValidRefreshToken = function(token) {
  const tokenData = this.refreshTokens.find(t => t.token === token);
  if (!tokenData) return false;
  
  return new Date() < new Date(tokenData.expiresAt);
};