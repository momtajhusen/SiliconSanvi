import { Outlet, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, PhoneCall, IndianRupee, Menu, ReceiptText, Package, Boxes } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import PageFade from '../motion/PageFade';
import useUIStore from '../../stores/uiStore';
import { cn } from '../../lib/utils';
import useScrollTopOnNavigate from '../../hooks/useScrollTopOnNavigate';

const TABS = {
  institute: [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/admissions/inquiries', label: 'Inquiries', icon: PhoneCall },
    { to: '/students', label: 'Students', icon: GraduationCap },
    { to: '/finance/payments', label: 'Fees', icon: IndianRupee },
  ],
  traders: [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/traders/jobs', label: 'Bills', icon: ReceiptText },
    { to: '/traders/products', label: 'Products', icon: Package },
    { to: '/traders/stock', label: 'Stock', icon: Boxes },
  ],
};

function AdminLayout() {
  const location = useLocation();
  useScrollTopOnNavigate();
  const setMobileOpen = useUIStore((state) => state.setMobileOpen);
  const business = useUIStore((state) => state.business);

  return (
    <div className="admin-shell flex h-dvh flex-col overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0">
            <PageFade className="page-container">
              <Outlet />
            </PageFade>
          </main>
        </div>
      </div>

      <nav className="mkt-bottom-nav lg:hidden" aria-label="Admin navigation">
        {TABS[business].map((tab) => {
          const Icon = tab.icon;
          const active = location.pathname === tab.to || location.pathname.startsWith(`${tab.to}/`);
          return (
            <Link key={tab.to} to={tab.to} className={cn(active && 'is-active')}>
              <Icon className="h-5 w-5" />
              {tab.label}
            </Link>
          );
        })}
        <button type="button" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
          Menu
        </button>
      </nav>
    </div>
  );
}

export default AdminLayout;
