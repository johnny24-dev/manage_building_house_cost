import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants/statusCodes';

// Cấu hình storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Tạo tên file unique: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

// Filter chỉ cho phép PDF
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    const error = new AppError(
      ErrorCode.FILE_TYPE_INVALID,
      'Chỉ cho phép upload file PDF'
    );
    cb(error as any);
  }
};

// Cấu hình multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB - cho phép upload file PDF nặng
  },
});

