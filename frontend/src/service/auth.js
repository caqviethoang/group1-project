// src/service/auth.js
import axios from 'axios';

import API_BASE_URL from '../../config/api';

// Tạo instance của axios cho API calls đã authenticated
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Biến để quản lý refresh token
let isRefreshing = false;
let failedQueue = [];

// Hàm xử lý queue các request bị failed
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - tự động thêm token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to request:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - xử lý token hết hạn
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Kiểm tra nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔄 Token expired, attempting refresh...');
      
      // Nếu đang refresh, thêm request vào queue
      if (isRefreshing) {
        console.log('⏳ Already refreshing, adding to queue...');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        console.log('🔄 Calling refresh token API...');
        
        // Gọi API refresh token (dùng axios thường, không dùng api instance)
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        console.log('✅ Refresh successful, updating tokens...');
        
        // Lưu tokens mới vào localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Cập nhật header mặc định cho các request tiếp theo
        api.defaults.headers.Authorization = `Bearer ${accessToken}`;
        
        // Xử lý tất cả requests trong queue với token mới
        processQueue(null, accessToken);

        // Retry request gốc với token mới
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Xử lý queue với lỗi
        processQueue(refreshError, null);
        
        // Xóa tất cả tokens và user data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Redirect về trang login nếu không phải đang ở trang chủ
        if (window.location.pathname !== '/' && !window.location.pathname.includes('/login')) {
          console.log('🔐 Redirecting to login...');
          window.location.href = '/';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Nếu lỗi khác 401, trả về lỗi bình thường
    return Promise.reject(error);
  }
);

// Export instance đã được config
export default api;