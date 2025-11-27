import bcrypt from 'bcrypt';
import { generateToken, TokenPayload } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants/statusCodes';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User.entity';
import { sendOTP, verifyOTP, isOTPVerified } from './otp.service';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

const getUserRepository = () => {
  return AppDataSource.getRepository(User);
};

/**
 * Đăng nhập người dùng
 */
export const loginService = async (
  credentials: LoginCredentials
): Promise<{ user: Omit<User, 'password'>; token: string }> => {
  const { email, password } = credentials;

  const userRepository = getUserRepository();

  // Tìm user theo email
  const user = await userRepository.findOne({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new AppError(ErrorCode.INVALID_CREDENTIALS);
  }

  // So sánh mật khẩu
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError(ErrorCode.INVALID_CREDENTIALS);
  }

  // Tạo token
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
  };

  const token = generateToken(tokenPayload);

  // Loại bỏ password khỏi response
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
};

/**
 * Gửi OTP để đăng ký
 */
export const sendRegisterOTP = async (email: string): Promise<{ expiresAt: Date }> => {
  const userRepository = getUserRepository();

  // Kiểm tra email đã tồn tại chưa
  const existingUser = await userRepository.findOne({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError(ErrorCode.EMAIL_ALREADY_EXISTS);
  }

  // Gửi OTP
  const { expiresAt } = await sendOTP(email, 'register');

  return { expiresAt };
};

/**
 * Đăng ký người dùng mới sau khi xác thực OTP (chỉ tạo viewer)
 */
export const registerService = async (
  credentials: RegisterCredentials & { otpCode: string }
): Promise<{ user: Omit<User, 'password'>; token: string }> => {
  const { email, password, otpCode } = credentials;

  const userRepository = getUserRepository();

  // Kiểm tra email đã tồn tại chưa
  const existingUser = await userRepository.findOne({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError(ErrorCode.EMAIL_ALREADY_EXISTS);
  }

  // Verify OTP
  await verifyOTP(email, otpCode, 'register');

  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Tạo user mới với role viewer
  const newUser = userRepository.create({
    email: email.toLowerCase(),
    password: hashedPassword,
    role: UserRole.VIEWER,
  });

  // Lưu vào database
  const savedUser = await userRepository.save(newUser);

  // Tạo token
  const tokenPayload: TokenPayload = {
    userId: savedUser.id,
    email: savedUser.email,
  };

  const token = generateToken(tokenPayload);

  // Loại bỏ password khỏi response
  const { password: _, ...userWithoutPassword } = savedUser;

  return {
    user: userWithoutPassword,
    token,
  };
};

/**
 * Tạo super admin mặc định (chỉ chạy 1 lần khi init)
 */
export const createDefaultSuperAdmin = async (): Promise<void> => {
  const userRepository = getUserRepository();

  // Kiểm tra đã có super admin chưa
  const existingSuperAdmin = await userRepository.findOne({
    where: { role: UserRole.SUPER_ADMIN },
  });

  if (existingSuperAdmin) {
    return; // Đã có super admin
  }

  // Tạo super admin mặc định
  const defaultEmail = process.env.SUPER_ADMIN_EMAIL || 'giangnam24042000@gmail.com';
  const defaultPassword = process.env.SUPER_ADMIN_PASSWORD || '123456';

  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const superAdmin = userRepository.create({
    email: defaultEmail,
    password: hashedPassword,
    role: UserRole.SUPER_ADMIN,
  });

  await userRepository.save(superAdmin);
  console.log(`✅ Super admin đã được tạo: ${defaultEmail}`);
};

