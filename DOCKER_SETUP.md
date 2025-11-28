# 🐳 Docker Setup Guide

Hướng dẫn chạy ứng dụng Quản lý Chi phí Xây nhà trên VPS mới chỉ với **1 lệnh duy nhất**.

## 📋 Yêu cầu

- Docker Engine 20.10+
- Docker Compose 2.0+
- Tối thiểu 2GB RAM
- Tối thiểu 5GB dung lượng ổ cứng

## 🚀 Cài đặt nhanh (1 lệnh)

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd mange_cost_building_house
```

### Bước 2: Tạo file .env
```bash
cp .env.example .env
```

### Bước 3: Chỉnh sửa .env (tùy chọn)
Mở file `.env` và cập nhật các giá trị nếu cần:
- `FE_PORT`: Port cho frontend (mặc định: 3000)
- `BE_PORT`: Port cho backend (mặc định: 9000)
- `JWT_SECRET`: Secret key cho JWT (BẮT BUỘC thay đổi trong production)
- `SUPER_ADMIN_EMAIL`: Email admin mặc định
- `SUPER_ADMIN_PASSWORD`: Mật khẩu admin mặc định
- Email config: Nếu muốn sử dụng tính năng OTP qua email

### Bước 4: Chạy ứng dụng
```bash
docker-compose up -d
```

**Xong!** Ứng dụng sẽ tự động:
- Build images cho frontend và backend
- Tạo database tự động
- Khởi tạo super admin
- Chạy cả 2 services

## 🌐 Truy cập ứng dụng

- **Frontend**: http://localhost:3000 (hoặc port bạn đã cấu hình)
- **Backend API**: http://localhost:9000 (hoặc port bạn đã cấu hình)

## 📝 Các lệnh hữu ích

### Xem logs
```bash
# Xem logs tất cả services
docker-compose logs -f

# Xem logs backend
docker-compose logs -f backend

# Xem logs frontend
docker-compose logs -f frontend
```

### Dừng ứng dụng
```bash
docker-compose down
```

### Dừng và xóa volumes (xóa database)
```bash
docker-compose down -v
```

### Khởi động lại
```bash
docker-compose restart
```

### Rebuild và chạy lại
```bash
docker-compose up -d --build
```

### Xem trạng thái services
```bash
docker-compose ps
```

## 🔧 Cấu hình nâng cao

### Thay đổi ports

Chỉnh sửa file `.env`:
```env
FE_PORT=8080
BE_PORT=9090
```

Sau đó restart:
```bash
docker-compose down
docker-compose up -d
```

### Cấu hình email (cho OTP)

Thêm vào file `.env`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@example.com
```

**Lưu ý**: Với Gmail, cần sử dụng [App Password](https://support.google.com/accounts/answer/185833) thay vì mật khẩu thông thường.

### Backup database

Database được lưu tại: `./BE/database/database.sqlite`

Để backup:
```bash
cp ./BE/database/database.sqlite ./BE/database/database.sqlite.backup
```

### Restore database

```bash
cp ./BE/database/database.sqlite.backup ./BE/database/database.sqlite
docker-compose restart backend
```

## 🐛 Xử lý lỗi

### Lỗi port đã được sử dụng

Nếu port đã được sử dụng, thay đổi port trong `.env`:
```env
FE_PORT=3001
BE_PORT=9001
```

### Lỗi permission

Nếu gặp lỗi permission với volumes:
```bash
sudo chown -R $USER:$USER ./BE/uploads ./BE/database
```

### Lỗi build

Nếu build bị lỗi, thử:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Xem logs chi tiết

```bash
docker-compose logs backend | tail -100
docker-compose logs frontend | tail -100
```

## 📦 Cấu trúc volumes

- `./BE/uploads`: Thư mục chứa file upload (hóa đơn, ảnh)
- `./BE/database`: Thư mục chứa database SQLite

## 🔒 Bảo mật Production

Khi deploy lên production, **BẮT BUỘC**:

1. Thay đổi `JWT_SECRET` thành một chuỗi ngẫu nhiên mạnh
2. Thay đổi `SUPER_ADMIN_PASSWORD` thành mật khẩu mạnh
3. Sử dụng reverse proxy (Nginx) với SSL/TLS
4. Cấu hình firewall chỉ mở các port cần thiết
5. Backup database thường xuyên

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Logs: `docker-compose logs -f`
2. Trạng thái: `docker-compose ps`
3. Health checks: `docker inspect <container-name> | grep Health`

