// frontend/src/components/UserList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // GET API - Lấy danh sách users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3000/users");
      
      // Backend trả về { success, message, data }
      if (response.data.success) {
        setUsers(response.data.data); // Lấy mảng users từ data
        setError('');
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Lỗi kết nối đến server');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h2>Danh sách Users</h2>
      {users.length === 0 ? (
        <p>Không có user nào</p>
      ) : (
        <ul>
          {users.map(user => (
            <li key={user.id}>
              <strong>{user.name}</strong> - {user.email} - {user.age} tuổi
            </li>
          ))}
        </ul>
      )}
      <button onClick={fetchUsers}>Tải lại</button>
    </div>
  );
};

export default UserList;