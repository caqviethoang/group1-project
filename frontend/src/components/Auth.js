// src/components/Auth.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ForgotPassword from './ForgotPassword';

const API_BASE_URL = 'http://26.178.21.116:3000';

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [errors, setErrors] = useState({});
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    try {
      console.log('🔍 Testing connection to:', `${API_BASE_URL}/health`);
      
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 10000
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📦 Response data:', response.data);
      
      // SỬA: Kiểm tra status thay vì success
      if (response.data.status === 'OK' && response.data.database === 'Connected') {
        setApiStatus('connected');
        console.log('🎉 API Connection Successful!');
      } else {
        setApiStatus('error');
        console.log('⚠️ API responded but with error status');
      }
    } catch (error) {
      console.error('💥 API connection error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Hiển thị chi tiết lỗi
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ Connection refused - Backend not reachable');
      } else if (error.code === 'NETWORK_ERROR') {
        console.error('❌ Network error - Check VPN/firewall');
      } else if (error.response) {
        console.error(`❌ Backend error: ${error.response.status}`);
      }
      
      setApiStatus('error');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate name (chỉ cho đăng ký)
    if (!isLogin && !formData.name.trim()) {
      newErrors.name = 'Tên không được để trống';
    } else if (!isLogin && formData.name.trim().length > 50) {
      newErrors.name = 'Tên không được vượt quá 50 ký tự';
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Validate password
    if (!formData.password.trim()) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    // Validate confirm password (chỉ cho đăng ký)
    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }

    // Clear message when user starts typing
    if (message) {
      setMessage('');
      setMessageType('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const userData = isLogin 
        ? {
            email: formData.email.trim().toLowerCase(),
            password: formData.password 
          }
        : { 
            name: formData.name.trim(), 
            email: formData.email.trim().toLowerCase(), 
            password: formData.password 
          };

      console.log('🔄 Sending auth request to:', endpoint);
      console.log('📧 Email:', userData.email);

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, userData);
      console.log('✅ Auth response received:', response.data);
      
      if (response.data.success) {
        if (isLogin) {
          console.log('🔑 Tokens received:', {
            accessToken: response.data.accessToken ? 'Yes' : 'No',
            refreshToken: response.data.refreshToken ? 'Yes' : 'No'
          });
          
          // Gọi onLogin với cả accessToken và refreshToken
          onLogin(
            response.data.accessToken, 
            response.data.refreshToken, 
            response.data.user
          );
          
          setMessage('✅ Đăng nhập thành công!');
          setMessageType('success');
        } else {
          setMessage('✅ Đăng ký thành công! Vui lòng đăng nhập.');
          setMessageType('success');
          setIsLogin(true);
          setFormData({ 
            name: '', 
            email: '', 
            password: '', 
            confirmPassword: '' 
          });
        }
        setErrors({});
      } else {
        throw new Error(response.data.message);
      }

    } catch (error) {
      console.error('❌ Auth error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = isLogin ? 'Lỗi khi đăng nhập' : 'Lỗi khi đăng ký';
      
      if (error.response && error.response.data) {
        errorMessage = `❌ ${error.response.data.message || errorMessage}`;
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = '❌ Không thể kết nối đến server';
      } else {
        errorMessage = `❌ ${error.message}`;
      }
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ 
      name: '', 
      email: '', 
      password: '', 
      confirmPassword: '' 
    });
    setErrors({});
    setMessage('');
    setMessageType('');
    setShowForgotPassword(false);
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setMessage('');
    setMessageType('');
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setMessage('');
    setMessageType('');
  };

  if (showForgotPassword) {
    return <ForgotPassword onBackToLogin={handleBackToLogin} />;
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: '80vh', 
      padding: '20px' 
    }}>
      <div style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', 
        width: '100%', 
        maxWidth: '400px' 
      }}>
        {/* API Status Indicator */}
        <div style={{
          padding: '10px',
          borderRadius: '6px',
          marginBottom: '20px',
          textAlign: 'center',
          fontWeight: '500',
          backgroundColor: apiStatus === 'connected' ? '#d4edda' : 
                         apiStatus === 'error' ? '#f8d7da' : '#fff3cd',
          color: apiStatus === 'connected' ? '#155724' : 
                apiStatus === 'error' ? '#721c24' : '#856404',
          border: `1px solid ${
            apiStatus === 'connected' ? '#c3e6cb' : 
            apiStatus === 'error' ? '#f5c6cb' : '#ffeaa7'
          }`
        }}>
          {apiStatus === 'connected' && '✅ Đã kết nối với server'}
          {apiStatus === 'error' && '❌ Không thể kết nối với server'}
          {apiStatus === 'checking' && '⏳ Đang kiểm tra kết nối...'}
          <br />
          <small style={{ fontSize: '0.8rem', opacity: 0.8 }}>
            Backend: 26.178.21.116:3000
          </small>
        </div>

        <h2 style={{ textAlign: 'center', marginBottom: '10px', color: '#333' }}>
          {isLogin ? '🔐 Đăng nhập' : '👤 Đăng ký tài khoản'}
        </h2>
        
        <p style={{ 
          color: '#666', 
          marginBottom: '25px', 
          textAlign: 'center',
          fontSize: '0.95rem'
        }}>
          {isLogin 
            ? 'Nhập thông tin đăng nhập để truy cập hệ thống' 
            : 'Tạo tài khoản mới để bắt đầu sử dụng hệ thống'
          }
        </p>
        
        {message && (
          <div style={{ 
            padding: '12px', 
            borderRadius: '6px', 
            marginBottom: '15px', 
            textAlign: 'center',
            backgroundColor: messageType === 'success' ? '#d4edda' : '#f8d7da',
            color: messageType === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
            whiteSpace: 'pre-line'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name field - chỉ hiển thị khi đăng ký */}
          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                👤 Họ và tên:
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
                placeholder="Nhập họ tên đầy đủ"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `2px solid ${errors.name ? '#dc3545' : '#e9ecef'}`,
                  borderRadius: '6px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
              />
              {errors.name && (
                <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '6px' }}>
                  ⚠️ {errors.name}
                </div>
              )}
            </div>
          )}

          {/* Email field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
              📧 Email:
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="example@gmail.com"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${errors.email ? '#dc3545' : '#e9ecef'}`,
                borderRadius: '6px',
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
            />
            {errors.email && (
              <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '6px' }}>
                ⚠️ {errors.email}
              </div>
            )}
          </div>

          {/* Password field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
              🔒 Mật khẩu:
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Nhập mật khẩu"
              disabled={loading}
              minLength="6"
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${errors.password ? '#dc3545' : '#e9ecef'}`,
                borderRadius: '6px',
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
            />
            {errors.password && (
              <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '6px' }}>
                ⚠️ {errors.password}
              </div>
            )}
          </div>

          {/* Confirm Password field - chỉ hiển thị khi đăng ký */}
          {!isLogin && (
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                🔒 Xác nhận mật khẩu:
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required={!isLogin}
                placeholder="Nhập lại mật khẩu"
                disabled={loading}
                minLength="6"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `2px solid ${errors.confirmPassword ? '#dc3545' : '#e9ecef'}`,
                  borderRadius: '6px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
              />
              {errors.confirmPassword && (
                <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '6px' }}>
                  ⚠️ {errors.confirmPassword}
                </div>
              )}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || apiStatus === 'error'}
            style={{
              width: '100%',
              background: (loading || apiStatus === 'error') ? '#6c757d' : '#667eea',
              color: 'white',
              border: 'none',
              padding: '14px 24px',
              borderRadius: '6px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: (loading || apiStatus === 'error') ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
              marginBottom: '15px'
            }}
          >
            {loading ? (
              <>
                <div style={{
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  animation: 'spin 1s linear infinite'
                }}></div>
                {isLogin ? 'Đang đăng nhập...' : 'Đang đăng ký...'}
              </>
            ) : (
              isLogin ? '🚀 Đăng nhập' : '✨ Đăng ký'
            )}
          </button>

          {/* Forgot Password link - chỉ hiển thị khi đăng nhập */}
          {isLogin && (
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <span 
                onClick={handleForgotPassword}
                style={{ 
                  color: '#667eea', 
                  cursor: 'pointer', 
                  fontSize: '0.9rem',
                  textDecoration: 'underline'
                }}
              >
                🔑 Quên mật khẩu?
              </span>
            </div>
          )}
        </form>

        {/* Toggle between login and signup */}
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #e9ecef',
          textAlign: 'center'
          }}>
          <p style={{ color: '#666', margin: 0, fontSize: '0.95rem' }}>
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <span 
              onClick={toggleMode}
              style={{ 
                color: '#667eea', 
                cursor: 'pointer', 
                fontWeight: '600',
                marginLeft: '8px',
                textDecoration: 'underline'
              }}
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </span>
          </p>
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Auth;