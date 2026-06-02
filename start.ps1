# ==============================================================================
# Script Khởi động & Deploy Hệ thống Quản lý Chi phí Xây nhà (Windows PowerShell)
# Chạy: ./start.ps1 hoặc thông qua start.bat
# Hỗ trợ kiểm tra Docker và tự động cài đặt các thư mục cần thiết
# ==============================================================================

# Thiết lập Output Encoding thành UTF-8 để hiển thị tiếng Việt có dấu chính xác
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Hiển thị ASCII Art hoành tráng
Clear-Host
Write-Host '====================================================================' -ForegroundColor Blue
Write-Host '      __  ___                                 ______                ' -ForegroundColor Cyan
Write-Host '     /  |/  /___ _____  ____ _____ ____      / ____/___  _____ _    ' -ForegroundColor Cyan
Write-Host '    / /|_/ / __ `/ __ \/ __ `/ __ `/ __ \    / /   / __ \/ ___/ __ \   ' -ForegroundColor Cyan
Write-Host '   / /  / / /_/ / / / / /_/ / /_/ / /_/ /   / /___/ /_/ (__  ) /_/ /   ' -ForegroundColor Cyan
Write-Host '  /_/  /_/\__,_/_/ /_/\__, /\__,_/\____/    \____/\____/____/\____/    ' -ForegroundColor Cyan
Write-Host '                     /____/                                         ' -ForegroundColor Cyan
Write-Host '             --- QUẢN LÝ CHI PHÍ XÂY DỰNG NHÀ ---                   ' -ForegroundColor Green
Write-Host '====================================================================' -ForegroundColor Blue
Write-Host ""

# ==========================================
# 1. KIỂM TRA & TỰ ĐỘNG CHẠY DOCKER DESKTOP
# ==========================================
Write-Host "[1/5] Kiểm tra và thiết lập môi trường Docker..." -ForegroundColor Blue

$dockerInstalled = $true
try {
    $null = Get-Command docker -ErrorAction Stop
} catch {
    $dockerInstalled = $false
}

if (-not $dockerInstalled) {
    Write-Host "⚠️ Docker chưa được cài đặt hoặc chưa được thêm vào biến môi trường PATH." -ForegroundColor Yellow
    Write-Host "💡 Vui lòng tải và cài đặt Docker Desktop cho Windows tại:" -ForegroundColor Yellow
    Write-Host "   -> https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
    Write-Host "Sau khi cài đặt xong và khởi động lại máy (nếu cần), hãy chạy lại script này." -ForegroundColor Yellow
    Exit 1
}

# Kiểm tra xem Docker Daemon có đang chạy hay không
$dockerRunning = $false
& docker info >$null 2>&1
if ($LASTEXITCODE -eq 0) {
    $dockerRunning = $true
}

if (-not $dockerRunning) {
    Write-Host "⚠️ Docker Desktop chưa được chạy. Đang cố gắng khởi động Docker Desktop..." -ForegroundColor Yellow
    
    # Tìm kiếm Docker Desktop ở các thư mục cài đặt phổ biến
    $dockerPaths = @(
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
        "$env:LocalAppData\Docker\Docker Desktop.exe"
    )
    
    $started = $false
    foreach ($path in $dockerPaths) {
        if (Test-Path $path) {
            Start-Process -FilePath $path
            $started = $true
            break
        }
    }
    
    if (-not $started) {
        # Fallback thử chạy trực tiếp nếu có trong Path
        try {
            Start-Process -FilePath "Docker Desktop" -ErrorAction Stop
            $started = $true
        } catch {
            # Bỏ qua nếu lỗi
        }
    }
    
    Write-Host "⏳ Đang đợi Docker Desktop khởi động (có thể mất 15-30 giây)..." -ForegroundColor Cyan
    $healthy = $false
    for ($i = 1; $i -le 20; $i++) {
        Start-Sleep -Seconds 2
        & docker info >$null 2>&1
        if ($LASTEXITCODE -eq 0) {
            $healthy = $true
            break
        }
        Write-Host -NoNewline "."
    }
    Write-Host ""
    
    if (-not $healthy) {
        Write-Host "❌ Không thể kết nối với Docker daemon." -ForegroundColor Red
        Write-Host "💡 Hướng dẫn:" -ForegroundColor Yellow
        Write-Host "   -> Vui lòng tự mở ứng dụng Docker Desktop bằng tay từ Start Menu." -ForegroundColor Yellow
        Write-Host "   -> Đảm bảo trạng thái Docker ở góc màn hình báo màu xanh (Running) rồi chạy lại script." -ForegroundColor Yellow
        Exit 1
    } else {
        Write-Host "✅ Docker daemon đã hoạt động!" -ForegroundColor Green
    }
} else {
    $dockerVersion = (& docker --version).Trim()
    Write-Host "✅ Docker đã được cài đặt sẵn: $dockerVersion" -ForegroundColor Green
}

