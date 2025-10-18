const multer = require('multer');
const path = require('path');

// Storage trong bộ nhớ tạm (sẽ upload lên Cloudinary sau)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Kiểm tra file type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)!'), false);
    }
  }
});

// Middleware xử lý lỗi upload
const handleUploadErrors = (error, req, res, next) => {
  if (error) {
    console.error('Upload error:', error);
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File quá lớn. Kích thước tối đa 5MB.'
        });
      }
      
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Trường upload không đúng.'
        });
      }
    }
    
    if (error.message.includes('Chỉ chấp nhận file ảnh')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi upload: ' + error.message
    });
  }
  next();
};

module.exports = {
  upload,
  handleUploadErrors
};