// components/AvatarUpload.js
import React, { useState } from 'react';
import api from '../service/auth'; // Sử dụng api service đã có interceptor

const AvatarUpload = ({ user, onAvatarUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(user?.avatar?.url || '');
  const [error, setError] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File quá lớn. Kích thước tối đa 5MB');
      return;
    }

    setError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload file qua backend API
    uploadAvatar(file);
  };

  const uploadAvatar = async (file) => {
    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('avatar', file);

      // QUAN TRỌNG: Gọi API backend thay vì Cloudinary trực tiếp
      const response = await api.post('/auth/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        onAvatarUpdate(response.data.avatar);
        setPreview(response.data.avatar.url); // Dùng URL từ Cloudinary response
        alert('✅ Upload avatar thành công!');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      setError(error.response?.data?.message || 'Lỗi upload avatar');
      setPreview(''); // Reset preview nếu lỗi
    } finally {
      setUploading(false);
    }
  };

  const deleteAvatar = async () => {
    try {
      setUploading(true);
      
      const response = await api.delete('/auth/avatar');

      if (response.data.success) {
        setPreview('');
        onAvatarUpdate(null);
        alert('✅ Xóa avatar thành công!');
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
      setError(error.response?.data?.message || 'Lỗi xóa avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="avatar-upload">
      <div className="avatar-preview">
        {preview ? (
          <img 
            src={preview} 
            alt="Avatar" 
            style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '150px', 
            height: '150px', 
            borderRadius: '50%', 
            backgroundColor: '#ddd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '14px'
          }}>
            No Avatar
          </div>
        )}
      </div>

      <div className="avatar-actions" style={{ marginTop: '15px' }}>
        <label 
          htmlFor="avatar-input" 
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: uploading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem'
          }}
        >
          {uploading ? '🔄 Đang upload...' : '📁 Chọn ảnh'}
        </label>
        
        <input
          id="avatar-input"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          style={{ display: 'none' }}
        />

        {preview && (
          <button
            onClick={deleteAvatar}
            disabled={uploading}
            style={{
              marginLeft: '10px',
              padding: '8px 16px',
              backgroundColor: uploading ? '#6c757d' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {uploading ? '🔄 Đang xóa...' : '🗑️ Xóa avatar'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ 
          color: '#dc3545', 
          marginTop: '10px', 
          fontSize: '0.875rem',
          padding: '8px',
          backgroundColor: '#f8d7da',
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ 
        marginTop: '10px', 
        fontSize: '0.75rem', 
        color: '#666',
        fontStyle: 'italic'
      }}>
        📝 Hỗ trợ: JPEG, PNG, GIF, WebP (tối đa 5MB)
      </div>
    </div>
  );
};

export default AvatarUpload;