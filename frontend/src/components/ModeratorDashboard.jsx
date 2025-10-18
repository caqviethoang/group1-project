import React, { useState, useEffect } from 'react';
import api from '../service/auth';

const ModeratorDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/moderator/users');
      
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

  const updateUserStatus = async (userId, isActive) => {
    try {
      const response = await api.put(`/auth/moderator/users/${userId}/status`, {
        isActive
      });

      if (response.data.success) {
        showMessage(`✅ User ${isActive ? 'activated' : 'deactivated'} successfully`, 'success');
        fetchUsers();
      }
    } catch (error) {
      console.error('Update user status error:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi khi cập nhật trạng thái user';
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
      moderator: { background: '#ffc107', color: '#212529' },
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
        <h2 style={{ color: '#333', margin: 0 }}>🛡️ Moderator Dashboard</h2>
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
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Status</th>
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
                  </div>
                </td>
                <td style={{ padding: '12px' }}>{user.email}</td>
                <td style={{ padding: '12px' }}>
                  {getRoleBadge(user.role)}
                </td>
                <td style={{ padding: '12px' }}>
                  <select
                    value={user.isActive ? 'active' : 'inactive'}
                    onChange={(e) => updateUserStatus(user._id, e.target.value === 'active')}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      backgroundColor: user.isActive ? '#d4edda' : '#f8d7da',
                      color: user.isActive ? '#155724' : '#721c24'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td style={{ padding: '12px', color: '#666' }}>
                  {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <span style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                    Chỉ xem
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          📝 Không có users nào để quản lý
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

export default ModeratorDashboard;