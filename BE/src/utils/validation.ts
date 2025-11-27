import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { sendError } from './response';
import { ErrorCode } from '../constants/statusCodes';

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .notEmpty()
    .withMessage('Email là bắt buộc'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
    .notEmpty()
    .withMessage('Mật khẩu là bắt buộc'),
];

export const sendOTPValidation = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .notEmpty()
    .withMessage('Email là bắt buộc')
    .normalizeEmail(),
];

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mật khẩu hiện tại là bắt buộc'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
    .isLength({ max: 100 })
    .withMessage('Mật khẩu mới không được vượt quá 100 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số')
    .notEmpty()
    .withMessage('Mật khẩu mới là bắt buộc'),
  body('otpCode')
    .isLength({ min: 6, max: 6 })
    .withMessage('Mã OTP phải có đúng 6 chữ số')
    .matches(/^\d{6}$/)
    .withMessage('Mã OTP chỉ được chứa số')
    .notEmpty()
    .withMessage('Mã OTP là bắt buộc'),
];

export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .notEmpty()
    .withMessage('Email là bắt buộc')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
    .isLength({ max: 100 })
    .withMessage('Mật khẩu không được vượt quá 100 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số')
    .notEmpty()
    .withMessage('Mật khẩu là bắt buộc'),
  body('otpCode')
    .isLength({ min: 6, max: 6 })
    .withMessage('Mã OTP phải có đúng 6 chữ số')
    .matches(/^\d{6}$/)
    .withMessage('Mã OTP chỉ được chứa số')
    .notEmpty()
    .withMessage('Mã OTP là bắt buộc'),
];

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, ErrorCode.VALIDATION_ERROR, errors.array());
  }
  next();
};

