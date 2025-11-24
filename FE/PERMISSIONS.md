# Phân quyền trong hệ thống

## Tổng quan

Hệ thống có 2 loại người dùng:
- **Super Admin**: Có đầy đủ quyền (thêm, sửa, xóa, xem)
- **Viewer**: Chỉ có quyền xem

## Quản lý Chi phí (Cost Categories)

### API Endpoints

**Tất cả người dùng (Viewer + Super Admin):**
- `GET /api/cost-categories` - Xem danh sách hạng mục
- `GET /api/cost-categories/:id` - Xem chi tiết hạng mục

**Chỉ Super Admin:**
- `POST /api/cost-categories` - Tạo hạng mục mới
- `PUT /api/cost-categories/:id` - Cập nhật hạng mục
- `DELETE /api/cost-categories/:id` - Xóa hạng mục

### Frontend Implementation

#### 1. Kiểm tra quyền trong component

```tsx
import { useAuth } from '@/stores/AuthContext';

const { isAdmin } = useAuth();

// Chỉ hiển thị nút "Thêm" cho admin
{isAdmin && (
  <Button onClick={handleAdd}>Thêm nhóm</Button>
)}
```

#### 2. Ẩn/hiện các nút thao tác

```tsx
<CategoryGroupList
  groups={groups}
  onEdit={isAdmin ? handleEdit : undefined}
  onDelete={isAdmin ? handleDelete : undefined}
/>
```

#### 3. Xử lý lỗi 403 (Forbidden)

Khi viewer cố gắng thực hiện thao tác không được phép:
- API sẽ trả về status 403
- Frontend sẽ hiển thị thông báo: "Bạn không có quyền thực hiện thao tác này. Chỉ super admin mới có quyền."

## Các module khác

### Tạm ứng (Advance Payments)
- **Viewer**: Xem danh sách, xem chi tiết
- **Super Admin**: Thêm, sửa, xóa

### File thiết kế (Design Files)
- **Viewer**: Xem danh sách, xem file
- **Super Admin**: Upload, xóa

### Phân bổ vốn (Capital Allocations)
- **Viewer**: Xem
- **Super Admin**: Tạo, cập nhật

### Ghi chú (Notes)
- **Viewer**: Xem theo category
- **Super Admin**: Tạo, sửa, xóa

## Kiểm tra quyền trong Frontend

### Sử dụng `useAuth` hook

```tsx
import { useAuth } from '@/stores/AuthContext';
import { UserRole, isSuperAdmin } from '@/constants/userRole';

function MyComponent() {
  const { user, isAdmin, isAuthenticated } = useAuth();

  // Kiểm tra role bằng enum (khuyến nghị)
  if (user?.role === UserRole.SUPER_ADMIN) {
    // Admin logic
  }

  // Hoặc dùng helper function
  if (isSuperAdmin(user?.role)) {
    // Admin logic
  }

  // Hoặc dùng isAdmin từ useAuth (tiện nhất)
  if (isAdmin) {
    // Admin logic
  }
}
```

### Hiển thị UI theo quyền

```tsx
{isAdmin ? (
  <Button onClick={handleEdit}>Sửa</Button>
) : (
  <span className="text-gray-400">Chỉ xem</span>
)}
```

## Error Handling

### Lỗi 401 (Unauthorized)
- Token không hợp lệ hoặc hết hạn
- Tự động redirect về `/login`

### Lỗi 403 (Forbidden)
- Không có quyền thực hiện thao tác
- Hiển thị thông báo lỗi, không redirect

### Lỗi 404 (Not Found)
- Resource không tồn tại
- Hiển thị thông báo lỗi

## Testing

### Test với Super Admin
1. Đăng nhập với tài khoản super admin
2. Kiểm tra các nút "Thêm", "Sửa", "Xóa" có hiển thị
3. Thực hiện các thao tác CRUD

### Test với Viewer
1. Đăng ký tài khoản mới (mặc định là viewer)
2. Kiểm tra các nút "Thêm", "Sửa", "Xóa" KHÔNG hiển thị
3. Chỉ có thể xem danh sách và chi tiết
4. Nếu cố gắng gọi API thêm/sửa/xóa → Nhận lỗi 403

