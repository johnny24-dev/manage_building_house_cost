# Website Quản lý Chi phí Xây nhà

Hệ thống quản lý chi phí xây dựng nhà với giao diện dashboard admin hiện đại, được xây dựng bằng Next.js, React, và Tailwind CSS.

## 🚀 Tính năng

- **Dashboard tổng quan**: Xem thống kê tổng quan về chi phí với biểu đồ trực quan
- **Quản lý chi phí**: Thêm, sửa, xóa các khoản chi phí
- **Quản lý hạng mục**: Phân loại và quản lý các hạng mục chi phí
- **Báo cáo**: Xem báo cáo chi tiết và phân tích chi phí
- **Cài đặt**: Quản lý thông tin dự án và cài đặt hệ thống

## 🛠️ Công nghệ sử dụng

- **Next.js 16** - Framework React với App Router
- **React 19** - Thư viện UI
- **Tailwind CSS 4** - Framework CSS utility-first
- **Recharts** - Thư viện biểu đồ
- **Lucide React** - Icon library
- **TypeScript** - Type safety

## 📦 Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình Environment Variables

Tạo file `.env.local` từ `.env.example`:

```bash
cp .env.example .env.local
```

Hoặc tạo file `.env.local` với nội dung:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:9000/api

# Environment
NEXT_PUBLIC_ENV=development
```

**Lưu ý:**
- `NEXT_PUBLIC_API_URL`: URL của Backend API (mặc định: `http://localhost:9000/api`)
- Đảm bảo Backend đang chạy ở port 9000 (hoặc cập nhật URL tương ứng)

### 3. Chạy ứng dụng

```bash
# Chạy development server
npm run dev

# Build production
npm run build

# Chạy production server
npm start
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## 📁 Cấu trúc dự án

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Trang Dashboard
│   ├── costs/             # Trang quản lý chi phí
│   ├── categories/        # Trang quản lý hạng mục
│   ├── reports/           # Trang báo cáo
│   └── settings/          # Trang cài đặt
├── components/
│   ├── layout/            # Layout components (Sidebar, Navbar)
│   ├── ui/                # UI components (Button, Input, Card, etc.)
│   ├── charts/            # Chart components
│   └── dashboard/         # Dashboard specific components
├── lib/                   # Utilities và helpers
└── types/                 # TypeScript types
```

## 🎨 Tính năng UI/UX

- ✅ Giao diện hiện đại, sáng sủa
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Sidebar với menu điều hướng
- ✅ Navbar với tìm kiếm và thông báo
- ✅ Biểu đồ trực quan với Recharts
- ✅ Modal forms cho thêm/sửa dữ liệu
- ✅ Data tables với pagination
- ✅ Loading states và error handling

## 📊 Các trang chính

1. **Dashboard** (`/`) - Tổng quan với thống kê và biểu đồ
2. **Quản lý chi phí** (`/costs`) - CRUD chi phí
3. **Hạng mục** (`/categories`) - Quản lý hạng mục chi phí
4. **Báo cáo** (`/reports`) - Báo cáo và phân tích
5. **Cài đặt** (`/settings`) - Cài đặt hệ thống

## 🔧 Development

Dự án sử dụng:
- TypeScript cho type safety
- ESLint cho code quality
- Tailwind CSS cho styling
- Component-based architecture

## 🔐 Environment Variables

Dự án sử dụng các environment variables sau (prefix `NEXT_PUBLIC_` để expose ra client-side):

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `NEXT_PUBLIC_API_URL` | URL của Backend API | `http://localhost:9000/api` |
| `NEXT_PUBLIC_ENV` | Môi trường (development/production) | `development` |

**Lưu ý:**
- File `.env.local` được gitignore và không được commit
- File `.env.example` chứa template cho các biến môi trường
- Next.js tự động load các file `.env.local`, `.env.development`, `.env.production`

## 📝 Ghi chú

- ✅ Đã tích hợp với Backend API
- ✅ Sử dụng environment variables để cấu hình API URL
- ✅ Có thể mở rộng thêm tính năng export PDF, Excel cho báo cáo

## 📄 License

MIT

## 🐳 Triển khai bằng Docker

### Build và chạy production server

```bash
docker build -t mange-cost-fe .
docker run -d --name mange-cost-fe -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL=https://your-backend-domain/api \
  mange-cost-fe
```

Frontend đã được cấu hình sẵn `Dockerfile` và `docker-compose.yml` ở thư mục gốc (xem README backend) để deploy kèm backend.
