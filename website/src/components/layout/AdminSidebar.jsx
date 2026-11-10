import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Settings, Palette, Box, ChevronLeft, ChevronRight, X, PhoneCall, Globe, GraduationCap,
  BookOpenCheck, Library, Layers, Receipt, IndianRupee, Building2, Store, ReceiptText, HardHat, Package, Boxes, BarChart3, ShoppingCart, Truck, School, Images,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { ROUTE_DEFS } from '../../router';
import useUIStore from '../../stores/uiStore';
import { useAuth } from '../../hooks/useAuth';
import BrandLogo from '../brand/BrandLogo';
import { BrandTile } from '../marketing/BrandWordmark';
import { BUSINESSES } from '../../constants/site';

const iconMap = {
  LayoutDashboard, Users, Settings, Palette, PhoneCall, Globe, GraduationCap, BookOpenCheck, Library, Layers, Receipt, IndianRupee, Building2,
  Store, ReceiptText, HardHat, Package, Boxes, BarChart3, ShoppingCart, Truck, School, Images,
};

/** Institute routes keep their original groups; Sanvi routes are tagged `business: 'traders'`. */
const BUSINESS_GROUPS = {
  institute: ['Admissions', 'Academics', 'Finance'],
  traders: ['Sales', 'Inventory'],
};
const SHARED_TOP = ['Main'];
const SHARED_BOTTOM = ['Admin'];

const BUSINESS_TONE = {
  institute: {
    active: 'bg-gradient-to-r from-blue-700 to-indigo-600 text-white shadow-md shadow-blue-900/20',
    card: 'border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-indigo-500/5',
    label: 'text-blue-700 dark:text-blue-300',
    rail: 'bg-blue-500/30',
  },
  traders: {
    active: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-900/20',
    card: 'border-amber-500/25 bg-gradient-to-br from-amber-500/10 to-orange-500/5',
    label: 'text-amber-700 dark:text-amber-300',
    rail: 'bg-amber-500/40',
  },
};

const visible = ROUTE_DEFS.admin.filter((route) => !route.hidden);
const businessOf = (route) => route.business || (BUSINESS_GROUPS.institute.includes(route.group) ? 'institute' : null);

function groupsFor(groupNames) {
  return groupNames
    .map((group) => [group, visible.filter((route) => route.group === group)])
    .filter(([, routes]) => routes.length);
}

/** Business that owns the current page, if any (detail pages count too). */
function businessForPath(pathname) {
  if (pathname.startsWith('/traders')) return 'traders';
  const section = visible.find((route) => pathname === route.path || pathname.startsWith(`${route.path}/`));
  return section ? businessOf(section) : null;
}

