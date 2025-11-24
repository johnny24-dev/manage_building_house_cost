# Hướng dẫn Test Đăng nhập và Đăng ký

## Chuẩn bị

### 1. Đảm bảo Backend đang chạy
```bash
cd BE
npm run dev
```

Backend sẽ chạy ở: `http://localhost:9000`

### 2. Đảm bảo Frontend đang chạy
```bash
cd FE
npm run dev
```

Frontend sẽ chạy ở: `http://localhost:3000`

### 3. Kiểm tra Environment Variables

**FE/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:9000/api
NEXT_PUBLIC_ENV=development
```

**BE/.env:**
```env
PORT=9000
FRONTEND_URL=http://localhost:3000
```

## Test Đăng ký

### Bước 1: Truy cập trang đăng ký
- Mở browser: `http://localhost:3000/register`
- Hoặc click "Đăng ký ngay" từ trang login

### Bước 2: Điền thông tin
- **Email**: `test@example.com` (hoặc email bất kỳ)
- **Mật khẩu**: Phải có:
  - Ít nhất 6 ký tự
  - Ít nhất 1 chữ hoa (A-Z)
  - Ít nhất 1 chữ thường (a-z)
  - Ít nhất 1 số (0-9)
  - Ví dụ: `Test123456`
- **Xác nhận mật khẩu**: Nhập lại mật khẩu

### Bước 3: Submit form
- Click nút "Đăng ký"
- Nếu thành công: Sẽ tự động redirect về trang chủ (`/`)
- Nếu lỗi: Sẽ hiển thị thông báo lỗi

### Bước 4: Kiểm tra kết quả
- Mở Browser Console (F12)
- Xem log:
  - `📝 Attempting register with: { email: '...' }`
  - `✅ Register successful: { ... }`
- Kiểm tra localStorage:
  - `token`: Có token JWT
  - `user`: Có thông tin user (id, email, role)

## Test Đăng nhập

### Bước 1: Truy cập trang đăng nhập
- Mở browser: `http://localhost:3000/login`
- Hoặc click "Đăng nhập ngay" từ trang register

### Bước 2: Điền thông tin
- **Email**: Email đã đăng ký (ví dụ: `test@example.com`)
- **Mật khẩu**: Mật khẩu đã đăng ký (ví dụ: `Test123456`)

### Bước 3: Submit form
- Click nút "Đăng nhập"
- Nếu thành công: Sẽ tự động redirect về trang chủ (`/`)
- Nếu lỗi: Sẽ hiển thị thông báo lỗi

### Bước 4: Kiểm tra kết quả
- Mở Browser Console (F12)
- Xem log:
  - `🔐 Attempting login with: { email: '...' }`
  - `✅ Login successful: { ... }`
- Kiểm tra localStorage:
  - `token`: Có token JWT
  - `user`: Có thông tin user

## Test với Super Admin (nếu có)

Super Admin được tạo tự động khi BE khởi động lần đầu:
- **Email**: `admin@example.com` (hoặc từ env `SUPER_ADMIN_EMAIL`)
- **Password**: `Admin123456` (hoặc từ env `SUPER_ADMIN_PASSWORD`)

## Các lỗi thường gặp

### 1. "Email đã tồn tại"
- **Nguyên nhân**: Email đã được đăng ký trước đó
- **Giải pháp**: Dùng email khác hoặc đăng nhập với email đó

### 2. "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số"
- **Nguyên nhân**: Mật khẩu không đủ mạnh
- **Giải pháp**: Dùng mật khẩu có format: `Test123456`

### 3. "Email hoặc mật khẩu không đúng"
- **Nguyên nhân**: Email hoặc mật khẩu sai
- **Giải pháp**: Kiểm tra lại thông tin đăng nhập

### 4. "Không thể kết nối đến server"
- **Nguyên nhân**: Backend không chạy hoặc CORS chưa được cấu hình
- **Giải pháp**: 
  - Kiểm tra Backend có đang chạy không
  - Kiểm tra `FRONTEND_URL` trong BE/.env

## Debug trong Browser Console

Khi test, mở Browser Console (F12) để xem:
- API URL được sử dụng
- Request/Response details
- Error messages chi tiết

## Kiểm tra Network Tab

1. Mở DevTools (F12)
2. Chuyển sang tab "Network"
3. Thực hiện đăng nhập/đăng ký
4. Xem request:
   - **URL**: Phải là `http://localhost:9000/api/auth/login` hoặc `/register`
   - **Method**: POST
   - **Status**: 200 (thành công) hoặc 400/401 (lỗi)
   - **Response**: Xem cấu trúc response từ BE

## Cấu trúc Response từ BE

### Thành công:
```json
{
  "success": true,
  "code": "LOGIN_SUCCESS" | "REGISTER_SUCCESS",
  "message": "Đăng nhập thành công" | "Đăng ký thành công",
  "data": {
    "user": {
      "id": "uuid",
      "email": "test@example.com",
      "role": "viewer" | "super_admin",
      "createdAt": "2024-..."
    },
    "token": "jwt-token-here"
  },
  "timestamp": "2024-..."
}
```

### Lỗi:
```json
{
  "success": false,
  "code": "INVALID_CREDENTIALS" | "EMAIL_ALREADY_EXISTS" | "VALIDATION_ERROR",
  "message": "Email hoặc mật khẩu không đúng",
  "errors": [...],
  "timestamp": "2024-..."
}
```

