// src/components/AddUser.jsx
import React, { useState } from 'react';
import axios from 'axios';

// Config - THAY ĐỔI IP NÀY THÀNH IP BACKEND CỦA BẠN
const API_BASE_URL = 'http://192.168.1.38:3000';

const AddUser = ({ onUserAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear message when user starts typing
    if (message) {
      setMessage('');
      setMessageType('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      setMessage('Vui lòng điền đầy đủ thông tin');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const newUser = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase()
      };

      const response = await axios.post(`${API_BASE_URL}/users`, newUser);
      
      setMessage('✅ Thêm user thành công!');
      setMessageType('success');
      setFormData({ name: '', email: '' });
      
      // Notify parent component to refresh list
      if (onUserAdded) {
        onUserAdded();
      }

      // Auto clear success message after 3 seconds
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);

    } catch (error) {
      console.error('Error adding user:', error);
      let errorMessage = 'Lỗi khi thêm user';
      
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.message === 'User with this email already exists') {
          errorMessage = '❌ Email đã tồn tại trong hệ thống';
        } else if (errorData.message === 'Validation Error') {
          errorMessage = `❌ ${errorData.error || 'Dữ liệu không hợp lệ'}`;
        } else {
          errorMessage = `❌ ${errorData.message || 'Lỗi khi thêm user'}`;
        }
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = '❌ Không thể kết nối đến server';
      }
      
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      margin: '20px', 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: 'white'
    }}>
      <h2>➕ Thêm User Mới</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Nhập thông tin user để thêm vào hệ thống
      </p>
      
      <form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
            👤 Tên user:
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Nhập tên đầy đủ"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
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
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
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
            padding: '12px 24px',
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
                width: '16px',
                height: '16px',
                animation: 'spin 1s linear infinite'
              }}></div>
              Đang thêm...
            </>
          ) : (
            '🚀 Thêm User'
          )}
        </button>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>

        {message && (
          <div style={{
            marginTop: '15px',
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
      </form>

      <div style={{

      marginTop: '25px',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '6px',
        borderLeft: '4px solid #667eea'
      }}>
        <h4 style={{ marginBottom: '8px', color: '#333' }}>📋 Thông tin:</h4>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ padding: '4px 0', color: '#666' }}>• Tên: Tối đa 50 ký tự</li>
          <li style={{ padding: '4px 0', color: '#666' }}>• Email: Định dạng email hợp lệ</li>
          <li style={{ padding: '4px 0', color: '#666' }}>• Email phải là duy nhất trong hệ thống</li>
        </ul>
      </div>
    </div>
  );
};

export default AddUser;