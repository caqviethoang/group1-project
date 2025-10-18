// src/components/Profile.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.23:3000';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setUser(response.data.user);
        setFormData({
          name: response.data.user.name,
          email: response.data.user.email,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      showMessage('❌ Lỗi khi tải thông tin profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên không được để trống';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Validate password change
    if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
      }

      if (!formData.newPassword) {
        newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
      }

      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      }
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

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        name: formData.name,
        email: formData.email
      };

      // Chỉ gửi password nếu người dùng muốn đổi
      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await axios.put(`${API_BASE_URL}/auth/profile`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setUser(response.data.user);
        setEditing(false);
        showMessage('✅ Cập nhật profile thành công!', 'success');
        
        // Clear password fields
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Update profile error:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi khi cập nhật profile';
      showMessage(`❌ ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const cancelEdit = () => {
    setEditing(false);
    setFormData({
      name: user.name,
      email: user.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  if (loading) {
    return (
      <div style={{ 
        margin: '20px', 
        padding: '40px', 
        textAlign: 'center',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <div style={{
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #667eea',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <p>Đang tải thông tin...</p>
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
      maxWidth: '600px',
      margin: '40px auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: '2px solid #f0f0f0',
        paddingBottom: '15px'
      }}>
        <h2 style={{ color: '#333', margin: 0 }}>👤 Thông tin cá nhân</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
            >
            ✏️ Chỉnh sửa
          </button>
        )}
      </div>

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

      {!editing ? (
        // View mode
        <div style={{ lineHeight: '1.8' }}>
          <div style={{ marginBottom: '20px' }}>
            <strong style={{ color: '#555', minWidth: '120px', display: 'inline-block' }}>👤 Họ tên:</strong>
            <span style={{ color: '#333' }}>{user?.name}</span>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <strong style={{ color: '#555', minWidth: '120px', display: 'inline-block' }}>📧 Email:</strong>
            <span style={{ color: '#333' }}>{user?.email}</span>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <strong style={{ color: '#555', minWidth: '120px', display: 'inline-block' }}>🆔 User ID:</strong>
            <span style={{ color: '#666', fontSize: '0.9rem', fontFamily: 'monospace' }}>{user?.id}</span>
          </div>
          <div>
            <strong style={{ color: '#555', minWidth: '120px', display: 'inline-block' }}>📅 Ngày tạo:</strong>
            <span style={{ color: '#666' }}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
            </span>
          </div>
        </div>
      ) : (
        // Edit mode
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
              👤 Họ tên:
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${errors.name ? '#dc3545' : '#e9ecef'}`,
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
            {errors.name && (
              <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '6px' }}>
                ⚠️ {errors.name}
              </div>
            )}
          </div>

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
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${errors.email ? '#dc3545' : '#e9ecef'}`,
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
            {errors.email && (
              <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '6px' }}>
                ⚠️ {errors.email}
              </div>
            )}
          </div>

          <div style={{ 
            marginTop: '30px', 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '6px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{ marginBottom: '15px', color: '#333' }}>🔒 Đổi mật khẩu</h4>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>
              Chỉ điền các trường bên dưới nếu bạn muốn đổi mật khẩu
            </p>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                Mật khẩu hiện tại:
              </label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                disabled={loading}
                placeholder="Nhập mật khẩu hiện tại"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `2px solid ${errors.currentPassword ? '#dc3545' : '#e9ecef'}`,
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
              {errors.currentPassword && (
                <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '6px' }}>
                  ⚠️ {errors.currentPassword}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                Mật khẩu mới:
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                disabled={loading}
                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `2px solid ${errors.newPassword ? '#dc3545' : '#e9ecef'}`,
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
              {errors.newPassword && (
                <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '6px' }}>
                  ⚠️ {errors.newPassword}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                Xác nhận mật khẩu mới:
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                placeholder="Nhập lại mật khẩu mới"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `2px solid ${errors.confirmPassword ? '#dc3545' : '#e9ecef'}`,
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
              {errors.confirmPassword && (
                <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '6px' }}>
                  ⚠️ {errors.confirmPassword}
                </div>
              )}
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            marginTop: '25px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={loading}
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
              ❌ Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: loading ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
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
                    animation: 'spin 1s linear infinite',
                    display: 'inline-block',
                    marginRight: '8px'
                  }}></div>
                  Đang lưu...
                  </>
              ) : (
                '💾 Lưu thay đổi'
              )}
            </button>
          </div>
        </form>
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

export default Profile;