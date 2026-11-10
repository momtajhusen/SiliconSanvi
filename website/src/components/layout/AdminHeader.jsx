import { Menu, Bell, Sun, Moon, Search, Settings, LogOut, ChevronDown, Users, Globe, CalendarClock, AlertTriangle, Maximize, Minimize } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import useThemeStore from '../../stores/themeStore';
import useUIStore from '../../stores/uiStore';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../ui/DropdownMenu';
import Breadcrumbs from '../ui/Breadcrumbs';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import BrandLogo from '../brand/BrandLogo';

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'A';
}

function alertsFrom(kpis) {
  if (!kpis) return [];
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  return [
    kpis.pendingOnline > 0 && {
      id: `online-${kpis.pendingOnline}`, icon: Globe, tone: 'bg-blue-500/15 text-blue-500', to: '/admissions/online',
      title: 'Online admissions', detail: `${plural(kpis.pendingOnline, 'application')} waiting for review`,
    },
    kpis.followUpsDue > 0 && {
      id: `follow-${kpis.followUpsDue}`, icon: CalendarClock, tone: 'bg-amber-500/15 text-amber-500', to: '/admissions/inquiries',
      title: 'Follow-ups due', detail: `${kpis.followUpsDue} ${kpis.followUpsDue === 1 ? 'inquiry' : 'inquiries'} to call today`,
    },
    kpis.overdueCount > 0 && {
      id: `overdue-${kpis.overdueCount}`, icon: AlertTriangle, tone: 'bg-rose-500/15 text-rose-500', to: '/finance/fees',
      title: 'Overdue fees', detail: `${plural(kpis.overdueCount, 'student')} missed an installment`,
    },
  ].filter(Boolean);
}

const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;

function useFullscreen() {
  const root = typeof document === 'undefined' ? null : document.documentElement;
  const supported = Boolean(root && (root.requestFullscreen || root.webkitRequestFullscreen));
  const [active, setActive] = useState(() => supported && Boolean(fullscreenElement()));

  useEffect(() => {
    const sync = () => setActive(Boolean(fullscreenElement()));
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  const toggle = () => {
    const request = fullscreenElement()
      ? (document.exitFullscreen || document.webkitExitFullscreen).call(document)
      : (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
    Promise.resolve(request).catch(() => {});
  };

  return { supported, active, toggle };
}

function AdminHeader() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { toggleSidebar, breadcrumbs, mobileOpen, setMobileOpen } = useUIStore();
  const { logout, user } = useAuth();
  const [readIds, setReadIds] = useState(() => new Set());
  const [search, setSearch] = useState('');
  const { pathname } = useLocation();
  const fullscreen = useFullscreen();
  const { data, reload: reloadAlerts } = useApi('/admin/dashboard');
  useEffect(() => {
    reloadAlerts();
  }, [pathname, reloadAlerts]);

  const displayName = user?.name || user?.email || 'Admin';
  const displayEmail = user?.email || '';
  const inbox = alertsFrom(data?.kpis).map((item) => ({ ...item, unread: !readIds.has(item.id) }));
  const unreadCount = inbox.filter((item) => item.unread).length;

  const submitSearch = (event) => {
    event.preventDefault();
    const q = search.trim();
    if (q) navigate(`/students?q=${encodeURIComponent(q)}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center border-b border-[hsl(var(--color-border-premium))] bg-[hsl(var(--color-card-bg))]/80 backdrop-blur-xl px-3 sm:px-4">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="hover:bg-[hsl(var(--color-muted))] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <BrandLogo className="h-8 w-8 lg:hidden" />

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="hidden lg:flex hover:bg-[hsl(var(--color-muted))]"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {breadcrumbs.length > 0 && (
          <div className="hidden sm:block">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}
      </div>

      <div className="flex-1 flex justify-center px-2 sm:px-4 lg:px-8">
        <form onSubmit={submitSearch} className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search students by name, phone or ID…"
            className="w-full rounded-lg border border-[hsl(var(--color-border-premium))] bg-[hsl(var(--color-card-bg))] py-1.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--color-primary-blue))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary-blue))]/20 transition-all"
          />
        </form>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <DropdownMenu
          align="end"
          className="w-[min(22.5rem,calc(100vw-1.5rem))] p-0"
          trigger={
            <Button variant="ghost" size="icon" className="relative hover:bg-[hsl(var(--color-muted))]">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-[hsl(var(--color-primary-blue))] to-[hsl(var(--color-indigo-accent))] text-[10px] font-semibold text-white flex items-center justify-center shadow-md">
                  {unreadCount}
                </span>
              )}
            </Button>
          }
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[hsl(var(--color-border-premium))]">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs font-medium text-[hsl(var(--color-primary-blue))] hover:underline"
                onClick={(event) => {
                  event.stopPropagation();
                  setReadIds(new Set(inbox.map((item) => item.id)));
                }}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto py-1">
            {inbox.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.id}
                  className="items-start gap-3 rounded-none px-4 py-3 hover:bg-[hsl(var(--color-muted))]/70"
                  onClick={() => {
                    setReadIds((prev) => new Set([...prev, item.id]));
                    navigate(item.to);
                  }}
                >
                  <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', item.tone)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="flex items-start justify-between gap-2">
                      <span className={cn('text-sm leading-5', item.unread ? 'font-semibold' : 'font-medium')}>{item.title}</span>
                      {item.unread && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--color-primary-blue))]" />}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{item.detail}</span>
                  </span>
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenu>

        {fullscreen.supported && (
          <Button
            variant="ghost"
            size="icon"
            onClick={fullscreen.toggle}
            title={fullscreen.active ? 'Exit full screen' : 'Full screen'}
            aria-label={fullscreen.active ? 'Exit full screen' : 'Full screen'}
            className="hover:bg-[hsl(var(--color-muted))]"
          >
            {fullscreen.active ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>
        )}

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="hover:bg-[hsl(var(--color-muted))]">
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        <DropdownMenu
          align="end"
          className="w-[280px] p-0"
          trigger={
            <button
              type="button"
              className="flex items-center gap-2 sm:gap-2.5 rounded-lg px-1.5 py-1 hover:bg-[hsl(var(--color-muted))] transition-all"
            >
              <Avatar fallback={initials(displayName)} className="h-8 w-8" />
              <div className="hidden lg:block text-left">
                <div className="text-sm font-medium leading-tight text-foreground">{displayName}</div>
                <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">{displayEmail}</div>
              </div>
              <ChevronDown className="hidden lg:block h-3.5 w-3.5 text-muted-foreground" />
            </button>
          }
        >
          <div className="flex items-center gap-3 px-3.5 py-3 border-b border-[hsl(var(--color-border-premium))]">
            <Avatar fallback={initials(displayName)} className="h-10 w-10" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
              <span className="mt-1 inline-flex rounded-full bg-[hsl(var(--color-muted))] px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Administrator
              </span>
            </div>
          </div>
          <div className="p-1.5">
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 text-muted-foreground" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/users')}>
              <Users className="h-4 w-4 text-muted-foreground" />
              Users
            </DropdownMenuItem>
          </div>
          <DropdownMenuSeparator className="mx-0" />
          <div className="p-1.5">
            <DropdownMenuItem className="text-destructive hover:text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </div>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default AdminHeader;
