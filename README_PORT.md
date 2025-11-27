# Hướng dẫn tùy chỉnh cổng (Port) cho Frontend và Backend

## Tổng quan

Hệ thống cho phép tùy chỉnh cổng chạy của cả Frontend (FE) và Backend (BE) thông qua biến môi trường. **QUAN TRỌNG**: Khi đổi port, bạn phải cập nhật cả CORS và API URL để hệ thống hoạt động đúng.

## ⚠️ Lưu ý quan trọng

Khi đổi port, bạn **PHẢI** cập nhật 2 biến môi trường sau:

1. **`FRONTEND_URL`** trong `BE/.env` - Phải khớp với port của Frontend
2. **`NEXT_PUBLIC_API_URL`** trong `FE/.env` - Phải khớp với port của Backend

Nếu không cập nhật, hệ thống sẽ bị lỗi CORS hoặc không kết nối được API.

## Cách cấu hình

### 1. Chạy với Docker Compose (Khuyến nghị)

**Bước 1**: Tạo file `.env` ở thư mục gốc của project:
```env
# Cổng cho Frontend (mặc định: 3000)
FE_PORT=3000

# Cổng cho Backend (mặc định: 9000)
BE_PORT=9000
```

**Bước 2**: Cấu hình `BE/.env`:
```env
PORT=9000
FRONTEND_URL=http://localhost:3000
# ... các biến khác
```

**Bước 3**: Cấu hình `FE/.env.local` (hoặc `.env`):
```env
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:9000/api
```

**Bước 4**: Chạy Docker Compose:
```bash
docker-compose up -d
```

### 2. Chạy trực tiếp (Development)

#### Backend:
Tạo file `BE/.env` (copy từ `BE/.env.example`):
```env
PORT=9000
FRONTEND_URL=http://localhost:3000
# ... các biến khác
```

Chạy:
```bash
cd BE
npm run dev
```

#### Frontend:
Tạo file `FE/.env.local` (copy từ `FE/.env.example`):
```env
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:9000/api
```

Chạy:
```bash
cd FE
npm run dev
```

### 3. Sử dụng biến môi trường trực tiếp

```bash
# Backend
cd BE
PORT=9000 FRONTEND_URL=http://localhost:3000 npm run dev

# Frontend
cd FE
PORT=3000 NEXT_PUBLIC_API_URL=http://localhost:9000/api npm run dev
```

## Ví dụ: Đổi FE sang port 4000, BE sang port 8000

### Với Docker Compose:

**File `.env` ở thư mục gốc:**
```env
FE_PORT=4000
BE_PORT=8000
```

**File `BE/.env`:**
```env
PORT=8000
FRONTEND_URL=http://localhost:4000
# ... các biến khác
```

**File `FE/.env.local`:**
```env
PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Sau đó chạy:
```bash
docker-compose up -d
```

Frontend sẽ chạy tại: `http://localhost:4000`  
Backend sẽ chạy tại: `http://localhost:8000`

### Với Development (chạy trực tiếp):

**File `BE/.env`:**
```env
PORT=8000
FRONTEND_URL=http://localhost:4000
# ... các biến khác
```

**File `FE/.env.local`:**
```env
PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Checklist khi đổi port

- [ ] Cập nhật `PORT` trong `BE/.env`
- [ ] Cập nhật `FRONTEND_URL` trong `BE/.env` (phải khớp với port FE)
- [ ] Cập nhật `PORT` trong `FE/.env.local` (hoặc `.env`)
- [ ] Cập nhật `NEXT_PUBLIC_API_URL` trong `FE/.env.local` (phải khớp với port BE)
- [ ] Nếu dùng Docker: Cập nhật `FE_PORT` và `BE_PORT` trong `.env` ở thư mục gốc
- [ ] Restart cả FE và BE sau khi đổi port
- [ ] Kiểm tra CORS không bị lỗi
- [ ] Kiểm tra API calls hoạt động đúng

## Troubleshooting

### Lỗi CORS
- **Nguyên nhân**: `FRONTEND_URL` trong `BE/.env` không khớp với port của Frontend
- **Giải pháp**: Cập nhật `FRONTEND_URL` trong `BE/.env` để khớp với port FE

### Không kết nối được API
- **Nguyên nhân**: `NEXT_PUBLIC_API_URL` trong `FE/.env.local` không khớp với port của Backend
- **Giải pháp**: Cập nhật `NEXT_PUBLIC_API_URL` trong `FE/.env.local` để khớp với port BE
- **Lưu ý**: Sau khi đổi `NEXT_PUBLIC_API_URL`, phải restart Next.js dev server

### Port đã được sử dụng
- **Nguyên nhân**: Port đang được process khác sử dụng
- **Giải pháp**: Đổi sang port khác hoặc kill process đang dùng port đó

