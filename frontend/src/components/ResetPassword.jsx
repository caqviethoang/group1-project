// src/components/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.23:3000';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setMessage('❌ Token reset password không hợp lệ');
      setMessageType('error');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage('❌ Mật khẩu xác nhận không khớp');
      setMessageType('error');
      return;
    }

    if (password.length < 6) {
      setMessage('❌ Mật khẩu phải có ít nhất 6 ký tự');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/reset-password/${token}`, {
        password: password
      });

      if (response.data.success) {
        setMessage('✅ ' + response.data.message);
        setMessageType('success');
        
        // Chuyển hướng sau 3 giây
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi khi đặt lại mật khẩu';
      setMessage('❌ ' + errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      margin: '20px', 
      padding: '30px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: 'white',
      maxWidth: '500px',
      margin: '40px auto'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '10px', color: '#333' }}>
        🔄 Đặt lại mật khẩu
      </h2>
      
      <p style={{ 
        color: '#666', 
        marginBottom: '25px', 
        textAlign: 'center',
        fontSize: '0.95rem'
      }}>
        Nhập mật khẩu mới cho tài khoản của bạn
      </p>

      {message && (
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          borderRadius: '6px',
          fontWeight: '500',
          textAlign: 'center',
          backgroundColor: messageType === 'success' ? '#d4edda' : '#f8d7da',
          color: messageType === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      {token ? (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
              🔒 Mật khẩu mới:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
              disabled={loading}
              minLength="6"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e9ecef',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
              🔒 Xác nhận mật khẩu:
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Nhập lại mật khẩu mới"
              disabled={loading}
              minLength="6"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e9ecef',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              padding: '14px 24px',
              borderRadius: '6px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
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
                Đang xử lý...
              </>
            ) : (
              '✅ Đặt lại mật khẩu'
            )}
          </button>
        </form>
      ) : (
        <div style={{ textAlign: 'center', color: '#666' }}>
          <p>Token reset password không hợp lệ hoặc đã hết hạn.</p>
          <button
            onClick={() => navigate('/forgot-password')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            📧 Yêu cầu link mới
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ResetPassword;