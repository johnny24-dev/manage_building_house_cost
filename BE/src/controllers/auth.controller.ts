import { Request, Response, NextFunction } from 'express';
import { loginService, registerService, sendRegisterOTP } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { SuccessCode } from '../constants/statusCodes';

export class AuthController {
  /**
   * Gửi OTP để đăng ký
   */
  static async sendRegisterOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await sendRegisterOTP(email);
      return sendSuccess(res, SuccessCode.OTP_SENT, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đăng ký người dùng mới sau khi xác thực OTP (chỉ tạo viewer)
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, otpCode } = req.body;
      const result = await registerService({ email, password, otpCode });
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

