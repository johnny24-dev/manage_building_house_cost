#!/bin/bash

# ==============================================================================
# Script Khởi động & Deploy Hệ thống Quản lý Chi phí Xây nhà (1-Command Deploy)
# Chạy: bash start.sh hoặc ./start.sh
# Hỗ trợ tự động cài đặt Docker và Docker Compose trên mọi VPS (Ubuntu/Debian/CentOS)
# ==============================================================================

set -e

# Mã màu ANSI để trang trí terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Hiển thị ASCII Art hoành tráng
clear 2>/dev/null || true
echo -e "${BLUE}====================================================================${NC}"
echo -e "${CYAN}      __  ___                                 ______                ${NC}"
echo -e "${CYAN}     /  |/  /___ _____  ____ _____ ____      / ____/___  _____ _    ${NC}"
echo -e "${CYAN}    / /|_/ / __ \`/ __ \\/ __ \`/ __ \`/ __ \\    / /   / __ \\/ ___/ __ \\   ${NC}"
echo -e "${CYAN}   / /  / / /_/ / / / / /_/ / /_/ / /_/ /   / /___/ /_/ (__  ) /_/ /   ${NC}"
echo -e "${CYAN}  /_/  /_/\\__,_/_/ /_/\\__, /\\__,_/\\____/    \\____/\\____/____/\\____/    ${NC}"
echo -e "${CYAN}                     /____/                                         ${NC}"
echo -e "${GREEN}             --- QUẢN LÝ CHI PHÍ XÂY DỰNG NHÀ ---                   ${NC}"
echo -e "${BLUE}====================================================================${NC}"
echo ""

# Xác định quyền thực thi (SUDO)
SUDO=""
if [ "$EUID" -ne 0 ]; then
    SUDO="sudo"
fi

# ==========================================
# 1. KIỂM TRA & TỰ ĐỘNG CÀI ĐẶT DOCKER
# ==========================================
echo -e "${BLUE}[1/5] Kiểm tra và thiết lập môi trường Docker...${NC}"

DOCKER_INSTALLED=true
if ! command -v docker &> /dev/null; then
    DOCKER_INSTALLED=false
fi

if [ "$DOCKER_INSTALLED" = false ]; then
    echo -e "${YELLOW}⚠️  Docker chưa được cài đặt. Tiến hành cài đặt tự động...${NC}"
    
    # Kiểm tra các lệnh cài đặt phổ biến
    if command -v apt-get &> /dev/null; then
        echo -e "${CYAN}🔄 Đang cập nhật gói hệ thống (apt-get)...${NC}"
        $SUDO apt-get update -y || true
        $SUDO apt-get install -y curl gnupg lsb-release || true
    elif command -v yum &> /dev/null; then
        echo -e "${CYAN}🔄 Đang cập nhật gói hệ thống (yum)...${NC}"
        $SUDO yum install -y curl || true
    fi

    # Cài đặt bằng script chính thức từ Docker
    echo -e "${CYAN}📥 Đang tải và cài đặt Docker Engine chính thức...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    $SUDO sh get-docker.sh
    rm -f get-docker.sh

    # Khởi động dịch vụ Docker
    echo -e "${CYAN}🔄 Khởi động dịch vụ Docker...${NC}"
    $SUDO systemctl enable docker || true
    $SUDO systemctl start docker || true
    
    echo -e "${GREEN}✅ Đã cài đặt Docker thành công!${NC}"
fi

# Kiểm tra xem Docker Daemon có đang chạy hay không
if ! docker info &> /dev/null; then
    if [ "$(uname)" = "Darwin" ]; then
        echo -e "${YELLOW}⚠️  Docker Desktop chưa được chạy trên macOS. Đang khởi động Docker Desktop...${NC}"
        open -a Docker
        echo -n -e "${CYAN}⏳ Đợi Docker Desktop khởi động (có thể mất 15-20s)...${NC}"
        for i in {1..20}; do
            if docker info &> /dev/null; then
                echo -e "\n${GREEN}✅ Docker daemon đã hoạt động!${NC}"
                break
            fi
            echo -n "."
            sleep 2
        done
        echo ""
    else
        echo -e "${YELLOW}⚠️  Docker daemon chưa được chạy. Đang khởi động Docker service...${NC}"
        $SUDO systemctl start docker || true
        echo -n -e "${CYAN}⏳ Đợi Docker daemon khởi động...${NC}"
        for i in {1..10}; do
            if docker info &> /dev/null; then
                echo -e "\n${GREEN}✅ Docker daemon đã hoạt động!${NC}"
                break
            fi
            echo -n "."
            sleep 2
        done
        echo ""
    fi

    # Kiểm tra lại lần cuối
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Không thể kết nối với Docker daemon.${NC}"
        echo -e "💡 Hướng dẫn:"
        if [ "$(uname)" = "Darwin" ]; then
            echo -e "   -> Vui lòng tự mở ứng dụng Docker Desktop từ Launchpad/Applications."
        else
            echo -e "   -> Vui lòng chạy lệnh 'sudo systemctl start docker' hoặc kiểm tra logs của Docker."
        fi
        exit 1
    fi
