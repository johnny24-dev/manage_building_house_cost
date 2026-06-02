# 🐳 Hướng dẫn Cài đặt Docker & Deploy 1-Command

Tài liệu này hướng dẫn cách deploy toàn bộ hệ thống (Frontend + Backend + Database) lên VPS mới hoặc máy chủ khác chỉ với **1 lệnh duy nhất** thông qua script tự động.

---

## 📋 Yêu cầu Hệ thống tối thiểu
* Hỗ trợ mọi Linux Distro (Ubuntu, Debian, CentOS, Rocky Linux, Alma Linux)
* Tối thiểu 2GB RAM (khuyến nghị có thêm swap)
* 5GB dung lượng ổ cứng trống

---

## 🚀 Cài đặt Nhanh (1 lệnh duy nhất)

Bạn chỉ cần thực hiện 2 bước đơn giản trên VPS mới của mình:

### Bước 1: Clone dự án và truy cập thư mục
```bash
git clone <repository-url>
cd mange_cost_building_house
```

### Bước 2: Chạy Script Deploy Tự Động

* **Trên Linux/macOS:**
  Chạy lệnh sau đây trên terminal:
  ```bash
  bash start.sh
  ```

* **Trên Windows:**
  Nhấp đúp chuột (Double-click) vào file `start.bat` hoặc chạy trong Command Prompt:
  ```cmd
  start.bat
  ```

**Điều kỳ diệu gì sẽ xảy ra?** Script `start.sh` được tích hợp công nghệ deploy tự động sẽ thực hiện toàn bộ:
1. **Kiểm tra & Cài đặt Docker:** Tự động phát hiện và cài đặt Docker chính thức nếu VPS chưa có.
2. **Kiểm tra & Cài đặt Docker Compose:** Tự động cài đặt Docker Compose Plugin V2 hoặc Standalone tùy hệ điều hành.
3. **Cấu hình biến môi trường:** Tự động tạo tệp cấu hình `.env` từ `.env.example`, đồng thời tự động sinh mã khóa bí mật `JWT_SECRET` ngẫu nhiên bảo mật cao.
4. **Tạo thư mục và phân quyền:** Tạo thư mục lưu database SQLite và ảnh hóa đơn upload, áp dụng phân quyền an toàn.
5. **Dựng và Biên dịch ứng dụng:** Khởi chạy `docker compose up -d --build` để build image Docker tối ưu hóa dung lượng cho môi trường production.
6. **Healthcheck:** Tự động kiểm tra trạng thái sức khỏe của Backend cho đến khi hoạt động ổn định và in báo cáo kết quả đẹp mắt trên terminal.

---

## 🌐 Đường dẫn Truy cập Mặc định

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

