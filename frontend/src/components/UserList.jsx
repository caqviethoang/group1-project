// src/components/UserList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // SỬA: Dùng relative URL
      const response = await axios.get("/users");
      setUsers(response.data.data);
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Lỗi khi tải danh sách users');
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
        // SỬA: Dùng relative URL
        await axios.delete(`/users/${userId}`);
        fetchUsers();
      } catch (err) {
        setError('Lỗi khi xóa user');
        console.error('Error deleting user:', err);
      }
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>;

  return (
    <div style={{ margin: '20px' }}>
      <h2>Danh sách Users</h2>
      
      {users.length === 0 ? (
        <p>Không có user nào</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            border: '1px solid #ddd'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>ID</th>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>Name</th>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>Email</th>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>Age</th>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{user.id}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{user.name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{user.email}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{user.age}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserList;