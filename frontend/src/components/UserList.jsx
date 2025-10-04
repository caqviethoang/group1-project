// src/components/UserList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Config - THAY ĐỔI IP NÀY THÀNH IP BACKEND CỦA BẠN
const API_BASE_URL = 'http://192.168.1.38:3000';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/users`);
      setUsers(response.data.data);
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bạn có chắc muốn xóa user này?')) {
      try {
        await axios.delete(`${API_BASE_URL}/users/${userId}`);
        fetchUsers();
      } catch (err) {
        setError('Lỗi khi xóa user');
        console.error('Error deleting user:', err);
      }
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditMode(true);
  };

  const handleUpdateUser = async (updatedUser) => {
    try {
      await axios.put(`${API_BASE_URL}/users/${updatedUser._id}`, {
        name: updatedUser.name,
        email: updatedUser.email
      });
      setEditMode(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setError('Lỗi khi cập nhật user');
      console.error('Error updating user:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #667eea',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 10px'
      }}></div>
      <p>Đang tải danh sách users...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (error) return (
    <div style={{
      textAlign: 'center',
      padding: '40px',
      background: '#f8d7da',
      border: '1px solid #f5c6cb',
      borderRadius: '8px',
      color: '#721c24',
      margin: '20px'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
      <h3>Lỗi kết nối</h3>
      <p>{error}</p>
      <button 
        onClick={fetchUsers}
        style={{
          background: '#dc3545',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        Thử lại
      </button>
    </div>
  );

  return (
    <div style={{ margin: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '2px solid #f0f0f0'
      }}>
        <h2>Danh sách Users</h2>
        <button 
          onClick={fetchUsers}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🔄 Làm mới
        </button>
      </div>

      {users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <h3>📝 Chưa có user nào</h3>
          <p>Hãy thêm user mới để bắt đầu</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            border: '1px solid #ddd'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#667eea', color: 'white' }}>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Tên</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Email</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Ngày tạo</th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    <strong>{user.name}</strong>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px', fontFamily: 'monospace' }}>
                    {user.email}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px', color: '#888', fontSize: '0.9rem' }}>
                    {formatDate(user.createdAt)}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    <button 
                      onClick={() => handleEditUser(user)}
                      style={{
                        background: '#ffc107',
                        color: '#212529',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '5px'
                      }}
                    >
                      ✏️ Sửa
                      </button>
                    <button 
                      onClick={() => handleDeleteUser(user._id)}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editMode && selectedUser && (
        <EditUserModal 
          user={selectedUser}
          onSave={handleUpdateUser}
          onCancel={() => {
            setEditMode(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

// Component Edit Modal
const EditUserModal = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...user,
      ...formData
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        <h3 style={{ marginBottom: '1.5rem', color: '#333' }}>Chỉnh sửa User</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Tên:
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Email:
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              type="submit" 
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              💾 Lưu
            </button>
            <button 
              type="button" 
              onClick={onCancel}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ❌ Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserList;