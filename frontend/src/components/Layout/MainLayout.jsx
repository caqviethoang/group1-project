import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://26.178.21.116:3000';

const MainLayout = ({ children }) => {
  const { user, logout, isAdmin, isModerator } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const accessToken = localStorage.getItem('accessToken');
      
      if (refreshToken && accessToken) {
        await axios.post(`${API_BASE_URL}/auth/logout`, {
          refreshToken
        }, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      logout();
      navigate('/auth');
    }
  };

  const navItems = [
    { path: '/dashboard', label: '📊 Dashboard', show: true },
    { path: '/admin', label: '👑 Admin', show: isAdmin },
    { path: '/moderator', label: '🛡️ Moderator', show: isModerator },
    { path: '/logs', label: '📋 Logs', show: isAdmin },
    { path: '/profile', label: '👤 Profile', show: true }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <header style={{
        backgroundColor: '#282c34',
        padding: '20px',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '600' }}>
            Quản lý Users - Redux + JWT
          </h1>
          <p style={{ 
            margin: '5px 0 0 0', 
            fontSize: '1rem', 
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <span>🔄 Redux State Management</span>
            {isAdmin && <span style={{ marginLeft: '10px' }}>| 👑 Admin Mode</span>}
          </p>
        </div>
        
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '20px',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          {/* User Info */}
          <div style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: '8px 16px',
            borderRadius: '20px'
          }}>
            {user?.avatar?.url ? (
              <img 
                src={user.avatar.url} 
                alt="Avatar"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#667eea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                👋 {user?.name}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                {user?.email}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: '8px',
            borderRadius: '8px'
          }}>
            {navItems.map(item => 
              item.show && (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: location.pathname === item.path ? '#667eea' : 'transparent',
                    color: 'white',
                    border: `1px solid ${location.pathname === item.path ? '#667eea' : 'rgba(255,255,255,0.3)'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                    fontWeight: location.pathname === item.path ? '600' : '400'
                  }}
                  onMouseOver={(e) => {
                    if (location.pathname !== item.path) {
                      e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (location.pathname !== item.path) {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {item.label}
                </button>
              )
            )}
          </nav>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
          >
            🚪 Đăng xuất
          </button>
        </div>
      </header>
      
      <main style={{ minHeight: 'calc(100vh - 120px)', padding: '20px' }}>
        {children}
      </main>

      {/* Footer */}
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
            <span>Role: {user?.role} {isAdmin && '👑'} {user?.role === 'moderator' && '🛡️'}</span>
          </div>
        </div>
        <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem', opacity: 0.7 }}>
          © 2024 Group1 Project - Redux State Management
        </p>
      </footer>
    </div>
  );
};

export default MainLayout;