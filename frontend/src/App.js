// src/App.js
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getProfile } from './store/slices/authSlice';

// Components
import Auth from './components/Auth';
import AddUser from './components/AddUser';
import UserList from './components/UserList';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import ModeratorDashboard from './components/ModeratorDashboard';
import LogsManagement from './components/LogManagement';

// Utils
import ProtectedRoute from './utils/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Auto-fetch profile if token exists but user data is not loaded
    const token = localStorage.getItem('accessToken');
    if (token && !user && !loading) {
      dispatch(getProfile());
    }
  }, [isAuthenticated, user, loading, dispatch]);

  // Loading spinner
  if (loading && localStorage.getItem('accessToken')) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
          }
        `}</style>
      </div>
    );
  }

  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Routes>
          {/* Public Route - Auth */}
          <Route 
            path="/auth" 
            element={!isAuthenticated ? <Auth /> : <Navigate to="/dashboard" replace />} 
          />
          
          {/* Default redirect */}
          <Route 
            path="/" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />} 
          />

          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AddUser />
                  <UserList />
                </MainLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin>
                <MainLayout>
                  <AdminDashboard />
                </MainLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/moderator" 
            element={
              <ProtectedRoute requireModerator>
                <MainLayout>
                  <ModeratorDashboard />
                </MainLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/logs" 
            element={
              <ProtectedRoute requireAdmin>
                <MainLayout>
                  <LogsManagement />
                </MainLayout>
              </ProtectedRoute>
            } 
          />

          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Footer - Only show when authenticated */}
        {isAuthenticated && (
          <footer style={{
            backgroundColor: '#343a40',
            color: 'white',
            textAlign: 'center',
            padding: '20px',
            marginTop: '40px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              gap: '20px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🛠️</span>
                <span>React + Redux + JWT</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔄</span>
                <span>Redux State Management</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔐</span>
                <span>Protected Routes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>👤</span>
                <span>Role: {user?.role} {user?.role === 'admin' && '👑'} {user?.role === 'moderator' && '🛡️'}</span>
              </div>
            </div>
            <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem', opacity: 0.7 }}>
              © 2024 Group1 Project - Redux State Management
            </p>
          </footer>
        )}
      </div>
    </Router>
  );
}

export default App;