function NavItem({ route, collapsed, onNavigate, business }) {
  const location = useLocation();
  const Icon = iconMap[route.icon] || Box;
  const isActive = location.pathname === route.path || location.pathname.startsWith(`${route.path}/`);
  return (
    <Link
      to={route.path}
      title={collapsed ? route.label : undefined}
      onClick={onNavigate}
      className={cn(
        'sidebar-item',
        isActive ? 'sidebar-item-active' : 'sidebar-item-inactive',
        business === 'traders' && 'is-traders',
        collapsed && 'justify-center px-3'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!collapsed && <span className="truncate">{route.label}</span>}
    </Link>
  );
}

function GroupLabel({ children, className }) {
  return <div className={cn('px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground', className)}>{children}</div>;
}

function BusinessSwitcher({ collapsed }) {
  const { business, setBusiness } = useUIStore();
  const options = ['institute', 'traders'];
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-1">
        {options.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setBusiness(key)}
            title={BUSINESSES[key].name}
            className={cn('rounded-xl p-0.5 transition', business === key ? 'ring-2 ring-offset-2 ring-offset-[hsl(var(--color-sidebar-bg))]' : 'opacity-50 hover:opacity-100', key === 'traders' ? 'ring-amber-500' : 'ring-blue-600')}
          >
            <BrandTile business={key} size="sm" />
          </button>
        ))}
      </div>
    );
  }
  return (
    <div role="tablist" aria-label="Business" className="grid grid-cols-2 gap-1 rounded-xl border border-[hsl(var(--color-border-premium))] bg-[hsl(var(--color-card-bg))] p-1">
      {options.map((key) => {
        const active = business === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setBusiness(key)}
            className={cn(
              'flex min-w-0 items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-left transition-all duration-200',
              active ? BUSINESS_TONE[key].active : 'text-muted-foreground hover:bg-[hsl(var(--color-muted))] hover:text-foreground'
            )}
          >
            <BrandTile business={key} size="sm" className="!h-6 !w-6 !rounded-md [&_svg]:!h-3.5 [&_svg]:!w-3.5" />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[12.5px] font-bold">{BUSINESSES[key].short}</span>
              <span className={cn('block truncate text-[9px] font-semibold uppercase tracking-wider', active ? 'text-white/75' : 'text-muted-foreground')}>
                {key === 'traders' ? 'Traders' : 'Institute'}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function NavLinks({ collapsed = false, onNavigate }) {
  const location = useLocation();
  const { business, setBusiness } = useUIStore();
  const owner = businessForPath(location.pathname);

  useEffect(() => {
    if (owner && owner !== business) setBusiness(owner);
    // Follow the page when the admin opens a link from the other business.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner]);

  const tone = BUSINESS_TONE[business];
  const info = BUSINESSES[business];

  return (
    <>
      {groupsFor(SHARED_TOP).map(([group, routes]) => (
        <div key={group} className="mb-2">
          {routes.map((route) => <NavItem key={route.path} route={route} collapsed={collapsed} onNavigate={onNavigate} />)}
        </div>
      ))}

      <div className="mb-2">
        {!collapsed && <GroupLabel>Business</GroupLabel>}
        <BusinessSwitcher collapsed={collapsed} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={business}
          initial={{ opacity: 0, x: business === 'traders' ? 12 : -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: business === 'traders' ? -12 : 12 }}
          transition={{ duration: 0.16 }}
          className={cn('mb-2 rounded-xl border', collapsed ? 'border-transparent' : tone.card, collapsed ? 'p-0' : 'p-1.5')}
        >
          {!collapsed && (
            <div className="flex items-center gap-2 px-1.5 pb-1 pt-0.5">
              <span className={cn('h-4 w-1 rounded-full', tone.rail)} />
              <span className={cn('truncate text-[11px] font-bold uppercase tracking-wider', tone.label)}>{info.name}</span>
            </div>
          )}
          {groupsFor(BUSINESS_GROUPS[business]).map(([group, routes]) => (
            <div key={group} className="mb-1 last:mb-0">
              {!collapsed && <GroupLabel className="pt-1.5">{group}</GroupLabel>}
              {routes.map((route) => <NavItem key={route.path} route={route} business={business} collapsed={collapsed} onNavigate={onNavigate} />)}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {groupsFor(SHARED_BOTTOM).map(([group, routes]) => (
        <div key={group} className="mb-2">
          {!collapsed && <GroupLabel>{group}</GroupLabel>}
          {routes.map((route) => <NavItem key={route.path} route={route} collapsed={collapsed} onNavigate={onNavigate} />)}
        </div>
      ))}
    </>
  );
}

function AdminSidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileOpen, setMobileOpen } = useUIStore();
  const { user } = useAuth();

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-slate-950/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%', transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col premium-sidebar h-dvh overflow-hidden fixed inset-y-0 left-0 z-50 will-change-transform shadow-2xl lg:hidden pb-[calc(4.75rem+env(safe-area-inset-bottom))] w-[260px]"
          >
            <div className="flex h-14 items-center border-b border-[hsl(var(--color-border-premium))] px-4">
              <BrandLogo className="h-9 w-9" />
              <span className="ml-3 flex flex-col leading-tight">
                <span className="font-semibold text-lg tracking-tight gradient-text">Silicon &amp; Sanvi</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Institute &amp; Traders</span>
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="ml-auto p-2 rounded-lg hover:bg-[hsl(var(--color-muted))] transition-all"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-3">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-[hsl(var(--color-border-premium))] px-4 py-3">
              <div className="text-xs font-medium text-foreground truncate">{user?.name || 'Admin'}</div>
              <div className="text-[11px] text-muted-foreground">Administrator</div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'flex flex-col premium-sidebar transition-all duration-300 relative h-screen overflow-hidden hidden lg:flex',
          sidebarCollapsed ? 'w-16' : 'w-[260px]'
        )}
      >
        <div className={cn('flex h-14 items-center border-b border-[hsl(var(--color-border-premium))]', sidebarCollapsed ? 'justify-center px-2' : 'px-4')}>
          <BrandLogo className="h-9 w-9" />
          {!sidebarCollapsed && (
            <span className="ml-3 flex flex-col leading-tight">
              <span className="font-semibold text-lg tracking-tight gradient-text">Silicon &amp; Sanvi</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Institute &amp; Traders</span>
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <NavLinks collapsed={sidebarCollapsed} />
        </div>

        <div className="border-t border-[hsl(var(--color-border-premium))] px-4 py-3">
          {!sidebarCollapsed ? (
            <>
              <div className="text-xs font-medium text-foreground truncate">{user?.name || 'Admin'}</div>
              <div className="text-[11px] text-muted-foreground">Administrator</div>
            </>
          ) : (
            <div className="text-[10px] text-center text-muted-foreground">A</div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[hsl(var(--color-card-bg))] border border-[hsl(var(--color-border-premium))] items-center justify-center hover:bg-[hsl(var(--color-muted))] transition-all shadow-lg z-10"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </aside>
    </>
  );
}

export default AdminSidebar;
