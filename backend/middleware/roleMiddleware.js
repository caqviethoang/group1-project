// middleware/roleMiddleware.js
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin có toàn quyền truy cập
    if (req.user.role === 'admin') {
      return next();
    }

    // Kiểm tra role của user
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Middleware cho từng role cụ thể
const requireAdmin = checkRole(['admin']);
const requireModerator = checkRole(['moderator', 'admin']);
const requireUser = checkRole(['user', 'moderator', 'admin']);

module.exports = {
  checkRole,
  requireAdmin,
  requireModerator,
  requireUser
};