import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { loginValidation, registerValidation, validate } from '../utils/validation';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký người dùng mới
 * @access  Public
 */
router.post('/register', registerValidation, validate, AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập người dùng
 * @access  Public
 */
router.post('/login', loginValidation, validate, AuthController.login);

export default router;

