## 🐳 Triển khai bằng Docker

### Backend

```bash
cd BE
docker build -t mange-cost-be .
docker run -d --name mange-cost-be -p 9000:9000 \
  -e NODE_ENV=production \
  -e PORT=9000 \
  -e FRONTEND_URL=https://your-frontend-domain \
  -e JWT_SECRET=your-secret \
  -e NEXT_PUBLIC_API_URL=https://your-backend-domain/api \
  mange-cost-be
```

### Frontend

```bash
cd FE
docker build -t mange-cost-fe .
docker run -d --name mange-cost-fe -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL=https://your-backend-domain/api \
  mange-cost-fe
```

### Docker Compose

Ở thư mục gốc, có `docker-compose.yml` để chạy cả FE và BE:

```bash
FRONTEND_URL=https://your-frontend-domain \
NEXT_PUBLIC_API_URL=https://your-backend-domain/api \
JWT_SECRET=your-secret \
docker compose up --build -d
```

# API Quản lý chi phí xây nhà

Backend REST API được xây dựng bằng Node.js + Express + TypeScript + SQLite + TypeORM để quản lý chi phí xây nhà.

## 🚀 Công nghệ

- **Node.js** + **Express**
- **TypeScript**
- **SQLite** (better-sqlite3)
- **TypeORM** (ORM)
- **JWT** (Xác thực)
- **bcrypt** (Mã hóa mật khẩu)
- **CORS** (Cross-Origin Resource Sharing)

## 📁 Cấu trúc thư mục

```
src/
├── config/           # Cấu hình (database, etc.)
├── constants/        # Constants (status codes, messages)
├── controllers/      # Controllers xử lý request/response
├── entities/         # Database entities/models
├── middleware/       # Middleware (auth, error handler, CORS)
├── routes/          # API routes
├── scripts/          # Scripts (init DB, test connection)
├── services/         # Business logic
├── utils/            # Utilities (JWT, validation, response)
├── index.ts         # Entry point
└── server.ts        # Server configuration
```

## 🛠️ Cài đặt

### 1. Yêu cầu hệ thống

- Node.js >= 20.x (khuyến nghị 20.x, 22.x, 23.x, 24.x, 25.x)
- npm hoặc yarn

### 2. Clone repository và cài đặt dependencies

```bash
# Di chuyển vào thư mục dự án
cd BE

# Cài đặt dependencies
npm install
```

### 3. Cấu hình môi trường

Tạo file `.env` trong thư mục root:

```env
# Server
PORT=3000
NODE_ENV=development

# SQLite Database
# DB_PATH có thể tùy chỉnh, mặc định sẽ là database.sqlite trong thư mục root
# DB_PATH=./database.sqlite
DB_BACKUP_ENABLED=true
DB_BACKUP_DIR=./backups
DB_BACKUP_TIME=02:00
DB_BACKUP_RETENTION_DAYS=7

# JWT
JWT_SECRET=your-secret-key-change-in-production-please-change-this
JWT_EXPIRES_IN=7d

# Super Admin (tự động tạo khi init DB)
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=Admin123456

# CORS (Frontend URL)
FRONTEND_URL=http://localhost:3000

# Email Notifications (SMTP)
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password
# Tùy chọn: nếu bỏ trống sẽ dùng EMAIL_USER
EMAIL_FROM="Manage Cost Building House" <your_email@example.com>
```

### 4. Khởi tạo Database

```bash
# Khởi tạo database và tạo super admin mặc định
npm run init:db
```

Script này sẽ:
- Tạo các bảng trong database (users, cost_categories, notes, capital_allocations, advance_payments, design_files)
- Tạo super admin mặc định với email và password từ file `.env`

### 5. Chạy server

**Development mode (với hot reload):**
```bash
npm run dev
```

**Production mode:**
```bash
# Build TypeScript
npm run build

# Chạy server
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

## 📊 Database Migration

### SQLite Database

Database sử dụng SQLite, file database sẽ được tạo tự động tại `database.sqlite` trong thư mục root.

**TypeORM sẽ tự động:**
- Tạo các bảng khi server khởi động (trong development mode)
- Đồng bộ schema với entities

**Lưu ý:**
- Trong production, nên tắt `synchronize` và sử dụng migrations
- File `database.sqlite` đã được thêm vào `.gitignore`

### Các bảng trong database:

1. **users** - Người dùng
   - id (UUID)
   - email (unique)
   - password_hash
   - role (super_admin, viewer)
   - created_at

2. **cost_categories** - Hạng mục chi phí
   - id (UUID)
   - name
   - type (phan_tho, hoan_thien, dien_nuoc, noi_that, phap_ly, phat_sinh)
   - quantity, unit_price, total
   - note
   - created_at, updated_at

3. **notes** - Ghi chú cho hạng mục
   - id (UUID)
   - category_id (FK)
   - content
   - created_at, updated_at

4. **capital_allocations** - Phân bố vốn
   - id (UUID)
   - total_budget
   - Các phần trăm và số tiền cho từng loại
   - created_at, updated_at

5. **advance_payments** - Tạm ứng thi công
   - id (UUID)
   - payment_date
   - phase
   - amount
   - status (paid, planned)
   - created_at, updated_at

6. **design_files** - File PDF thiết kế
   - id (UUID)
   - file_name
   - original_name
   - file_path
   - uploaded_at

## 🔐 Authentication & Authorization

### User Roles

- **super_admin**: Toàn quyền (tạo/sửa/xóa tất cả)
- **viewer**: Chỉ có quyền xem

### Đăng ký/Đăng nhập

**Đăng ký (tự động tạo viewer):**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Đăng nhập:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Admin123456"
}
```

