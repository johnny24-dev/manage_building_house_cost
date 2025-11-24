import { Request, Response, NextFunction } from 'express';
import { loginService, registerService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { SuccessCode } from '../constants/statusCodes';

export class AuthController {
  /**
   * Đăng ký người dùng mới (chỉ tạo viewer)
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await registerService({ email, password });
      return sendSuccess(res, SuccessCode.REGISTER_SUCCESS, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đăng nhập người dùng
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await loginService({ email, password });
      return sendSuccess(res, SuccessCode.LOGIN_SUCCESS, result);
    } catch (error) {
      next(error);
    }
  }
}

