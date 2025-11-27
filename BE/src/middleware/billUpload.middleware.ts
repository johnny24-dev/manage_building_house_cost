import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants/statusCodes';

const billsDir = path.join(process.cwd(), 'uploads', 'bills');

const ensureBillsDir = () => {
  if (!fs.existsSync(billsDir)) {
    fs.mkdirSync(billsDir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureBillsDir();
    cb(null, billsDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, '-')
      .toLowerCase();
    cb(null, `${baseName}-${timestamp}-${random}${ext}`);
  },
});

const imageFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        ErrorCode.FILE_TYPE_INVALID,
        'Chỉ hỗ trợ upload file hình ảnh (jpg, png, heic, ...)'
      )
    );
  }
};

export const billUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

