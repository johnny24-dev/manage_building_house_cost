import { AppDataSource } from '../config/database';
import { OTP } from '../entities/OTP.entity';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants/statusCodes';
import { emailService } from './email.service';

const getOTPRepository = () => {
  return AppDataSource.getRepository(OTP);
};

/**
 * Ensure OTP table exists (for production compatibility)
 */
let otpTableChecked = false;

export const ensureOTPTable = async (): Promise<void> => {
  if (otpTableChecked) return;

  const queryRunner = AppDataSource.createQueryRunner();
  try {
    await queryRunner.connect();
    
    // Check if table exists
    const tableExists = await queryRunner.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='otp_codes'`
    );

    if (tableExists.length === 0) {
      // Create table with UUID support (VARCHAR for SQLite)
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS otp_codes (
          id VARCHAR(36) PRIMARY KEY,
          email VARCHAR NOT NULL,
          code VARCHAR(6) NOT NULL,
          purpose VARCHAR NOT NULL,
          verified INTEGER DEFAULT 0,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create index on email
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email)
      `);

      console.log('✅ Created otp_codes table');
    } else {
      console.log('✅ otp_codes table already exists');
    }
    otpTableChecked = true;
  } catch (error) {
    console.error('⚠️  Không thể đảm bảo bảng otp_codes:', error);
  } finally {
    await queryRunner.release();
  }
};

/**
 * Generate 6-digit OTP code
 */
const generateOTPCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP code via email
 */
export const sendOTP = async (
  email: string,
  purpose: string = 'register'
): Promise<{ code: string; expiresAt: Date }> => {
  // Ensure table exists before using
  await ensureOTPTable();
  
  const otpRepository = getOTPRepository();

  // Generate OTP code
  const code = generateOTPCode();

  // OTP expires in 10 minutes
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  // Delete old unverified OTPs for this email and purpose
  await otpRepository.delete({
    email: email.toLowerCase(),
    purpose,
    verified: false,
  });

  // Create new OTP
  const otp = otpRepository.create({
    email: email.toLowerCase(),
    code,
    purpose,
    expiresAt,
    verified: false,
  });

  await otpRepository.save(otp);

  // Send OTP via email
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const getPurposeText = () => {
    if (purpose === 'register') return 'đăng ký tài khoản';
    if (purpose === 'change_password') return 'đổi mật khẩu';
    if (purpose === 'forgot_password') return 'đặt lại mật khẩu';
    return 'xác thực';
  };
  const emailSubject = purpose === 'register' 
    ? 'Mã xác thực đăng ký tài khoản' 
    : purpose === 'change_password'
    ? 'Mã xác thực đổi mật khẩu'
    : purpose === 'forgot_password'
    ? 'Mã xác thực đặt lại mật khẩu'
    : 'Mã xác thực OTP';

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-code { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 20px 0; border-radius: 8px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Mã xác thực OTP</h1>
        </div>
        <div class="content">
          <p>Xin chào,</p>
          <p>Bạn đã yêu cầu mã xác thực để ${getPurposeText()}. Mã OTP của bạn là:</p>
          <div class="otp-code">${code}</div>
          <div class="warning">
            <strong>⚠️ Lưu ý:</strong> Mã OTP này có hiệu lực trong <strong>10 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.
          </div>
          <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
          <p>Trân trọng,<br>Đội ngũ Quản lý Chi phí Xây nhà</p>
        </div>
        <div class="footer">
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await emailService.sendMail({
      to: email,
      subject: emailSubject,
      html: emailHtml,
    });
    console.log(`✅ OTP sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    // Vẫn trả về code để có thể test trong development
    if (process.env.NODE_ENV === 'production') {
      throw new AppError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        'Không thể gửi email OTP. Vui lòng thử lại sau.'
      );
    }
  }

  return { code, expiresAt };
};

/**
 * Verify OTP code
 */
export const verifyOTP = async (
  email: string,
  code: string,
  purpose: string = 'register'
): Promise<boolean> => {
  // Ensure table exists before using
  await ensureOTPTable();
  
  const otpRepository = getOTPRepository();

  // Find OTP
  const otp = await otpRepository.findOne({
    where: {
      email: email.toLowerCase(),
      code,
      purpose,
      verified: false,
    },
    order: {
      createdAt: 'DESC',
    },
  });

  if (!otp) {
    throw new AppError(ErrorCode.INVALID_OTP, 'Mã OTP không hợp lệ');
  }

  // Check if expired
  if (new Date() > otp.expiresAt) {
    throw new AppError(ErrorCode.OTP_EXPIRED, 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.');
  }

  // Mark as verified
  otp.verified = true;
  await otpRepository.save(otp);

  return true;
};

/**
 * Check if OTP is verified for email and purpose
 */
export const isOTPVerified = async (
  email: string,
  purpose: string = 'register'
): Promise<boolean> => {
  // Ensure table exists before using
  await ensureOTPTable();
  
  const otpRepository = getOTPRepository();

  const verifiedOTP = await otpRepository.findOne({
    where: {
      email: email.toLowerCase(),
      purpose,
      verified: true,
    },
    order: {
      createdAt: 'DESC',
    },
  });

  if (!verifiedOTP) {
    return false;
  }

  // Check if verification is still valid (within 30 minutes)
  const verificationValidUntil = new Date(verifiedOTP.createdAt);
  verificationValidUntil.setMinutes(verificationValidUntil.getMinutes() + 30);

  return new Date() <= verificationValidUntil;
};

/**
 * Clean up expired OTPs (cron job)
 */
export const cleanupExpiredOTPs = async (): Promise<void> => {
  const otpRepository = getOTPRepository();

  const result = await otpRepository
    .createQueryBuilder()
    .delete()
    .where('expires_at < :now', { now: new Date() })
    .andWhere('verified = :verified', { verified: false })
    .execute();

  console.log(`🧹 Cleaned up ${result.affected || 0} expired OTPs`);
};

