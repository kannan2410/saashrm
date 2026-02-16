import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { Bell, Search, Sun, Moon, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="h-[60px] bg-surface-card border-b border-surface-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-content-muted hover:text-content-primary hover:bg-surface-bg rounded-lg transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 w-48 md:w-72 bg-surface-bg border border-surface-border rounded-xl text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 placeholder-content-muted transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-content-muted hover:text-content-primary hover:bg-surface-bg rounded-lg transition-colors"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        <button className="relative p-2 text-content-muted hover:text-content-primary hover:bg-surface-bg rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-surface-border">
          {user?.company?.logo && (
            <img
              src={user.company.logo.url}
              alt="Company"
              className="h-7 w-auto hidden sm:block"
            />
          )}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-content-primary">
              {user?.employee?.fullName || user?.email}
            </p>
            <p className="text-xs text-content-muted">{user?.employee?.designation || user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
