// models/Log.js
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // SỬA: đổi thành không bắt buộc
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login_success', 'login_failed', 'logout', 
      'profile_update', 'password_change', 'avatar_upload',
      'user_created', 'user_updated', 'user_deleted',
      'role_updated', 'status_updated',
      'login_bruteforce_blocked', 'refresh_token', // THÊM các giá trị mới
      'token_expired', 'invalid_token', 'rate_limit_exceeded'
    ]
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  details: {
    type: Object,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
logSchema.index({ userId: 1, timestamp: -1 });
logSchema.index({ action: 1, timestamp: -1 });
logSchema.index({ ipAddress: 1, timestamp: -1 });

// Static method to log activity - SỬA: xử lý lỗi tốt hơn
logSchema.statics.logActivity = async function(userId, action, ipAddress, userAgent = '', details = {}) {
  try {
    // Validate action
    const validActions = [
      'login_success', 'login_failed', 'logout', 
      'profile_update', 'password_change', 'avatar_upload',
      'user_created', 'user_updated', 'user_deleted',
      'role_updated', 'status_updated',
      'login_bruteforce_blocked', 'refresh_token',
      'token_expired', 'invalid_token', 'rate_limit_exceeded'
    ];
    
    if (!validActions.includes(action)) {
      console.warn(`⚠️ Invalid log action: ${action}, using 'login_failed' instead`);
      action = 'login_failed';
    }

    const log = new this({
      userId: userId || null, // Cho phép null
      action,
      ipAddress: ipAddress || 'unknown',
      userAgent,
      details
    });
    
    await log.save();
    console.log(`📝 Activity logged: ${action} for user ${userId || 'unknown'}`);
    return log;
  } catch (error) {
    console.error('❌ Error logging activity:', error);
    // Không throw error để không làm gián đoạn flow chính
    return null;
  }
};

module.exports = mongoose.model('Log', logSchema);