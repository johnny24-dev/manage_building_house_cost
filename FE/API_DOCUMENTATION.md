# API Documentation

Tài liệu về cách kết nối với Backend API (Express + SQLite)

## Cấu hình

### Environment Variables

Tạo file `.env.local` trong thư mục root:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### API Base URL

- Development: `http://localhost:3000/api`
- Production: Cấu hình theo môi trường deploy

## API Client

### Cấu hình

File: `src/lib/api-client.ts`

- **Base URL**: Tự động lấy từ `NEXT_PUBLIC_API_URL`
- **Timeout**: 30 giây
- **Headers**: Tự động thêm `Content-Type: application/json`

### Request Interceptor

Tự động thêm `Authorization: Bearer <token>` vào mọi request từ localStorage.

### Response Interceptor

- **401 Unauthorized**: Tự động xóa token và redirect về `/login`
- **Error handling**: Trả về error message từ backend

## API Endpoints

### Authentication

#### POST `/auth/login`
Đăng nhập

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "1",
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

#### POST `/auth/register`
Đăng ký

**Request:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** Tương tự `/auth/login`

#### POST `/auth/logout`
Đăng xuất

### Costs (Chi phí)

#### GET `/costs`
Lấy danh sách chi phí

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "description": "Xi măng, cát, đá",
      "amount": 45000000,
      "category": "Vật liệu",
      "date": "2024-06-15",
      "status": "paid",
      "note": "Ghi chú"
    }
  ]
}
```

#### POST `/costs`
Tạo chi phí mới

#### PUT `/costs/:id`
Cập nhật chi phí

#### DELETE `/costs/:id`
Xóa chi phí

### Categories (Hạng mục)

#### GET `/categories`
Lấy danh sách nhóm chi phí

#### POST `/categories`
Tạo nhóm mới

#### PUT `/categories/:id`
Cập nhật nhóm

#### DELETE `/categories/:id`
Xóa nhóm

#### GET `/categories/:categoryId/items`
Lấy danh sách hạng mục trong nhóm

#### POST `/categories/:categoryId/items`
Tạo hạng mục mới

#### PUT `/categories/:categoryId/items/:itemId`
Cập nhật hạng mục

#### DELETE `/categories/:categoryId/items/:itemId`
Xóa hạng mục

### Advances (Tạm ứng)

#### GET `/advances`
Lấy danh sách tạm ứng

#### POST `/advances`
Tạo phiếu tạm ứng mới

#### PUT `/advances/:id`
Cập nhật tạm ứng

#### DELETE `/advances/:id`
Xóa tạm ứng

### Files (File thiết kế)

#### GET `/files`
Lấy danh sách file

#### POST `/files/upload`
Upload file PDF

**Request:** `multipart/form-data`
- `file`: File PDF
- `description`: (optional) Mô tả

#### PUT `/files/:id`
Cập nhật thông tin file

#### DELETE `/files/:id`
Xóa file

### Dashboard

#### GET `/dashboard/stats`
Lấy thống kê tổng quan

#### GET `/dashboard/expense-chart`
Lấy dữ liệu biểu đồ chi phí

#### GET `/dashboard/category-distribution`
Lấy phân bổ theo hạng mục

## Response Format

Tất cả API responses đều theo format:

```typescript
{
  success: boolean;
  data: T; // Generic type
  message?: string; // Optional message
}
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Error details"
}
```

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized (tự động redirect về login)
- `404`: Not Found
- `500`: Internal Server Error

## Services

Tất cả services đều sử dụng `apiClient` từ `@/lib/api-client`:

- `authService` - Authentication
- `costService` - Chi phí
- `categoryService` - Hạng mục
- `advanceService` - Tạm ứng
- `fileService` - File thiết kế
- `dashboardService` - Dashboard stats

## Usage Example

```typescript
import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';

// GET request
const response = await apiClient.get<ApiResponse<Data[]>>('/endpoint');

// POST request
const response = await apiClient.post<ApiResponse<Data>>('/endpoint', {
  field1: 'value1',
  field2: 'value2',
});

// With custom headers (e.g., file upload)
const response = await apiClient.post<ApiResponse<File>>(
  '/files/upload',
  formData,
  {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }
);
```

## Notes

- Tất cả requests đều tự động thêm token từ localStorage
- Token được lưu sau khi login/register thành công
- Token được xóa khi logout hoặc nhận 401
- Có thể override headers trong config parameter

