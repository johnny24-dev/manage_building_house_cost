# Features Directory

Thư mục này chứa các tính năng được tổ chức theo domain/feature.

## Cấu trúc mỗi feature:

```
feature-name/
  ├── components/     # Components chỉ dùng trong feature này
  ├── hooks/          # Custom hooks của feature
  ├── services/       # API services của feature
  ├── types/          # Types của feature
  ├── utils/          # Utilities của feature
  └── index.ts        # Export tất cả public APIs
```

## Ví dụ:

```
features/
  ├── auth/
  │   ├── components/
  │   │   ├── LoginForm.tsx
  │   │   └── RegisterForm.tsx
  │   ├── hooks/
  │   │   └── useAuth.ts
  │   └── index.ts
  ├── dashboard/
  │   ├── components/
  │   ├── hooks/
  │   └── index.ts
  └── ...
```

