const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Temp disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = 'uploads/temp/';
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'];
const isVideoMime = (mimetype) => ALLOWED_VIDEO_TYPES.includes(mimetype);

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB — videos ke liye zyada space chahiye
  fileFilter: (req, file, cb) => {
    const allowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only jpg/jpeg/png/webp images or mp4/webm/mov/ogg videos are allowed'), false);
  },
});

/* ── Image path (unchanged): Sharp compress → WebP max 40KB ────────────────── */
const compressToWebp = async (inputPath) => {
  let quality = 80;
  let outputBuffer;
  do {
    outputBuffer = await sharp(inputPath)
      .resize({ width: 1280, height: 960, fit: 'inside' })
      .webp({ quality })
      .toBuffer();
    if (outputBuffer.length <= 40 * 1024) break;
    quality -= 5;
  } while (quality >= 10);
  return outputBuffer;
};

// Image buffer → Cloudinary
const uploadImageBufferToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', format: 'webp' },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
};

/* ── Video path: Cloudinary khud compress karta hai (quality: auto) ────────── */
const uploadVideoFileToCloudinary = (filePath, folder) => {
  return cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'video',
    quality: 'auto',
    fetch_format: 'auto',
  });
};

/**
 * Single file process — image ho to compress+upload, video ho to seedha upload.
 * Returns { url, mediaType: 'image' | 'video' }
 */
const processFile = async (file, folder) => {
  if (isVideoMime(file.mimetype)) {
    const result = await uploadVideoFileToCloudinary(file.path, folder);
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return { url: result.secure_url, mediaType: 'video' };
  }

  const buffer = await compressToWebp(file.path);
  const result = await uploadImageBufferToCloudinary(buffer, folder);
  if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
  return { url: result.secure_url, mediaType: 'image' };
};

// Middleware: upload.single + compress (brand logo jaise single-image use cases ke liye)
const compressAndUpload = (fieldName, folder = 'ReadyGrocery/Brands') => [
  upload.single(fieldName),
  async (req, res, next) => {
    if (!req.file) return next();
    try {
      const { url, mediaType } = await processFile(req.file, folder);
      req.file.path = url;
      req.file.mediaType = mediaType; // 'image' | 'video'
      next();
    } catch (err) {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      next(err);
    }
  },
];

// Middleware: upload.fields + compress (product thumbnail+additionalImages, flash sale desktop/mobile media, etc.)
const compressAndUploadFields = (fields, folder = 'ReadyGrocery/Products') => [
  upload.fields(fields),
  async (req, res, next) => {
    if (!req.files) return next();
    try {
      for (const fieldName of Object.keys(req.files)) {
        req.files[fieldName] = await Promise.all(
          req.files[fieldName].map(async (file) => {
            const { url, mediaType } = await processFile(file, folder);
            file.path = url;
            file.mediaType = mediaType; // 'image' | 'video'
            return file;
          })
        );
      }
      next();
    } catch (err) {
      if (req.files) {
        Object.values(req.files).flat().forEach(file => {
          if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }
      next(err);
    }
  },
];

module.exports = {
  upload,
  compressAndUpload,
  compressAndUploadFields,
  // Backward compatibility — baaki purani routes ke liye
  single: upload.single.bind(upload),
  fields: upload.fields.bind(upload),
  array:  upload.array.bind(upload),
};