else
    echo -e "${GREEN}✅ Docker đã được cài đặt sẵn: $(docker --version)${NC}"
fi

# ==========================================
# 2. KIỂM TRA & TỰ ĐỘNG CÀI ĐẶT DOCKER COMPOSE
# ==========================================
DOCKER_COMPOSE=""

if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif docker-compose version &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${YELLOW}⚠️  Docker Compose chưa được cài đặt. Tiến hành cài đặt...${NC}"
    
    # Thử cài đặt thông qua Package Manager (Docker Compose V2 Plugin)
    if command -v apt-get &> /dev/null; then
        $SUDO apt-get update -y || true
        $SUDO apt-get install -y docker-compose-plugin || true
    elif command -v yum &> /dev/null; then
        $SUDO yum install -y docker-compose-plugin || true
    fi

    # Kiểm tra lại sau khi cài đặt plugin
    if docker compose version &> /dev/null; then
        DOCKER_COMPOSE="docker compose"
    else
        # Cài đặt Docker Compose Standalone phiên bản mới nhất
        echo -e "${CYAN}📥 Tải Docker Compose Standalone...${NC}"
        COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
        $SUDO curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        $SUDO chmod +x /usr/local/bin/docker-compose
        DOCKER_COMPOSE="docker-compose"
    fi
fi

echo -e "${GREEN}✅ Sử dụng Docker Compose lệnh: '$DOCKER_COMPOSE' ($($DOCKER_COMPOSE version | head -n 1))${NC}"
echo ""

# ==========================================
# 3. TẠO & CẤU HÌNH FILE MÔI TRƯỜNG .ENV
# ==========================================
echo -e "${BLUE}[2/5] Cấu hình biến môi trường...${NC}"

if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Chưa tìm thấy file .env. Tiến hành khởi tạo từ mẫu...${NC}"
    
    # Tạo chuỗi bí mật JWT ngẫu nhiên an toàn
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null | tr -d '/+=' || echo "super-secure-key-$(date +%s)-$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 20)")
    
    cat > .env << EOF
# Cấu hình cổng hiển thị ra bên ngoài (Port Exposure)
FE_PORT=3000
BE_PORT=9000

# Địa chỉ Frontend truy cập công cộng (Public URL)
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:9000

# Khóa bảo mật JWT (Đã sinh ngẫu nhiên an toàn)
JWT_SECRET=${JWT_SECRET}

# Tài khoản Quản trị tối cao mặc định (Super Admin)
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=admin123

# Cấu hình dịch vụ gửi Email OTP (Tùy chọn)
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
EOF
    echo -e "${GREEN}✅ Đã tạo tệp cấu hình '.env' thành công với JWT_SECRET ngẫu nhiên!${NC}"
    echo -e "${YELLOW}💡 Gợi ý: Bạn có thể chỉnh sửa file '.env' để thay đổi Email, Password Admin bất kỳ lúc nào.${NC}"
else
    echo -e "${GREEN}✅ Đã tìm thấy tệp cấu hình '.env' hiện tại.${NC}"
fi
echo ""

# ==========================================
# 4. TẠO THƯ MỤC LƯU TRỮ & PHÂN QUYỀN
# ==========================================
echo -e "${BLUE}[3/5] Tạo các thư mục lưu trữ dữ liệu...${NC}"
mkdir -p BE/uploads BE/database
$SUDO chmod -R 775 BE/uploads BE/database || true
echo -e "${GREEN}✅ Đã chuẩn bị thư mục BE/uploads (lưu hóa đơn) và BE/database (lưu SQLite)${NC}"
echo ""

# ==========================================
# 5. CHẠY VÀ BUILD DOCKER CONTAINERS
# ==========================================
echo -e "${BLUE}[4/5] Khởi động và Biên dịch ứng dụng bằng Docker Compose...${NC}"

