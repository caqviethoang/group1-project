const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://group1-project-dsc3.onrender.com'
    : 'http://localhost:3000');

export default API_BASE_URL;