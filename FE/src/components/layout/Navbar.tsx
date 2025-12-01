'use client';

import { Bell, Search, User, ChevronDown, X, Check, Inbox, Settings, LogOut, Info, Menu, DollarSign, FolderTree, CreditCard, FileText, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/stores/AuthContext';
import { useRouter } from 'next/navigation';
import { getRoleLabel } from '@/constants/userRole';
import { API_URL } from '@/lib/env';
import { useNotifications } from '@/stores/NotificationContext';
import Link from 'next/link';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [avatarError, setAvatarError] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Search functionality
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults(null);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.data);
          setShowSearchResults(true);
        } else {
          setSearchResults(null);
          setShowSearchResults(false);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults(null);
        setShowSearchResults(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchResults]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cost':
        return DollarSign;
      case 'category':
        return FolderTree;
      case 'advance':
        return CreditCard;
      case 'file':
        return FileText;
      default:
        return Search;
    }
  };

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
        {/* Sidebar Toggle Button - Mobile only */}
        {isMobile && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors shrink-0 touch-manipulation"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        
        {/* Left side - Search */}
        <div className="flex items-center flex-1 min-w-0" ref={searchRef}>
          {/* Search bar - Always visible */}
          <div className="flex-1 max-w-md relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults) setShowSearchResults(true);
                }}
                className="w-full pl-9 sm:pl-10 pr-10 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 animate-spin" />
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-[100] max-h-[500px] overflow-y-auto">
                {searchResults.costs.length === 0 &&
                searchResults.categories.length === 0 &&
                searchResults.advancePayments.length === 0 &&
                searchResults.files.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    <p>Không tìm thấy kết quả nào</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {/* Costs */}
                    {searchResults.costs.length > 0 && (
                      <div className="mb-2">
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 uppercase">Chi phí</p>
                        </div>
                        {searchResults.costs.map((item: any) => {
                          const Icon = getTypeIcon(item.type);
                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => {
                                setShowSearchResults(false);
                                setSearchQuery('');
                              }}
                              className="flex items-start gap-3 px-4 py-3 hover:bg-blue-50 transition-colors"
                            >
                              <Icon className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 break-words">{item.title}</p>
                                <p className="text-xs text-gray-600 mt-0.5 break-words">{item.description}</p>
                                {item.category && (
                                  <p className="text-xs text-gray-400 mt-1">Hạng mục: {item.category}</p>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}

                    {/* Categories */}
                    {searchResults.categories.length > 0 && (
                      <div className="mb-2">
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 uppercase">Hạng mục</p>
                        </div>
                        {searchResults.categories.map((item: any) => {
                          const Icon = getTypeIcon(item.type);
                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => {
                                setShowSearchResults(false);
                                setSearchQuery('');
                              }}
                              className="flex items-start gap-3 px-4 py-3 hover:bg-green-50 transition-colors"
                            >
                              <Icon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 break-words">{item.title}</p>
                                <p className="text-xs text-gray-600 mt-0.5 break-words">{item.description}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}

                    {/* Advance Payments */}
                    {searchResults.advancePayments.length > 0 && (
                      <div className="mb-2">
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 uppercase">Tạm ứng</p>
                        </div>
                        {searchResults.advancePayments.map((item: any) => {
                          const Icon = getTypeIcon(item.type);
                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => {
                                setShowSearchResults(false);
                                setSearchQuery('');
                              }}
                              className="flex items-start gap-3 px-4 py-3 hover:bg-purple-50 transition-colors"
                            >
                              <Icon className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 break-words">{item.title}</p>
                                <p className="text-xs text-gray-600 mt-0.5 break-words">{item.description}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}

                    {/* Files */}
                    {searchResults.files.length > 0 && (
                      <div className="mb-2">
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 uppercase">File thiết kế</p>
                        </div>
                        {searchResults.files.map((item: any) => {
                          const Icon = getTypeIcon(item.type);
                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => {
                                setShowSearchResults(false);
                                setSearchQuery('');
                              }}
                              className="flex items-start gap-3 px-4 py-3 hover:bg-orange-50 transition-colors"
                            >
                              <Icon className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 break-words">{item.title}</p>
                                <p className="text-xs text-gray-600 mt-0.5 break-words">{item.description}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              className="relative flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:px-3 sm:py-2 rounded-xl sm:rounded-full border-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-blue-200 hover:bg-blue-50 active:bg-blue-100 transition-all touch-manipulation"
              aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}`}
              onClick={() => setShowNotifications((prev) => !prev)}
            >
              <Bell className="w-5 h-5 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 sm:w-4 sm:h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[320px] max-h-[420px] overflow-hidden bg-white rounded-2xl shadow-2xl border-2 border-gray-200 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between px-4 py-3.5 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50/60 to-indigo-50/60">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-bold text-gray-900">Thông báo</p>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
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
                      className="text-xs text-blue-600 hover:text-blue-700 active:text-blue-800 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors touch-manipulation shrink-0 whitespace-nowrap border border-blue-200"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
                <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <Inbox className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600">Chưa có thông báo nào</p>
                          <p className="text-xs text-gray-400 mt-1">Các thông báo mới sẽ hiển thị ở đây</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3.5 text-sm transition-colors ${
                        notification.isRead 
                          ? 'bg-white hover:bg-gray-50' 
                          : 'bg-blue-50/50 hover:bg-blue-100/50 border-l-4 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 border-2 ${
                            notification.action === 'create'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : notification.action === 'delete'
                              ? 'bg-red-100 text-red-700 border-red-200'
                              : 'bg-blue-100 text-blue-700 border-blue-200'
                          }`}
                        >
                          {notification.action === 'create'
                            ? 'N'
                            : notification.action === 'delete'
                            ? 'X'
                            : 'S'}
                        </span>
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-bold text-gray-900 break-words text-sm leading-snug">
                            {notification.title}
                          </p>
                          <p className="text-gray-600 text-xs sm:text-sm mt-1 break-words leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-xs text-gray-400 font-medium">
                              {new Date(notification.createdAt).toLocaleString('vi-VN')}
                            </p>
                            {!notification.isRead && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded-full">
                                Mới
                              </span>
                            )}
                          </div>
                        </div>
                        {!notification.isRead && (
                          <button
                            className="inline-flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-700 active:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors touch-manipulation shrink-0 border border-blue-200 font-semibold"
                            aria-label="Đánh dấu đã đọc"
                            onClick={() => markAsRead([notification.id])}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Đã đọc</span>
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
