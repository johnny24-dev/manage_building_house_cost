import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants/statusCodes';

const avatarStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const dir = path.join('uploads', 'avatars');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

const avatarFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new AppError(
      ErrorCode.FILE_TYPE_INVALID,
      'Chỉ cho phép upload ảnh JPEG, PNG, WEBP'
    );
    cb(error as any);
  }
};

export const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});