**Response:**
```json
{
  "success": true,
  "code": "LOGIN_SUCCESS",
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": "...",
      "email": "admin@example.com",
      "role": "super_admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Sử dụng Token

Tất cả các API (trừ `/api/auth/*`) đều yêu cầu JWT token trong header:

```http
Authorization: Bearer <your-jwt-token>
```

## 📚 API Endpoints

### Authentication

- `POST /api/auth/register` - Đăng ký (tạo viewer)
- `POST /api/auth/login` - Đăng nhập

### Dashboard

- `GET /api/dashboard/summary` - Tổng hợp thông tin dashboard

### Cost Categories (Hạng mục chi phí)

- `GET /api/cost-categories` - Lấy tất cả hạng mục (viewer + admin)
- `GET /api/cost-categories/:id` - Lấy hạng mục theo ID (viewer + admin)
- `POST /api/cost-categories` - Tạo hạng mục (chỉ admin)
- `PUT /api/cost-categories/:id` - Cập nhật hạng mục (chỉ admin)
- `DELETE /api/cost-categories/:id` - Xóa hạng mục (chỉ admin)

### Notes (Ghi chú)

- `GET /api/notes/category/:categoryId` - Lấy notes của category (viewer + admin)
- `GET /api/notes/:id` - Lấy note theo ID (viewer + admin)
- `POST /api/notes` - Tạo note (chỉ admin)
- `PUT /api/notes/:id` - Cập nhật note (chỉ admin)
- `DELETE /api/notes/:id` - Xóa note (chỉ admin)

### Capital Allocations (Phân bố vốn)

- `GET /api/capital-allocations` - Lấy phân bố vốn (viewer + admin)
- `POST /api/capital-allocations` - Tạo/cập nhật phân bố vốn (chỉ admin)
- `PUT /api/capital-allocations` - Cập nhật phân bố vốn (chỉ admin)

### Advance Payments (Tạm ứng)

- `GET /api/advance-payments` - Lấy tất cả tạm ứng (viewer + admin)
- `GET /api/advance-payments/:id` - Lấy tạm ứng theo ID (viewer + admin)
- `POST /api/advance-payments` - Tạo tạm ứng (chỉ admin)
- `PUT /api/advance-payments/:id` - Cập nhật tạm ứng (chỉ admin)
- `DELETE /api/advance-payments/:id` - Xóa tạm ứng (chỉ admin)

### Design Files (File thiết kế)

- `GET /api/design-files` - Lấy tất cả files (viewer + admin)
- `GET /api/design-files/:id` - Lấy file theo ID (viewer + admin)
- `POST /api/design-files` - Upload file (chỉ admin)
- `DELETE /api/design-files/:id` - Xóa file (chỉ admin)

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Thành công",
  "data": { ... },
  "timestamp": "2025-01-XX..."
}
```

### Error Response (Chuẩn)
```json
{
  "message": "Thông điệp lỗi",
  "errorCode": "ERROR_CODE"
}
```

**Ví dụ:**
```json
{
  "message": "Chỉ super admin mới có quyền thực hiện thao tác này",
  "errorCode": "FORBIDDEN"
}
```

## 🌐 CORS Configuration

CORS đã được cấu hình để cho phép frontend (Next.js) gọi API:

- **Origin**: Có thể cấu hình qua `FRONTEND_URL` trong `.env` (mặc định: `http://localhost:3000`)
- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Headers**: Content-Type, Authorization
- **Credentials**: true

## 🧪 Scripts

```bash
# Development (với hot reload)
npm run dev

# Build TypeScript
npm run build

# Start production
npm start

# Test database connection
npm run test:db

# Initialize database và tạo super admin
npm run init:db
```

## 🔒 Phân quyền

### Super Admin
- Toàn quyền: Tạo, sửa, xóa tất cả dữ liệu
- Xem tất cả dữ liệu

### Viewer
- Chỉ có quyền xem (GET requests)
- Không thể tạo, sửa, xóa

## 📊 Dashboard Summary

Endpoint `GET /api/dashboard/summary` trả về:

```json
{
  "success": true,
  "code": "SUCCESS",
  "data": {
    "totalCost": 50000000,
    "totalCostByType": {
      "phan_tho": 20000000,
      "hoan_thien": 15000000,
      "dien_nuoc": 5000000,
      "noi_that": 5000000,
      "phap_ly": 3000000,
      "phat_sinh": 2000000
    },
    "totalAdvancePayment": 10000000,
    "capitalAllocation": { ... }
  }
}
```

## 🐛 Error Handling

Tất cả lỗi được xử lý tập trung và trả về format chuẩn:

```json
{
  "message": "Thông điệp lỗi",
  "errorCode": "ERROR_CODE"
}
```

**Các mã lỗi phổ biến:**
- `VALIDATION_ERROR` - Lỗi validation dữ liệu
- `UNAUTHORIZED` - Chưa đăng nhập
- `FORBIDDEN` - Không có quyền
- `NOT_FOUND` - Không tìm thấy
- `INVALID_CREDENTIALS` - Sai email/password
- `INTERNAL_SERVER_ERROR` - Lỗi server

## 📄 License

ISC

## 👤 Super Admin mặc định

Sau khi chạy `npm run init:db`:
- **Email**: `admin@example.com` (có thể thay đổi trong `.env`)
- **Password**: `Admin123456` (có thể thay đổi trong `.env`)

**Lưu ý**: Đổi mật khẩu ngay sau lần đăng nhập đầu tiên!
