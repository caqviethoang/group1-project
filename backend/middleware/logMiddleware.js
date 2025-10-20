// middleware/logMiddleware.js
const Log = require('../models/Log');

// Middleware để ghi log activity
const logActivity = async (req, res, next) => {
  // Chỉ ghi log cho các route đã xác thực hoặc auth routes
  if (req.path.startsWith('/auth') || req.user) {
    const action = determineAction(req);
    
    if (action) {
      // Lấy IP address
      const ipAddress = req.ip || 
                       req.connection.remoteAddress || 
                       req.socket.remoteAddress ||
                       (req.connection.socket ? req.connection.socket.remoteAddress : null);
      
      // Lấy user agent
      const userAgent = req.get('User-Agent') || '';
      
      // Thông tin chi tiết
      const details = {
        method: req.method,
        path: req.path,
        ...getActionDetails(req, action)
      };

      // Ghi log (bất đồng bộ, không chờ kết quả)
      Log.logActivity(
        req.user ? req.user._id : null, // null cho login failed
        action,
        ipAddress,
        userAgent,
        details
      ).catch(console.error);
    }
  }
  
  next();
};

// Xác định action dựa trên request
function determineAction(req) {
  const path = req.path;
  const method = req.method;

  // Auth actions
  if (path === '/auth/login' && method === 'POST') {
    return req.body.email ? 'login_failed' : null; // Sẽ được cập nhật trong controller
  }
  if (path === '/auth/logout' && method === 'POST') return 'logout';
  if (path === '/auth/forgot-password' && method === 'POST') return 'password_reset_request';
  
  // Profile actions
  if (path === '/auth/profile' && method === 'PUT') return 'profile_update';
  if (path === '/auth/upload-avatar' && method === 'POST') return 'avatar_upload';
  if (path === '/auth/profile' && method === 'DELETE') return 'account_deleted';
  
  // Admin actions
  if (path.startsWith('/auth/admin/users')) {
    if (method === 'POST') return 'user_created';
    if (method === 'PUT') {
      if (path.includes('/role')) return 'role_updated';
      if (path.includes('/status')) return 'status_updated';
      return 'user_updated';
    }
    if (method === 'DELETE') return 'user_deleted';
  }

  return null;
}

// Lấy thông tin chi tiết cho action
function getActionDetails(req, action) {
  const details = {};
  
  switch (action) {
    case 'login_failed':
      details.email = req.body.email;
      details.reason = 'Invalid credentials';
      break;
    case 'user_created':
    case 'user_updated':
    case 'user_deleted':
      details.targetUserId = req.params.id;
      break;
    case 'role_updated':
      details.targetUserId = req.params.id;
      details.newRole = req.body.role;
      break;
    case 'status_updated':
      details.targetUserId = req.params.id;
      details.newStatus = req.body.isActive;
      break;
  }
  
  return details;
}

module.exports = { logActivity };