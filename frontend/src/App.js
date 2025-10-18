// src/App.js
import React, { useState, useEffect } from 'react';
import AddUser from './components/AddUser';
import UserList from './components/UserList';
import Auth from './components/Auth';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [refresh, setRefresh] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'profile', 'admin'

  useEffect(() => {
    // Kiểm tra token khi component mount
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleUserAdded = () => {
    setRefresh(!refresh);
  };

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    setCurrentView('dashboard');
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const isAdmin = user?.role === 'admin';

  // Navigation items
  const navItems = [
    { key: 'dashboard', label: '📊 Dashboard', show: true },
    { key: 'admin', label: '👑 Admin', show: isAdmin },
    { key: 'profile', label: '👤 Profile', show: true }
  ];

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
            Quản lý Users - Group1 Project
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
            <span>🚀 Kết nối MongoDB Atlas</span>
            {isAdmin && <span style={{ marginLeft: '10px' }}>| 👑 Admin Mode</span>}
          </p>
        </div>
        
        {isAuthenticated && (
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
                  👋 Xin chào, {user?.name}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                  {user?.email}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div style={{ 
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
                    key={item.key}
                    onClick={() => setCurrentView(item.key)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: currentView === item.key ? '#667eea' : 'transparent',
                      color: 'white',
                      border: `1px solid ${currentView === item.key ? '#667eea' : 'rgba(255,255,255,0.3)'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                      fontWeight: currentView === item.key ? '600' : '400'
                    }}
                    onMouseOver={(e) => {
                      if (currentView !== item.key) {
                        e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (currentView !== item.key) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {item.label}
                  </button>
                )
              )}
            </div>

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
        )}
      </header>
      
      <main style={{ minHeight: 'calc(100vh - 120px)', padding: '20px' }}>
        {!isAuthenticated ? (
          <Auth onLogin={handleLogin} />
        ) : currentView === 'profile' ? (
          <Profile onProfileUpdate={handleProfileUpdate} />
        ) : currentView === 'admin' ? (
          <AdminDashboard />
        ) : (
          <>
            <AddUser onUserAdded={handleUserAdded} />
            <UserList key={refresh} />
          </>
        )}
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
            <span>Built with React & Node.js</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🗄️</span>
            <span>MongoDB Atlas</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔐</span>
            <span>JWT Authentication</span>
          </div>
          {isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👤</span>
              <span>Role: {user?.role}</span>
            </div>
          )}
        </div>
        <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem', opacity: 0.7 }}>
          © 2024 Group1 Project - Quản lý Users System
        </p>
      </footer>
    </div>
  );
}

export default App;