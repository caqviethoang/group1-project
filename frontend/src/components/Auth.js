// src/components/Auth.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, clearError } from '../store/slices/authSlice';
import ForgotPassword from './ForgotPassword';

// Auto-detect API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://group1-project-dsc3.onrender.com'
    : 'http://localhost:3000');

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [apiStatus, setApiStatus] = useState('checking');
  
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Check API connection
  useEffect(() => {
    checkApiConnection();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Clear error when form changes
  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [formData, error, dispatch]);

  const checkApiConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK' && data.database === 'Connected') {
          setApiStatus('connected');
        } else {
          setApiStatus('error');
        }
      } else {
        setApiStatus('error');
      }
    } catch (error) {
      console.error('API connection error:', error);
      setApiStatus('error');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isLogin && !formData.name.trim()) {
      newErrors.name = 'Tên không được để trống';
    } else if (!isLogin && formData.name.trim().length > 50) {
      newErrors.name = 'Tên không được vượt quá 50 ký tự';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

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

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isLogin) {
        await dispatch(loginUser({
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        })).unwrap();
      } else {
        await dispatch(registerUser({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        })).unwrap();
        
        setIsLogin(true);
        setFormData({ 
          name: '', 
          email: '', 
          password: '', 
          confirmPassword: '' 
        });
        setErrors({});
      }
    } catch (error) {
      console.error('Auth error:', error);
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
    dispatch(clearError());
  };

  if (showForgotPassword) {
    return <ForgotPassword onBackToLogin={() => setShowForgotPassword(false)} />;
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
            Backend: {API_BASE_URL.replace('https://', '').replace('http://', '')}
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
        
        {/* Redux Error Message */}
        {error && (
          <div style={{ 
            padding: '12px', 
            borderRadius: '6px', 
            marginBottom: '15px', 
            textAlign: 'center',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            whiteSpace: 'pre-line'
          }}>
            ❌ {error}
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
                onClick={() => setShowForgotPassword(true)}
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