// models/Log.js
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login_success', 'login_failed', 'logout', 
      'profile_update', 'password_change', 'avatar_upload',
      'user_created', 'user_updated', 'user_deleted',
      'role_updated', 'status_updated'
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

// Static method to log activity
logSchema.statics.logActivity = async function(userId, action, ipAddress, userAgent = '', details = {}) {
  try {
    const log = new this({
      userId,
      action,
      ipAddress,
      userAgent,
      details
    });
    await log.save();
    console.log(`📝 Activity logged: ${action} for user ${userId}`);
    return log;
  } catch (error) {
    console.error('❌ Error logging activity:', error);
  }
};

module.exports = mongoose.model('Log', logSchema);