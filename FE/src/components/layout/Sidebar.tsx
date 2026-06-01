'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  DollarSign,
  FolderTree,
  BarChart3,
  Settings,
  Home,
  CreditCard,
  FileText,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const menuItems = [
  {
    title: 'Tổng quan',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Quản lý chi phí',
    href: '/costs',
    icon: DollarSign,
  },
  {
    title: 'Hạng mục',
    href: '/categories',
    icon: FolderTree,
  },
  {
    title: 'Tạm ứng',
    href: '/advance',
    icon: CreditCard,
  },
  {
    title: 'File thiết kế',
    href: '/files',
    icon: FileText,
  },
  {
    title: 'Báo cáo',
    href: '/reports',
    icon: BarChart3,
  },
  {
    title: 'Cài đặt',
    href: '/settings',
    icon: Settings,
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isTablet, setIsTablet] = useState(false);
  const isMobileMenuOpen = isOpen;

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close mobile menu when clicking outside or navigating
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('aside') && !target.closest('button[aria-label="Toggle sidebar"]')) {
        onClose?.();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when mobile menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen, onClose]);

  const handleLinkClick = () => {
    onClose?.();
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 sm:w-72 lg:w-64 xl:w-72 bg-white/90 backdrop-blur-lg border-r border-slate-200/50 
          shadow-2xl lg:shadow-none
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 sm:px-6 py-5 sm:py-6 border-b border-slate-100 shrink-0">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md shadow-blue-500/10 shrink-0">
              <Home className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg lg:text-xl font-black text-slate-800 truncate tracking-tight">
                Quản lý Chi phí
              </h1>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Xây dựng nhà</p>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1.5 sm:space-y-2 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`
                    flex items-center gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl
                    transition-all duration-300 text-sm sm:text-base font-bold group
                    ${
                      isActive
                        ? 'bg-linear-to-r from-blue-500/10 to-indigo-500/5 text-blue-600 border border-blue-200/40 shadow-xs shadow-blue-500/5'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:translate-x-1'
                    }
                  `}
                  title={item.title}
                >
                  <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50 backdrop-blur-xs">
            <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">
             {`© ${new Date().getFullYear()} Quản lý Chi phí`}
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden animate-in fade-in duration-300"
          onClick={() => onClose?.()}
          aria-hidden="true"
        />
      )}
    </>
  );
}

