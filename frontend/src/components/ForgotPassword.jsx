// src/components/ForgotPassword.jsx
import React, { useState } from 'react';
import axios from 'axios';

import API_BASE_URL from '../../config/api';

const ForgotPassword = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [step, setStep] = useState('email'); // 'email' or 'success'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        email: email.trim().toLowerCase()
      });

      if (response.data.success) {
        setMessage('✅ ' + response.data.message);
        setMessageType('success');
        setStep('success');
        
        // Hiển thị token trong development
        if (response.data.resetToken) {
          console.log('Reset Token (Development):', response.data.resetToken);
          setMessage(prev => prev + `\n🔑 Token: ${response.data.resetToken}`);
        }
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi khi gửi yêu cầu';
      setMessage('❌ ' + errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div style={{ 
        margin: '20px', 
        padding: '30px', 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        backgroundColor: 'white',
        maxWidth: '500px',
        margin: '40px auto',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📧</div>
        <h2 style={{ color: '#333', marginBottom: '15px' }}>Kiểm tra email của bạn</h2>
        
        <div style={{
          padding: '15px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '6px',
          marginBottom: '20px',
          textAlign: 'left',
          whiteSpace: 'pre-line'
        }}>
          {message}
        </div>

        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '6px',
          marginBottom: '20px',
          textAlign: 'left'
        }}>
          <h4 style={{ marginBottom: '10px', color: '#333' }}>📋 Hướng dẫn:</h4>
          <ul style={{ textAlign: 'left', paddingLeft: '20px', color: '#666' }}>
            <li>Kiểm tra hộp thư email của bạn</li>
            <li>Click vào link reset password trong email</li>
            <li>Đặt lại mật khẩu mới</li>
          </ul>
        </div>

        <button
          onClick={onBackToLogin}
          style={{
            padding: '12px 24px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            marginRight: '10px'
          }}
        >
          ← Quay lại đăng nhập
        </button>

        <button
          onClick={() => setStep('email')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          🔄 Gửi lại
        </button>
      </div>
    );
  }

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
        🔑 Quên mật khẩu
      </h2>
      
      <p style={{ 
        color: '#666', 
        marginBottom: '25px', 
        textAlign: 'center',
        fontSize: '0.95rem'
      }}>
        Nhập email của bạn để nhận link đặt lại mật khẩu
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
          border: `1px solid ${messageType === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          whiteSpace: 'pre-line'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
            📧 Email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Nhập email của bạn"
            disabled={loading}
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
            background: loading ? '#6c757d' : '#667eea',
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
            gap: '8px',
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
              Đang gửi...
            </>
          ) : (
            '📧 Gửi link reset password'
          )}
        </button>
      </form>

      <button
        onClick={onBackToLogin}
        style={{
          width: '100%',
          padding: '10px 24px',
          backgroundColor: 'transparent',
          color: '#667eea',
          border: '1px solid #667eea',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '1rem'
        }}
      >
        ← Quay lại đăng nhập
      </button>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;