# Xác định lệnh Docker Compose thích hợp
$dockerComposeCmd = ""
& docker compose version >$null 2>&1
if ($LASTEXITCODE -eq 0) {
    $dockerComposeCmd = "docker compose"
} else {
    & docker-compose version >$null 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerComposeCmd = "docker-compose"
    } else {
        Write-Host "❌ Không tìm thấy lệnh 'docker compose' hoặc 'docker-compose'." -ForegroundColor Red
        Write-Host "💡 Vui lòng cập nhật hoặc cài đặt Docker Desktop mới nhất có đi kèm Docker Compose." -ForegroundColor Yellow
        Exit 1
    }
}

# Helper function để chạy docker compose
function Invoke-DockerCompose {
    param(
        [Parameter(ValueFromRemainingArguments=$true)]
        [string[]]$Arguments
    )
    if ($dockerComposeCmd -eq "docker compose") {
        & docker compose @Arguments
    } else {
        & docker-compose @Arguments
    }
}

$composeVersionInfo = ((Invoke-DockerCompose version) | Select-Object -First 1).Trim()
Write-Host "✅ Sử dụng Docker Compose lệnh: '$dockerComposeCmd' ($composeVersionInfo)" -ForegroundColor Green
Write-Host ""

# ==========================================
# 2. TẠO & CẤU HÌNH FILE MÔI TRƯỜNG .ENV
# ==========================================
Write-Host "[2/5] Cấu hình biến môi trường..." -ForegroundColor Blue

if (-not (Test-Path ".env")) {
    Write-Host "📝 Chưa tìm thấy file .env. Tiến hành khởi tạo từ mẫu..." -ForegroundColor Yellow
    
    # Sinh JWT_SECRET ngẫu nhiên, an toàn trên Windows PowerShell
    $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    $jwtSecret = -join ((1..32) | ForEach-Object { $chars[(Get-Random -Minimum 0 -Maximum $chars.Length)] })
    
    $envContent = @"
# Cấu hình cổng hiển thị ra bên ngoài (Port Exposure)
FE_PORT=3000
BE_PORT=9000

# Địa chỉ Frontend truy cập công cộng (Public URL)
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:9000

# Khóa bảo mật JWT (Đã sinh ngẫu nhiên an toàn)
JWT_SECRET=${jwtSecret}

# Tài khoản Quản trị tối cao mặc định (Super Admin)
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=admin123

# Cấu hình dịch vụ gửi Email OTP (Tùy chọn)
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
"@
    
    # Lưu file với định dạng UTF-8 không BOM để Docker / Linux containers đọc chuẩn nhất
    $envPath = Join-Path (Get-Location) ".env"
    [System.IO.File]::WriteAllText($envPath, $envContent, [System.Text.Encoding]::UTF8)
    
    Write-Host "✅ Đã tạo tệp cấu hình '.env' thành công với JWT_SECRET ngẫu nhiên!" -ForegroundColor Green
    Write-Host "💡 Gợi ý: Bạn có thể chỉnh sửa file '.env' để thay đổi Email, Password Admin bất kỳ lúc nào." -ForegroundColor Yellow
} else {
    Write-Host "✅ Đã tìm thấy tệp cấu hình '.env' hiện tại." -ForegroundColor Green
}
Write-Host ""

# ==========================================
# 3. TẠO THƯ MỤC LƯU TRỮ
# ==========================================
Write-Host "[3/5] Tạo các thư mục lưu trữ dữ liệu..." -ForegroundColor Blue

$null = New-Item -ItemType Directory -Force -Path "BE/uploads"
$null = New-Item -ItemType Directory -Force -Path "BE/database"

Write-Host "✅ Đã chuẩn bị thư mục BE/uploads (lưu hóa đơn) và BE/database (lưu SQLite)" -ForegroundColor Green
Write-Host ""

# ==========================================
# 4. CHẠY VÀ BUILD DOCKER CONTAINERS
# ==========================================
Write-Host "[4/5] Khởi động và Biên dịch ứng dụng bằng Docker Compose..." -ForegroundColor Blue

