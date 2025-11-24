# Hướng dẫn xử lý lỗi kết nối FE - BE

## Kiểm tra kết nối

### 1. Kiểm tra Backend có đang chạy không

```bash
# Chạy Backend
cd BE
npm run dev

# Kiểm tra Backend đang chạy ở port nào
# Mặc định: http://localhost:9000
```

### 2. Kiểm tra Frontend có đang chạy không

```bash
# Chạy Frontend
cd FE
npm run dev

# Frontend chạy ở: http://localhost:3000
```

### 3. Kiểm tra Environment Variables

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:9000/api
NEXT_PUBLIC_ENV=development
```

**Backend (.env):**
```env
PORT=9000
FRONTEND_URL=http://localhost:3000
```

### 4. Kiểm tra CORS

Backend phải cho phép origin từ `http://localhost:3000` (port của Next.js)

### 5. Các lỗi thường gặp

#### Lỗi: "Network Error" hoặc "ERR_CONNECTION_REFUSED"
- **Nguyên nhân**: Backend không chạy hoặc sai port
- **Giải pháp**: 
  - Kiểm tra Backend có đang chạy không
  - Kiểm tra port trong `.env` của BE (mặc định: 9000)
  - Kiểm tra `NEXT_PUBLIC_API_URL` trong `.env.local` của FE

#### Lỗi: "CORS policy" 
- **Nguyên nhân**: CORS không được cấu hình đúng
- **Giải pháp**:
  - Kiểm tra `FRONTEND_URL` trong BE `.env` phải là `http://localhost:3000`
  - Restart Backend sau khi sửa `.env`

#### Lỗi: "404 Not Found"
- **Nguyên nhân**: Endpoint không đúng
- **Giải pháp**:
  - Kiểm tra route trong BE có đúng không
  - Kiểm tra `NEXT_PUBLIC_API_URL` có đúng format không (phải có `/api` ở cuối)

### 6. Debug trong Browser Console

Mở Browser Console (F12) và kiểm tra:
- Log `🔗 API Client initialized with URL:` - xem API URL có đúng không
- Log `🌐 API URL:` - xem environment variable có load đúng không
- Network tab - xem request có được gửi đi không và response là gì

### 7. Test kết nối thủ công

```bash
# Test Backend health check
curl http://localhost:9000/

# Test API endpoint
curl http://localhost:9000/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 8. Checklist

- [ ] Backend đang chạy ở port 9000
- [ ] Frontend đang chạy ở port 3000
- [ ] File `.env.local` trong FE có `NEXT_PUBLIC_API_URL=http://localhost:9000/api`
- [ ] File `.env` trong BE có `FRONTEND_URL=http://localhost:3000`
- [ ] CORS trong BE cho phép origin từ `http://localhost:3000`
- [ ] Đã restart cả FE và BE sau khi sửa environment variables

