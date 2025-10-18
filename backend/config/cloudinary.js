const cloudinary = require('cloudinary').v2;
const stream = require('stream');

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload stream to Cloudinary
const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'avatars',
        transformation: [
          { width: 300, height: 300, crop: 'limit', quality: 'auto' },
          { format: 'png' }
        ],
        ...options
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    // Create readable stream from buffer
    const readableStream = new stream.PassThrough();
    readableStream.end(fileBuffer);
    readableStream.pipe(uploadStream);
  });
};

// Xóa ảnh cũ từ Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Deleted from Cloudinary:', result);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary
};