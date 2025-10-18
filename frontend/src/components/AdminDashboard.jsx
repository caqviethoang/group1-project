// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.58:3000';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/auth/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      showMessage('❌ Lỗi khi tải danh sách users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId, userName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa user "${userName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE_URL}/auth/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        showMessage('✅ Xóa user thành công!', 'success');
        fetchUsers(); // Refresh list
      }
    } catch (error) {
      console.error('Delete user error:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi khi xóa user';
      showMessage(`❌ ${errorMessage}`, 'error');
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/auth/admin/users/${userId}/role`,
        { role: newRole },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        showMessage(`✅ Đã cập nhật role thành ${newRole}`, 'success');
        fetchUsers(); // Refresh list
      }
    } catch (error) {
      console.error('Update role error:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi khi cập nhật role';
      showMessage(`❌ ${errorMessage}`, 'error');
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

  const getRoleBadge = (role) => {
    const roleStyles = {
      admin: { background: '#dc3545', color: 'white' },
      user: { background: '#28a745', color: 'white' }
    };

    const style = roleStyles[role] || roleStyles.user;

    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: '600',
        ...style
      }}>
        {role.toUpperCase()}
      </span>
    );
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
        <p>Đang tải danh sách users...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      margin: '20px', 
      padding: '30px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: 'white'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: '2px solid #f0f0f0',
        paddingBottom: '15px'
      }}>
        <h2 style={{ color: '#333', margin: 0 }}>👑 Admin Dashboard</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#666', fontSize: '0.9rem' }}>
            Tổng số users: <strong>{users.length}</strong>
          </span>
          <button
            onClick={fetchUsers}
            style={{
              padding: '6px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            🔄 Refresh
          </button>
        </div>
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

      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '0.9rem'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>User</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Role</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Ngày tạo</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px' }}>
                  <div>
                    <strong>{user.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#666', fontFamily: 'monospace' }}>
                      {user._id}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px' }}>{user.email}</td>
                <td style={{ padding: '12px' }}>
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user._id, e.target.value)}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td style={{ padding: '12px', color: '#666' }}>
                  {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button
                    onClick={() => deleteUser(user._id, user.name)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                    disabled={user.role === 'admin'} // Không cho xóa admin
                  >
                    🗑️ Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#666' 
        }}>
          📝 Không có users nào trong hệ thống
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

export default AdminDashboard;