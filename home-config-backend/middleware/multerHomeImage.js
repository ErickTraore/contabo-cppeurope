const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'home');
/** Limite upload image page d’accueil (alignée message API + UI + nginx). */
const MAX_FILE_BYTES = 50 * 1024 * 1024;

function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    try {
      ensureUploadDir();
      cb(null, UPLOAD_DIR);
    } catch (e) {
      cb(e);
    }
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    let useExt = allowed.includes(ext) ? ext : '.jpg';
    if (!allowed.includes(ext)) {
      if (file.mimetype === 'image/png') useExt = '.png';
      else if (file.mimetype === 'image/webp') useExt = '.webp';
      else if (file.mimetype === 'image/gif') useExt = '.gif';
    }
    cb(null, `${crypto.randomUUID()}${useExt}`);
  },
});

function fileFilter(req, file, cb) {
  if (/^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Types acceptés : JPEG, PNG, WebP, GIF.'));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_BYTES },
});

module.exports = {
  uploadHomeImageSingle: upload.single('image'),
  getUploadDir: () => UPLOAD_DIR,
  maxFileBytes: MAX_FILE_BYTES,
};
