import { Request, Response, NextFunction } from 'express';
import { loginService, registerService, sendRegisterOTP, sendForgotPasswordOTP, resetPassword } from '../services/auth.service';
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

  /**
   * Gửi OTP để quên mật khẩu
   */
  static async sendForgotPasswordOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await sendForgotPasswordOTP(email);
      return sendSuccess(res, SuccessCode.OTP_SENT, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đặt lại mật khẩu sau khi xác thực OTP
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, newPassword, otpCode } = req.body;
      await resetPassword(email, newPassword, otpCode);
      return sendSuccess(res, SuccessCode.PASSWORD_RESET_SUCCESS);
    } catch (error) {
      next(error);
    }
  }
}

