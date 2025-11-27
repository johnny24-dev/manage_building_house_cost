# Hướng dẫn cấu hình Port cho hệ thống

## ⚠️ QUAN TRỌNG: Checklist khi đổi port

Khi đổi port, bạn **PHẢI** cập nhật các biến môi trường sau:

### Backend (`BE/.env`):
- ✅ `PORT` - Port để chạy Backend server
- ✅ `FRONTEND_URL` - URL của Frontend (phải khớp với port FE)

### Frontend (`FE/.env.local` hoặc `.env`):
- ✅ `PORT` - Port để chạy Frontend server  
- ✅ `NEXT_PUBLIC_API_URL` - URL của Backend API (phải khớp với port BE)

### Docker Compose (`.env` ở thư mục gốc):
- ✅ `FE_PORT` - Port mapping cho Frontend
- ✅ `BE_PORT` - Port mapping cho Backend

## Cấu hình mẫu

### Mặc định (Port 3000 cho FE, 9000 cho BE)

**File `BE/.env`:**
```env
PORT=9000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
DB_PATH=./database.sqlite
JWT_SECRET=your-secret-key
# ... các biến khác
```

**File `FE/.env.local`:**
```env
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:9000/api
NEXT_PUBLIC_ENV=development
```

**File `.env` ở thư mục gốc (cho Docker):**
```env
FE_PORT=3000
BE_PORT=9000
```

### Ví dụ: Đổi sang Port 4000 (FE) và 8000 (BE)

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

**File `.env` ở thư mục gốc (cho Docker):**
```env
FE_PORT=4000
BE_PORT=8000
```

## Các bước cấu hình

### 1. Tạo file cấu hình

**Backend:**
```bash
cd BE
cp .env.example .env  # Nếu có file .env.example
# Hoặc tạo file .env mới
```

**Frontend:**
```bash
cd FE
cp .env.example .env.local  # Nếu có file .env.example
# Hoặc tạo file .env.local mới
```

### 2. Cập nhật các biến môi trường

Đảm bảo các biến sau được cấu hình đúng:

**Backend (`BE/.env`):**
- `PORT` = Port bạn muốn Backend chạy
- `FRONTEND_URL` = `http://localhost:<PORT_FE>`

**Frontend (`FE/.env.local`):**
- `PORT` = Port bạn muốn Frontend chạy
- `NEXT_PUBLIC_API_URL` = `http://localhost:<PORT_BE>/api`

### 3. Restart services

Sau khi đổi port, **PHẢI** restart cả FE và BE:

```bash
# Nếu chạy với Docker
docker-compose down
docker-compose up -d

# Nếu chạy trực tiếp
# Dừng FE và BE (Ctrl+C)
# Sau đó chạy lại
cd BE && npm run dev
cd FE && npm run dev
```

## Troubleshooting

### ❌ Lỗi CORS

**Triệu chứng:** Browser console hiển thị lỗi CORS

**Nguyên nhân:** `FRONTEND_URL` trong `BE/.env` không khớp với port của Frontend

**Giải pháp:**
1. Kiểm tra port Frontend đang chạy
2. Cập nhật `FRONTEND_URL` trong `BE/.env` để khớp
3. Restart Backend

### ❌ Không kết nối được API

**Triệu chứng:** Frontend không gọi được API, lỗi network

**Nguyên nhân:** `NEXT_PUBLIC_API_URL` trong `FE/.env.local` không khớp với port của Backend

**Giải pháp:**
1. Kiểm tra port Backend đang chạy
2. Cập nhật `NEXT_PUBLIC_API_URL` trong `FE/.env.local` để khớp
3. **QUAN TRỌNG:** Restart Next.js dev server (Ctrl+C rồi chạy lại `npm run dev`)
4. Xóa cache nếu cần: `rm -rf FE/.next`

### ❌ Port đã được sử dụng

**Triệu chứng:** Lỗi "Port already in use" hoặc "EADDRINUSE"

**Giải pháp:**
1. Tìm process đang dùng port:
   ```bash
   # macOS/Linux
   lsof -i :3000
   lsof -i :9000
   
   # Windows
   netstat -ano | findstr :3000
   ```
2. Kill process hoặc đổi sang port khác

### ❌ Docker port conflict

**Triệu chứng:** Docker không start được, lỗi port binding

**Giải pháp:**
1. Kiểm tra port đã được sử dụng:
   ```bash
   docker ps
   ```
2. Dừng container đang dùng port:
   ```bash
   docker-compose down
   ```
3. Hoặc đổi port trong `.env` ở thư mục gốc

## Kiểm tra cấu hình đúng

### 1. Kiểm tra Backend đang chạy ở port nào:
```bash
# Xem log của Backend
cd BE
npm run dev
# Hoặc với Docker
docker-compose logs backend
```

### 2. Kiểm tra Frontend đang chạy ở port nào:
```bash
# Xem log của Frontend
cd FE
npm run dev
# Hoặc với Docker
docker-compose logs frontend
```

### 3. Kiểm tra biến môi trường:
```bash
# Backend
cd BE
cat .env | grep PORT
cat .env | grep FRONTEND_URL

# Frontend
cd FE
cat .env.local | grep PORT
cat .env.local | grep NEXT_PUBLIC_API_URL
```

### 4. Test kết nối:
```bash
# Test Backend
curl http://localhost:9000

# Test Frontend
curl http://localhost:3000
```

## Lưu ý đặc biệt

1. **Next.js cache**: Sau khi đổi `NEXT_PUBLIC_API_URL`, phải restart Next.js dev server và có thể cần xóa cache `.next`

2. **Docker network**: Khi chạy với Docker, Frontend API routes (server-side) cần dùng `BACKEND_INTERNAL_URL` hoặc tên service `backend` thay vì `localhost`

3. **Environment variables**: 
   - `NEXT_PUBLIC_*` variables được expose ra client-side
   - Variables không có prefix chỉ dùng ở server-side
   - File `.env.local` có priority cao hơn `.env` trong Next.js

4. **CORS**: Backend chỉ chấp nhận request từ `FRONTEND_URL` đã cấu hình. Đảm bảo khớp với port Frontend.

