# Hướng dẫn deploy lên VPS bằng Docker Compose

Tài liệu này giúp bạn đưa toàn bộ hệ thống (Backend + Frontend) lên VPS chỉ với một lệnh `docker compose up -d`.

## 1. Chuẩn bị VPS
- VPS đã cài **Docker Engine** và **Docker Compose v2**.
- Tài khoản có quyền sudo.
- Cổng 80/443 (Nginx/Reverse proxy) và cổng 3000/9000 (nếu truy cập thẳng) đã mở trên firewall.

## 2. Lấy mã nguồn
```bash
git clone https://github.com/your-org/mange_cost_building_house.git
cd mange_cost_building_house
```

Nếu có submodule:
```bash
git submodule update --init --recursive
```

## 3. Cấu hình biến môi trường (`.env` ở thư mục gốc)
Hệ thống sử dụng một file `.env` duy nhất tại thư mục gốc của dự án. Hãy chỉnh sửa file này trước khi build:

```env
# Cấu hình cổng hiển thị ra bên ngoài (Port Exposure)
FE_PORT=3000
BE_PORT=9000

# Địa chỉ Frontend và Backend truy cập công cộng (Public URL / Domain)
# Khi trỏ domain, thay thế bằng domain thật của bạn:
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api

# Khóa bảo mật JWT (Đã được sinh ngẫu nhiên)
JWT_SECRET=your-secure-production-secret

# Tài khoản Quản trị tối cao mặc định (Super Admin)
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=ChangeMe123

# Cấu hình dịch vụ gửi Email OTP (Tùy chọn)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@example.com
EMAIL_PASS=app-password
EMAIL_FROM=noreply@your-domain.com
```

> **Lưu ý**  
> - `FRONTEND_URL` dùng cho Backend cấu hình CORS và các đường link gửi qua email.  
> - `NEXT_PUBLIC_API_URL` là URL API của Backend mà trình duyệt (client-side) sẽ truy cập trực tiếp.  
> - Khi dùng Nginx/Reverse Proxy, trỏ domain chính tới cổng Frontend (`3000`) và đường dẫn `/api` tới cổng Backend (`9000`).
> - Thay chuỗi bí mật `JWT_SECRET`, mật khẩu admin, email theo môi trường thật của bạn.

## 4. Kiểm tra Dockerfile & docker-compose
Đã cấu hình sẵn:
- `BE/Dockerfile`, `FE/Dockerfile` build production.
- `docker-compose.yml` tự động đọc `BE/.env` và `FE/.env`, mount uploads/database, restart `unless-stopped`.

## 5. Chạy dịch vụ
```bash
docker compose up -d --build
```

Lệnh trên sẽ:
1. Build image backend + frontend.
2. Tạo containers `backend`, `frontend`.
3. Mở cổng 9000 (API) và 3000 (Next.js).

Kiểm tra trạng thái:
```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

## 6. Reverse proxy (tuỳ chọn)
Để public domain, cấu hình Nginx/Traefik trỏ tới:
- `frontend`: nội bộ `http://localhost:3000`
- `backend API`: `http://localhost:9000`

Ví dụ Nginx block:
```nginx
server {
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:9000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 7. Backup & nâng cấp
- **Database**: nằm tại `BE/database.sqlite`. Sao lưu định kỳ (rsync/scp).  
- **Uploads**: thư mục `BE/uploads`.  
- Khi cập nhật mã nguồn: `git pull`, sau đó `docker compose up -d --build`.
- Xoá container cũ nếu cần: `docker compose down`.

## 8. Kiểm tra sau deploy
- Truy cập `https://your-domain.com`: màn đăng nhập hiển thị?  
- Tạo tài khoản admin theo `SUPER_ADMIN_EMAIL`/`PASSWORD`.  
- Upload file PDF thử, mở trực tiếp.  
- Tạo/sửa/xoá dữ liệu kiểm tra toast + thông báo real-time.  
- Mở DevTools (Network) đảm bảo API trỏ đúng domain `/api`.

## 9. Troubleshooting nhanh
- `docker compose logs backend` thấy lỗi DB => kiểm tra quyền ghi `BE/database.sqlite`.  
- 401 SSE Notifications => chắc chắn token từ FE được truyền, đồng hồ hệ thống chính xác.  
- PDF proxy `ECONNREFUSED` => xác minh `BACKEND_INTERNAL_URL` và backend container hoạt động.  
- Build fail do thiếu RAM => tăng swap hoặc dùng `npm ci --prefer-offline` (đã sẵn).

---
Sau khi các biến `.env` được chỉnh đúng môi trường thật, toàn bộ quá trình deploy chỉ cần **một lệnh**:
```bash
docker compose up -d --build
```

Chúc bạn deploy thành công!

