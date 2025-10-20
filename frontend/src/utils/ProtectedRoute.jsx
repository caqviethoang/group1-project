import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requireAdmin = false, requireModerator = false }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check admin role
  if (requireAdmin && user?.role !== 'admin') {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        background: '#f8d7da',
        color: '#721c24',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h2>⛔ Access Denied</h2>
        <p>You need admin privileges to access this page.</p>
        <Navigate to="/dashboard" replace />
      </div>
    );
  }

  // Check moderator role
  if (requireModerator && !(user?.role === 'moderator' || user?.role === 'admin')) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        background: '#fff3cd',
        color: '#856404',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h2>⚠️ Access Restricted</h2>
        <p>You need moderator or admin privileges to access this page.</p>
        <Navigate to="/dashboard" replace />
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;