# Dừng container cũ nếu có
Write-Host "🛑 Dừng các dịch vụ cũ (nếu có)..." -ForegroundColor Cyan
Invoke-DockerCompose down --remove-orphans 2>$null

# Khởi động build container mới
Write-Host "🔨 Đang tải, dựng và khởi chạy các container (Quá trình này có thể mất vài phút)..." -ForegroundColor Cyan
Invoke-DockerCompose up -d --build
Write-Host ""

# ==========================================
# 5. KIỂM TRA TRẠNG THÁI SẴN SÀNG (HEALTHCHECK)
# ==========================================
Write-Host "[5/5] Kiểm tra trạng thái sẵn sàng của dịch vụ..." -ForegroundColor Blue
Write-Host "⏳ Đợi Backend và Database sẵn sàng..." -ForegroundColor Cyan

$maxRetries = 15
$retryCount = 0
$backendHealthy = $false

while ($retryCount -lt $maxRetries) {
    $healthStatus = & docker inspect --format='{{json .State.Health.Status}}' cost_management_backend 2>$null
    if ($healthStatus -eq '"healthy"') {
        $backendHealthy = $true
        break
    }
    
    $statusText = if ($healthStatus) { $healthStatus.Trim('"') } else { "unknown" }
    Write-Host ".. đang đợi Backend khởi tạo cơ sở dữ liệu và kết nối (Trạng thái: $statusText) .." -ForegroundColor Cyan
    Start-Sleep -Seconds 3
    $retryCount++
}

# Đọc các cấu hình từ .env để hiển thị
$fePort = "3000"
$bePort = "9000"
$adminEmail = "admin@example.com"
$adminPass = "admin123"

if (Test-Path ".env") {
    $lines = Get-Content ".env"
    foreach ($line in $lines) {
        if ($line -match "^FE_PORT\s*=\s*(.*)") { $fePort = $Matches[1].Trim() }
        if ($line -match "^BE_PORT\s*=\s*(.*)") { $bePort = $Matches[1].Trim() }
        if ($line -match "^SUPER_ADMIN_EMAIL\s*=\s*(.*)") { $adminEmail = $Matches[1].Trim() }
        if ($line -match "^SUPER_ADMIN_PASSWORD\s*=\s*(.*)") { $adminPass = $Matches[1].Trim() }
    }
}

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Blue
if ($backendHealthy) {
    Write-Host "🎉 CHÚC MỪNG! HỆ THỐNG ĐÃ ĐƯỢC DEPLOY THÀNH CÔNG RỰC RỠ! 🎉" -ForegroundColor Green
} else {
    Write-Host "⚠️ Dịch vụ đã khởi chạy nhưng Backend cần thêm thời gian để hoàn tất khởi động." -ForegroundColor Yellow
}
Write-Host "====================================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "🌐 THÔNG TIN TRUY CẬP HỆ THỐNG:" -ForegroundColor Magenta
Write-Host "   👉 Giao diện (Frontend):  " -NoNewline
Write-Host "http://localhost:$fePort" -ForegroundColor Green
Write-Host "   👉 API Server (Backend):  " -NoNewline
Write-Host "http://localhost:$bePort" -ForegroundColor Green
Write-Host ""
Write-Host "🔑 TÀI KHOẢN ADMIN MẶC ĐỊNH (Tự khởi tạo):" -ForegroundColor Magenta
Write-Host "   👤 Email:    " -NoNewline
Write-Host $adminEmail -ForegroundColor Cyan
Write-Host "   🔒 Mật khẩu: " -NoNewline
Write-Host $adminPass -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 CÁC LỆNH QUẢN TRỊ HỮU ÍCH (Chạy tại thư mục dự án):" -ForegroundColor Magenta
Write-Host "   • Xem nhật ký logs:        " -NoNewline
Write-Host "$dockerComposeCmd logs -f" -ForegroundColor Green
Write-Host "   • Dừng hệ thống:           " -NoNewline
Write-Host "$dockerComposeCmd down" -ForegroundColor Green
Write-Host "   • Khởi động lại:           " -NoNewline
Write-Host "$dockerComposeCmd restart" -ForegroundColor Green
Write-Host "   • Xóa sạch dữ liệu cũ:     " -NoNewline
Write-Host "$dockerComposeCmd down -v" -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Blue
Write-Host ""
