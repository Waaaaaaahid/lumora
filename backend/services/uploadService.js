// backend/services/uploadService.js
// Multer + Cloudinary storage for portfolio images and videos.
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary, configureCloudinary } = require('../config/cloudinary');

const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

const buildUploader = (folder = 'lumora/portfolio') => {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
    );
  }

  configureCloudinary();
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      resource_type: 'image',
    },
  });
  return multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });
};

const buildVideoUploader = (folder = 'lumora/portfolio/videos') => {
  if (!isCloudinaryConfigured()) throw new Error('Cloudinary is not configured.');
  configureCloudinary();
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      resource_type: 'video',
      allowed_formats: ['mp4', 'webm'],
    },
  });
  return multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });
};

const deleteCloudinaryMedia = async (publicId, mediaType = 'image') => {
  if (!isCloudinaryConfigured() || !publicId) return;
  try {
    configureCloudinary();
    await cloudinary.uploader.destroy(String(publicId), {
      resource_type: mediaType === 'video' ? 'video' : 'image',
    });
  } catch (error) {
    console.warn('Cloudinary media delete skipped:', error.message);
  }
};

const deleteCloudinaryImage = (publicId) => deleteCloudinaryMedia(publicId, 'image');

module.exports = {
  buildUploader,
  buildVideoUploader,
  isCloudinaryConfigured,
  deleteCloudinaryImage,
  deleteCloudinaryMedia,
};
