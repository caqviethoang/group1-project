// frontend/src/components/AddUser.jsx
import React, { useState } from 'react';
import axios from 'axios';

const AddUser = ({ onUserAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // POST API - Thêm user mới
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form - Backend yêu cầu name, email, age
    if (!formData.name || !formData.email || !formData.age) {
      setMessage('Vui lòng điền đầy đủ thông tin: name, email, age');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      // Tạo object user mới theo cấu trúc backend
      const newUser = {
        name: formData.name,
        email: formData.email,
        age: formData.age
      };

      // Gửi POST request
      const response = await axios.post("http://localhost:3000/users", newUser);
      
      // Kiểm tra response từ backend
      if (response.data.success) {
        setMessage('✅ Thêm user thành công!');
        setFormData({ name: '', email: '', age: '' }); // Reset form
        
        // Gọi callback để refresh danh sách
        if (onUserAdded) {
          onUserAdded();
        }
      } else {
        setMessage(`❌ ${response.data.message}`);
      }
    } catch (err) {
      // Xử lý lỗi từ server
      if (err.response && err.response.data) {
        setMessage(`❌ ${err.response.data.message}`);
      } else {
        setMessage('❌ Lỗi kết nối đến server');
      }
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc' }}>
      <h2>Thêm User Mới</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ width: '200px', padding: '5px' }}
            placeholder="Nhập tên"
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '200px', padding: '5px' }}
            placeholder="Nhập email"
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Age:</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            required
            style={{ width: '200px', padding: '5px' }}
            placeholder="Nhập tuổi"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Đang thêm...' : 'Thêm User'}
        </button>
      </form>
      {message && (
        <p style={{ 
          color: message.includes('✅') ? 'green' : 'red',
          marginTop: '10px'
        }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default AddUser;