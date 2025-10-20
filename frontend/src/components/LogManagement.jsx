// src/components/LogsManagement.jsx
import React, { useState, useEffect } from 'react';
import api from '../service/auth';

const LogsManagement = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    action: '',
    userId: '',
    startDate: '',
    endDate: '',
    ipAddress: ''
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await api.get(`/auth/admin/logs?${params}`);
      if (response.data.success) {
        setLogs(response.data.logs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/auth/admin/logs/stats?days=7');
      if (response.data.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset về trang 1 khi filter thay đổi
    }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
    fetchStats();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getActionColor = (action) => {
    const colors = {
      'login_success': 'success',
      'login_failed': 'danger',
      'logout': 'info',
      'profile_update': 'primary',
      'password_change': 'warning',
      'user_created': 'success',
      'user_deleted': 'danger',
      'role_updated': 'warning',
      'login_bruteforce_blocked': 'danger'
    };
    return colors[action] || 'secondary';
  };

  const translateAction = (action) => {
    const translations = {
      'login_success': 'Đăng nhập thành công',
      'login_failed': 'Đăng nhập thất bại',
      'logout': 'Đăng xuất',
      'profile_update': 'Cập nhật profile',
      'password_change': 'Đổi mật khẩu',
      'avatar_upload': 'Upload avatar',
      'user_created': 'Tạo user mới',
      'user_updated': 'Cập nhật user',
      'user_deleted': 'Xóa user',
      'role_updated': 'Cập nhật role',
      'status_updated': 'Cập nhật trạng thái',
      'login_bruteforce_blocked': 'Chặn brute force'
    };
    return translations[action] || action;
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2>📊 Thống kê hoạt động (7 ngày)</h2>
        {stats.stats && (
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {stats.stats.map(stat => (
              <div key={stat._id} style={{
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                minWidth: '200px'
              }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {stat.total}
                </div>
                <div style={{ color: '#666' }}>
                  {translateAction(stat._id)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>🔍 Lọc logs</h3>
        <form onSubmit={handleFilterSubmit}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px',
            marginBottom: '15px'
          }}>
            <div>
              <label>Hành động:</label>
              <select 
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">Tất cả</option>
                <option value="login_success">Đăng nhập thành công</option>
                <option value="login_failed">Đăng nhập thất bại</option>
                <option value="logout">Đăng xuất</option>
                <option value="profile_update">Cập nhật profile</option>
                <option value="user_created">Tạo user</option>
                <option value="user_deleted">Xóa user</option>
              </select>
            </div>
            
            <div>
              <label>IP Address:</label>
              <input
                type="text"
                value={filters.ipAddress}
                onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
                placeholder="Nhập IP..."
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            
            <div>
              <label>Từ ngày:</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            
            <div>
              <label>Đến ngày:</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            </div>
          
          <button 
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔍 Áp dụng bộ lọc
          </button>
        </form>
      </div>

      {/* Logs Table */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>📋 Logs hoạt động ({logs.length} records)</h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div>⏳ Đang tải logs...</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '0.9rem'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Thời gian</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>User</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Hành động</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>IP Address</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px' }}>
                        {formatDate(log.timestamp)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {log.userId ? (
                          <div>
                            <div style={{ fontWeight: '500' }}>{log.userId.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>
                              {log.userId.email} ({log.userId.role})
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#999' }}>N/A</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: `var(--bs-${getActionColor(log.action)})`,
                          color: 'white',
                          fontSize: '0.8rem'
                        }}>
                          {translateAction(log.action)}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'monospace' }}>
                        {log.ipAddress}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <details>
                            <summary style={{ cursor: 'pointer' }}>
                              Xem chi tiết
                            </summary>
                            <pre style={{ 
                              marginTop: '8px', 
                              fontSize: '0.8rem',
                              backgroundColor: '#f8f9fa',
                              padding: '8px',
                              borderRadius: '4px'
                            }}>
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span style={{ color: '#999' }}>Không có</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logs.length === 0 && !loading && (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#666' 
              }}>
                📭 Không có logs nào phù hợp với bộ lọc
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LogsManagement;
