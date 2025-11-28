#!/bin/bash

# Script khởi động ứng dụng Quản lý Chi phí Xây nhà
# Chạy: bash start.sh hoặc ./start.sh

set -e

echo "🚀 Đang khởi động ứng dụng Quản lý Chi phí Xây nhà..."

# Kiểm tra Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker chưa được cài đặt. Vui lòng cài đặt Docker trước."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose chưa được cài đặt. Vui lòng cài đặt Docker Compose trước."
    exit 1
fi

# Kiểm tra file .env
if [ ! -f .env ]; then
    echo "📝 Tạo file .env từ template..."
    cat > .env << EOF
# Port Configuration
FE_PORT=3000
BE_PORT=9000

# Frontend URL
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:9000

# JWT Secret (Tự động tạo)
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-this-secret-key-$(date +%s)")

# Super Admin
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=admin123

# Email (Optional)
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
EOF
    echo "✅ Đã tạo file .env"
    echo "⚠️  Vui lòng kiểm tra và cập nhật file .env nếu cần"
fi

# Tạo thư mục cần thiết
echo "📁 Tạo thư mục cần thiết..."
mkdir -p BE/uploads BE/database

# Kiểm tra và dừng containers cũ nếu có
echo "🛑 Dừng containers cũ (nếu có)..."
docker-compose down 2>/dev/null || true

# Build và khởi động
echo "🔨 Đang build và khởi động containers..."
docker-compose up -d --build

# Đợi services sẵn sàng
echo "⏳ Đợi services khởi động..."
sleep 10

# Kiểm tra trạng thái
echo ""
echo "📊 Trạng thái services:"
docker-compose ps

echo ""
echo "✅ Ứng dụng đã được khởi động!"
echo ""
echo "🌐 Truy cập:"
echo "   Frontend: http://localhost:${FE_PORT:-3000}"
echo "   Backend:  http://localhost:${BE_PORT:-9000}"
echo ""
echo "📝 Xem logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Dừng ứng dụng:"
echo "   docker-compose down"
echo ""

