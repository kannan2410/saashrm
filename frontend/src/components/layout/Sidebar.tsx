import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  CalendarRange,
  Wallet,
  MessageSquare,
  Settings,
  LogOut,
  Building2,
  UserCircle,
  ChevronRight,
  Network,
  X,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [] },
  { to: '/employees', label: 'Employees', icon: Users, roles: ['ADMIN', 'HR', 'MANAGER'] },
  { to: '/attendance', label: 'Attendance', icon: Clock, roles: [] },
  { to: '/leave', label: 'Leave', icon: CalendarDays, roles: [] },
  { to: '/calendar', label: 'Calendar', icon: CalendarRange, roles: [] },
  { to: '/payroll', label: 'Payroll', icon: Wallet, roles: [] },
  { to: '/chat', label: 'Chat', icon: MessageSquare, roles: [] },
  { to: '/org-tree', label: 'Org Tree', icon: Network, roles: [] },
  { to: '/profile', label: 'My Profile', icon: UserCircle, roles: [] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const { totalUnread } = useChatStore();
  const location = useLocation();

  const roleColorMap: Record<string, string> = {
    ADMIN: 'bg-red-500',
    HR: 'bg-purple-500',
    MANAGER: 'bg-emerald-500',
    TEAM_LEAD: 'bg-amber-500',
    EMPLOYEE: 'bg-emerald-500',
  };

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen w-[260px] bg-sidebar-bg border-r border-sidebar-border flex flex-col z-40 transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* ── Logo Header ── */}
      <div className="h-[60px] flex items-center justify-between px-5 border-b border-sidebar-border flex-shrink-0">
        {user?.company?.logo ? (
          <img
            src={user.company.logo.url}
            alt={user.company.name}
            className="h-8 w-auto object-contain"
          />
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-content-primary font-semibold text-[15px] tracking-tight">
              {user?.company?.name || 'SaaS HRM'}
            </span>
          </div>
        )}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 text-content-muted hover:text-content-primary rounded-lg hover:bg-surface-bg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto sidebar-scroll">
        {navItems
          .filter(
            (item) => item.roles.length === 0 || (user && item.roles.includes(user.role))
          )
          .map((item) => {
            const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={clsx(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 relative',
                  isActive
                    ? 'bg-sidebar-active text-sidebar-textActive shadow-sm'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-textHover'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-sidebar-accent rounded-r-full" />
                )}
                <div className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                  isActive
                    ? 'bg-sidebar-accent/20'
                    : 'bg-transparent group-hover:bg-sidebar-hover'
                )}>
                  <item.icon className={clsx(
                    'h-[18px] w-[18px] transition-colors',
                    isActive ? 'text-sidebar-textActive' : 'text-sidebar-text group-hover:text-sidebar-textHover'
                  )} />
                </div>
                <span className="flex-1">{item.label}</span>
                {item.to === '/chat' && totalUnread > 0 && !isActive && (
                  <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-danger-500 text-white text-[11px] font-bold rounded-full">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                )}
              </NavLink>
            );
          })}
      </nav>

      {/* ── User Profile Section with Curve ── */}
      <div className="flex-shrink-0">
        {/* Curved separator */}
        <div className="relative">
          <svg className="w-full h-5 block" viewBox="0 0 260 20" preserveAspectRatio="none">
            <path d="M0,20 Q130,0 260,20 Z" style={{ fill: 'rgb(var(--color-sidebar-hover))' }} />
          </svg>
        </div>

        <div style={{ backgroundColor: 'rgb(var(--color-sidebar-hover))' }} className="px-4 pb-4">
          {/* User info */}
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="relative flex-shrink-0">
              {user?.employee?.profilePhoto ? (
                <img
                  src={user.employee.profilePhoto}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover border-2 border-sidebar-border"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-sm font-bold border-2 border-sidebar-border">
                  {user?.employee?.fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                </div>
              )}
              {/* Role dot */}
              <div
                className={clsx(
                  'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2',
                  roleColorMap[user?.role || ''] || 'bg-emerald-500'
                )}
                style={{ borderColor: 'rgb(var(--color-sidebar-hover))' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-content-primary truncate">
                {user?.employee?.fullName || user?.email}
              </p>
              <p className="text-[11px] text-content-muted truncate">
                {user?.employee?.designation || user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={logout}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] font-medium text-content-muted hover:text-danger-600 hover:bg-danger-50 rounded-xl transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
