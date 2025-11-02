const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload directory: <project-root>/uploads/roommate
const uploadDir = path.join(__dirname, '../../uploads/roommate');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, '-')
      .toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${base}${ext}`);
  },
});

const imageFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const mimetypeOk = allowed.test(file.mimetype);
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  if (mimetypeOk && extOk) cb(null, true);
  else cb(new Error('Only image files are allowed (jpeg, jpg, png, webp)'), false);
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
});

module.exports = upload;
