import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { loginValidation, registerValidation, sendOTPValidation, resetPasswordValidation, validate } from '../utils/validation';

const router = Router();

/**
 * @route   POST /api/auth/send-register-otp
 * @desc    Gửi OTP để đăng ký
 * @access  Public
 */
router.post('/send-register-otp', sendOTPValidation, validate, AuthController.sendRegisterOTP);

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký người dùng mới (sau khi xác thực OTP)
 * @access  Public
 */
router.post('/register', registerValidation, validate, AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập người dùng
 * @access  Public
 */
router.post('/login', loginValidation, validate, AuthController.login);

/**
 * @route   POST /api/auth/send-forgot-password-otp
 * @desc    Gửi OTP để quên mật khẩu
 * @access  Public
 */
router.post('/send-forgot-password-otp', sendOTPValidation, validate, AuthController.sendForgotPasswordOTP);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Đặt lại mật khẩu sau khi xác thực OTP
 * @access  Public
 */
router.post('/reset-password', resetPasswordValidation, validate, AuthController.resetPassword);

export default router;