# Dừng container cũ nếu có
echo -e "${CYAN}🛑 Dừng các dịch vụ cũ (nếu có)...${NC}"
$DOCKER_COMPOSE down --remove-orphans 2>/dev/null || true

# Khởi động build container mới
echo -e "${CYAN}🔨 Đang tải, dựng và khởi chạy các container (Quá trình này có thể mất vài phút)...${NC}"
$DOCKER_COMPOSE up -d --build

echo ""
# ==========================================
# 6. KIỂM TRA TRẠNG THÁI SẴN SÀNG (HEALTHCHECK)
# ==========================================
echo -e "${BLUE}[5/5] Kiểm tra trạng thái sẵn sàng của dịch vụ...${NC}"
echo -e "${CYAN}⏳ Đợi Backend và Database sẵn sàng...${NC}"

# Vòng lặp chờ tối đa 40s cho tới khi backend healthy
MAX_RETRIES=15
RETRY_COUNT=0
BACKEND_HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    HEALTH_STATUS=$(docker inspect --format='{{json .State.Health.Status}}' cost_management_backend 2>/dev/null || echo "\"unknown\"")
    if [ "$HEALTH_STATUS" = "\"healthy\"" ]; then
        BACKEND_HEALTHY=true
        break
    fi
    echo -e "${CYAN}.. đang đợi Backend khởi tạo cơ sở dữ liệu và kết nối (Trạng thái: $HEALTH_STATUS) ..${NC}"
    sleep 3
    RETRY_COUNT=$((RETRY_COUNT+1))
done

# Đọc các cổng được map từ .env hoặc mặc định
FE_PORT_FINAL=$(grep -E "^FE_PORT=" .env | cut -d'=' -f2 || echo "3000")
BE_PORT_FINAL=$(grep -E "^BE_PORT=" .env | cut -d'=' -f2 || echo "9000")
ADMIN_EMAIL_FINAL=$(grep -E "^SUPER_ADMIN_EMAIL=" .env | cut -d'=' -f2 || echo "admin@example.com")
ADMIN_PASS_FINAL=$(grep -E "^SUPER_ADMIN_PASSWORD=" .env | cut -d'=' -f2 || echo "admin123")

echo ""
echo -e "${BLUE}====================================================================${NC}"
if [ "$BACKEND_HEALTHY" = true ]; then
    echo -e "${GREEN}🎉 CHÚC MỪNG! HỆ THỐNG ĐÃ ĐƯỢC DEPLOY THÀNH CÔNG RỰC RỠ! 🎉${NC}"
else
    echo -e "${YELLOW}⚠️ Dịch vụ đã khởi chạy nhưng Backend cần thêm thời gian để hoàn tất khởi động.${NC}"
fi
echo -e "${BLUE}====================================================================${NC}"
echo ""
echo -e "${PURPLE}🌐 THÔNG TIN TRUY CẬP HỆ THỐNG:${NC}"
echo -e "   👉 ${GREEN}Giao diện (Frontend):${NC}  http://localhost:${FE_PORT_FINAL}  (Hoặc IP của VPS)"
echo -e "   👉 ${GREEN}API Server (Backend):${NC}  http://localhost:${BE_PORT_FINAL}"
echo ""
echo -e "${PURPLE}🔑 TÀI KHOẢN ADMIN MẶC ĐỊNH (Tự khởi tạo):${NC}"
echo -e "   👤 Email:    ${CYAN}${ADMIN_EMAIL_FINAL}${NC}"
echo -e "   🔒 Mật khẩu: ${CYAN}${ADMIN_PASS_FINAL}${NC}"
echo ""
echo -e "${PURPLE}📝 CÁC LỆNH QUẢN TRỊ HỮU ÍCH (Chạy tại thư mục dự án):${NC}"
echo -e "   • Xem nhật ký logs:        ${GREEN}$DOCKER_COMPOSE logs -f${NC}"
echo -e "   • Dừng hệ thống:           ${GREEN}$DOCKER_COMPOSE down${NC}"
echo -e "   • Khởi động lại:           ${GREEN}$DOCKER_COMPOSE restart${NC}"
echo -e "   • Xóa sạch dữ liệu cũ:     ${GREEN}$DOCKER_COMPOSE down -v${NC}"
echo -e "${BLUE}====================================================================${NC}"
echo ""
