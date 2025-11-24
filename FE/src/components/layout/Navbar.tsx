'use client';

import { Bell, Search, User, ChevronDown, X, Check, Inbox, Settings, LogOut, Info } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/stores/AuthContext';
import { useRouter } from 'next/navigation';
import { getRoleLabel } from '@/constants/userRole';
import { API_URL } from '@/lib/env';
import { useNotifications } from '@/stores/NotificationContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [avatarError, setAvatarError] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowSearch(true); // Always show search on desktop
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Đóng menu khi click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  useEffect(() => {
    if (!showNotifications) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    if (showNotifications) {
      const unreadIds = notifications.filter((notification) => !notification.isRead).map((notification) => notification.id);
      if (unreadIds.length > 0) {
        markAsRead(unreadIds);
      }
    }
  }, [showNotifications, notifications, markAsRead]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const apiBase = useMemo(() => {
    const normalized = (API_URL || '').replace(/\/api\/?$/, '');
    return normalized || 'http://localhost:9000';
  }, []);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatarUrl]);

  const avatarSrc = useMemo(() => {
    if (!user?.avatarUrl || avatarError) return null;
    if (user.avatarUrl.startsWith('http')) return user.avatarUrl;
    const relativePath = user.avatarUrl.startsWith('/') ? user.avatarUrl : `/${user.avatarUrl}`;
    return `${apiBase}${relativePath}`;
  }, [apiBase, user?.avatarUrl, avatarError]);

  const avatarInitial = useMemo(() => {
    if (user?.fullName?.trim()) return user.fullName.trim().charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return null;
  }, [user?.fullName, user?.email]);

  return (
    <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 gap-2 sm:gap-3 md:gap-4">
        {/* Left side - Search */}
        <div className="flex items-center flex-1 min-w-0">
          {/* Search - Desktop: always visible, Mobile: toggle */}
          {showSearch || !isMobile ? (
            <div className="flex-1 max-w-md relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="w-full pl-9 sm:pl-10 pr-10 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {isMobile && (
                  <button
                    onClick={() => setShowSearch(false)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Đóng tìm kiếm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
              aria-label="Mở tìm kiếm"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              className="relative flex items-center gap-2 px-3 py-2 rounded-full border border-transparent text-gray-600 hover:text-gray-900 hover:border-blue-100 hover:bg-blue-50 transition-colors"
              aria-label="Thông báo"
              onClick={() => setShowNotifications((prev) => !prev)}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center shadow-lg">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[320px] max-h-[420px] overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Thông báo</p>
                    <p className="text-xs text-gray-500">
                      {unreadCount > 0
                        ? `${unreadCount} thông báo chưa đọc`
                        : 'Đã đọc tất cả'}
                    </p>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={async () => {
                        await markAllAsRead();
                        setShowNotifications(false);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
                <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Inbox className="w-10 h-10 text-gray-300" />
                        <span>Chưa có thông báo nào</span>
                      </div>
                    </div>
                  )}
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 text-sm ${
                        notification.isRead ? 'bg-white' : 'bg-blue-50/60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${
                            notification.action === 'create'
                              ? 'bg-green-100 text-green-700'
                              : notification.action === 'delete'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {notification.action === 'create'
                            ? 'N'
                            : notification.action === 'delete'
                            ? 'X'
                            : 'S'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 wrap-break-word">
                            {notification.title}
                          </p>
                          <p className="text-gray-600 text-sm mt-0.5 wrap-break-word">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <button
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                            aria-label="Đánh dấu đã đọc"
                            onClick={() => markAsRead([notification.id])}
                          >
                            <Check className="w-4 h-4" />
                            Đã đọc
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-full border border-transparent hover:border-blue-100 hover:bg-blue-50 transition-colors"
              aria-label="Menu người dùng"
              aria-expanded={showUserMenu}
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border border-blue-100 shadow-sm shrink-0"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                  {avatarInitial ? (
                    <span className="text-sm font-semibold text-white">{avatarInitial}</span>
                  ) : (
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </div>
              )}
              <div className="hidden sm:block text-left min-w-0">
                <span className="block text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-none">
                  {user?.email || 'Người dùng'}
                </span>
                <span className="hidden md:block text-xs text-gray-500 truncate">
                  {getRoleLabel(user?.role)}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-4 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName || user?.email}</p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {getRoleLabel(user?.role)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    router.push('/settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Cài đặt
                </button>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
