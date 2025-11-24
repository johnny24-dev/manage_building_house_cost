# Cấu trúc thư mục dự án

Dự án được tổ chức theo nguyên tắc Clean Code và Feature-Based Architecture.

## 📁 Cấu trúc thư mục

```
src/
├── app/                    # Next.js App Router (pages, layouts, routes)
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
│
├── components/            # React components
│   ├── common/           # Components dùng chung (Header, Footer, Loading)
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Loading.tsx
│   │   └── index.ts      # Export tất cả components
│   └── ui/               # UI components tái sử dụng (Button, Input, Card)
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       └── index.ts
│
├── features/              # Feature-based modules (tổ chức theo domain)
│   └── README.md         # Hướng dẫn cấu trúc feature
│
├── hooks/                 # Custom React hooks
│   ├── useLocalStorage.ts
│   ├── useDebounce.ts
│   └── index.ts
│
├── lib/                   # Library configurations và utilities
│   ├── api-client.ts      # API client configuration
│   ├── utils.ts           # Utility functions (cn, formatDate, formatCurrency)
│   └── index.ts
│
├── types/                 # TypeScript types và interfaces
│   └── index.ts           # Shared types (ApiResponse, PaginationParams, etc.)
│
├── constants/             # Application constants
│   └── index.ts           # API endpoints, routes, storage keys
│
├── services/              # API services
│   ├── auth.service.ts
│   ├── user.service.ts
│   └── index.ts
│
├── utils/                 # Helper utility functions
│   └── index.ts           # validateEmail, validatePhone, truncateText
│
└── stores/                # State management (Context API, Zustand, Redux)
    ├── AuthContext.tsx
    └── index.ts
```

## 🎯 Nguyên tắc tổ chức

### 1. **Components**
- `components/common/`: Components dùng chung trong toàn bộ ứng dụng
- `components/ui/`: UI components tái sử dụng (buttons, inputs, cards)

### 2. **Features**
- Tổ chức theo domain/feature
- Mỗi feature có thể chứa: components, hooks, services, types riêng
- Giúp code dễ maintain và scale

### 3. **Hooks**
- Custom hooks để tái sử dụng logic
- Ví dụ: `useLocalStorage`, `useDebounce`

### 4. **Services**
- Tách biệt logic gọi API
- Mỗi service tương ứng với một domain (auth, user, etc.)

### 5. **Types**
- Định nghĩa TypeScript types và interfaces
- Giúp type safety và code documentation

### 6. **Constants**
- Tập trung các hằng số: API endpoints, routes, storage keys
- Dễ maintain và tránh hardcode

### 7. **Utils & Lib**
- `lib/`: Configurations và utilities cấp cao
- `utils/`: Helper functions đơn giản

### 8. **Stores**
- State management (Context API, Zustand, Redux, etc.)
- Quản lý global state

## 📝 Cách sử dụng

### Import components:
```typescript
import { Button, Input, Card } from '@/components/ui';
import { Header, Footer, Loading } from '@/components/common';
```

### Import hooks:
```typescript
import { useLocalStorage, useDebounce } from '@/hooks';
```

### Import services:
```typescript
import { authService, userService } from '@/services';
```

### Import types:
```typescript
import type { ApiResponse, PaginationParams } from '@/types';
```

### Import constants:
```typescript
import { API_ENDPOINTS, ROUTES, STORAGE_KEYS } from '@/constants';
```

### Import utilities:
```typescript
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import { validateEmail, validatePhone } from '@/utils';
```

## 🚀 Best Practices

1. **Tách biệt concerns**: Mỗi file chỉ làm một việc
2. **Reusability**: Tạo components và hooks có thể tái sử dụng
3. **Type safety**: Sử dụng TypeScript types cho tất cả
4. **Index files**: Export qua index.ts để import gọn gàng
5. **Feature-based**: Tổ chức code theo feature khi dự án lớn
6. **Naming conventions**: 
   - Components: PascalCase (Button.tsx)
   - Hooks: camelCase với prefix "use" (useLocalStorage.ts)
   - Services: camelCase với suffix ".service" (auth.service.ts)
   - Utils: camelCase (utils.ts)

