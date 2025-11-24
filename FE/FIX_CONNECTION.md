# Sửa lỗi: POST http://localhost:3000/api/auth/login 404

## Vấn đề
Frontend đang gọi API đến chính nó (port 3000) thay vì Backend (port 9000).

## Nguyên nhân
Next.js chưa load biến môi trường `NEXT_PUBLIC_API_URL` từ file `.env.local`.

## Giải pháp

### Bước 1: Kiểm tra file .env.local
```bash
cd FE
cat .env.local
```

Phải có:
```env
NEXT_PUBLIC_API_URL=http://localhost:9000/api
NEXT_PUBLIC_ENV=development
```

### Bước 2: Xóa cache và restart Next.js
```bash
cd FE

# Xóa cache
rm -rf .next

# Restart dev server
npm run dev
```

**QUAN TRỌNG**: Phải restart Next.js sau khi tạo/sửa file `.env.local`!

### Bước 3: Kiểm tra trong Browser Console
Mở http://localhost:3000 và kiểm tra Console (F12):
- Phải thấy: `🌐 API URL: http://localhost:9000/api`
- KHÔNG được thấy: `http://localhost:3000/api`

### Bước 4: Nếu vẫn không được

#### Option A: Hard refresh browser
- Windows/Linux: `Ctrl + Shift + R` hoặc `Ctrl + F5`
- Mac: `Cmd + Shift + R`

#### Option B: Kiểm tra file .env (không phải .env.local)
```bash
cd FE
cat .env
```

Nếu file `.env` có `NEXT_PUBLIC_API_URL` với giá trị sai, hãy xóa hoặc sửa nó.

#### Option C: Set biến môi trường trực tiếp khi chạy
```bash
cd FE
NEXT_PUBLIC_API_URL=http://localhost:9000/api npm run dev
```

### Bước 5: Verify
Sau khi restart, trong Browser Console phải thấy:
```
🌐 API URL: http://localhost:9000/api
🔗 API Client initialized with URL: http://localhost:9000/api
```

Nếu vẫn thấy `localhost:3000`, có nghĩa là Next.js chưa load biến môi trường.

## Lưu ý
- Next.js chỉ load biến môi trường khi **khởi động server**
- Phải **restart** sau mỗi lần sửa `.env.local`
- Biến môi trường phải có prefix `NEXT_PUBLIC_` để expose ra client-side
- File `.env.local` có priority cao hơn `.env`

