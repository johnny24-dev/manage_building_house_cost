@echo off
chcp 65001 > nul
title Khởi động Hệ thống Quản lý Chi phí Xây nhà
echo Đang khởi chạy kịch bản deploy trên Windows...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Có lỗi xảy ra trong quá trình thực thi script.
)
pause
