import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from '../components/ui/ProtectedRoute';
import PageLoader from '../components/ui/PageLoader';

const AuthLayout = lazy(() => import('../components/layout/AuthLayout'));
const AdminLayout = lazy(() => import('../components/layout/AdminLayout'));
const PublicLayout = lazy(() => import('../components/layout/PublicLayout'));
const SiliconLayout = lazy(() => import('../components/layout/SiliconLayout'));
const SanviLayout = lazy(() => import('../components/layout/SanviLayout'));
const SiliconPage = lazy(() => import('../pages/brand/SiliconPage'));
const SanviPage = lazy(() => import('../pages/brand/SanviPage'));

// Partners now live on the Partners & bills page; keep old bookmarks working.
function OldPartnerLink() {
  const { id } = useParams();
  return <Navigate to={id ? `/traders/jobs?partner=${id}` : '/traders/jobs'} replace />;
}

// Single source of truth for the router and the admin sidebar.
export const ROUTE_DEFS = {
  public: [
    { path: '/', label: 'Home', component: lazy(() => import('../pages/public/HomePage')) },
    { path: '/courses', label: 'Courses', component: lazy(() => import('../pages/public/CoursesPage')) },
    { path: '/cctv', label: 'CCTV', component: lazy(() => import('../pages/public/CctvPage')) },
    { path: '/products', label: 'Computer Parts', component: lazy(() => import('../pages/public/ProductsPage')) },
    { path: '/about', label: 'About', component: lazy(() => import('../pages/public/AboutPage')) },
    { path: '/contact', label: 'Contact', component: lazy(() => import('../pages/public/ContactPage')) },
    { path: '/admission', label: 'Online admission', component: lazy(() => import('../pages/public/AdmissionPage')) },
  ],
  auth: [
    { path: '/auth/login', label: 'Login', component: lazy(() => import('../pages/auth/LoginPage')) },
  ],
  admin: [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: 'LayoutDashboard',
      group: 'Main',
      component: lazy(() => import('../pages/admin/DashboardPage')),
    },
    {
      path: '/institute/overview',
      label: 'Overview',
      icon: 'School',
      group: 'Admissions',
      component: lazy(() => import('../pages/admin/institute/OverviewPage')),
    },
    {
      path: '/admissions/inquiries',
      label: 'Inquiries',
      icon: 'PhoneCall',
      group: 'Admissions',
      component: lazy(() => import('../pages/admin/admissions/InquiriesPage')),
    },
    {
      path: '/admissions/inquiries/:id',
      label: 'Inquiry',
      hidden: true,
      component: lazy(() => import('../pages/admin/admissions/InquiryDetailPage')),
    },
    {
      path: '/admissions/online',
      label: 'Online admission',
      icon: 'Globe',
      group: 'Admissions',
      component: lazy(() => import('../pages/admin/admissions/OnlineAdmissionsPage')),
    },
    {
      path: '/students',
      label: 'Students',
      icon: 'GraduationCap',
      group: 'Admissions',
      component: lazy(() => import('../pages/admin/students/StudentsPage')),
    },
    {
      path: '/students/new',
      label: 'New admission',
      hidden: true,
      component: lazy(() => import('../pages/admin/students/StudentFormPage')),
    },
    {
      path: '/students/:id',
      label: 'Student',
      hidden: true,
      component: lazy(() => import('../pages/admin/students/StudentDetailPage')),
    },
    {
      path: '/students/:id/edit',
      label: 'Edit student',
      hidden: true,
      component: lazy(() => import('../pages/admin/students/StudentFormPage')),
    },
    {
      path: '/students/:id/admission-form',
      label: 'Admission form',
      hidden: true,
      component: lazy(() => import('../pages/admin/students/AdmissionFormPage')),
    },
    {
      path: '/enrollments',
      label: 'Enrollments',
      icon: 'BookOpenCheck',
      group: 'Admissions',
      component: lazy(() => import('../pages/admin/enrollments/EnrollmentsPage')),
    },
    {
      path: '/enrollments/:id',
      label: 'Enrollment',
      hidden: true,
      component: lazy(() => import('../pages/admin/enrollments/EnrollmentDetailPage')),
    },
    {
      path: '/academics/courses',
      label: 'Courses',
      icon: 'Library',
      group: 'Academics',
      component: lazy(() => import('../pages/admin/academics/CoursesPage')),
    },
    {
      path: '/academics/courses/:id',
      label: 'Course',
      hidden: true,
      component: lazy(() => import('../pages/admin/academics/CourseViewPage')),
    },
    {
      path: '/academics/batches',
      label: 'Batches',
      icon: 'Layers',
      group: 'Academics',
      component: lazy(() => import('../pages/admin/academics/BatchesPage')),
    },
    {
      path: '/finance/fees',
      label: 'Fee structures',
      icon: 'Receipt',
      group: 'Finance',
      component: lazy(() => import('../pages/admin/finance/FeesPage')),
    },
    {
      path: '/finance/fees/:id',
      label: 'Fee details',
      hidden: true,
      component: lazy(() => import('../pages/admin/finance/FeeDetailPage')),
    },
    {
      path: '/finance/payments',
      label: 'Payments',
      icon: 'IndianRupee',
      group: 'Finance',
      component: lazy(() => import('../pages/admin/finance/PaymentsPage')),
    },
    {
      path: '/finance/payments/:id',
      label: 'Receipt',
      hidden: true,
      component: lazy(() => import('../pages/admin/finance/ReceiptPage')),
    },
    {
      path: '/institute/reports',
      label: 'Reports',
      icon: 'BarChart3',
      group: 'Finance',
      component: lazy(() => import('../pages/admin/institute/ReportsPage')),
    },
    {
      path: '/traders/overview',
      label: 'Overview',
      icon: 'Store',
      group: 'Sales',
      business: 'traders',
      component: lazy(() => import('../pages/admin/traders/OverviewPage')),
    },
    {
      path: '/traders/jobs',
      label: 'Partners & bills',
      icon: 'ReceiptText',
      group: 'Sales',
      business: 'traders',
      component: lazy(() => import('../pages/admin/traders/JobsPage')),
    },
    {
      path: '/traders/jobs/new',
      label: 'New bill',
      hidden: true,
      component: lazy(() => import('../pages/admin/traders/JobFormPage')),
    },
    {
      path: '/traders/jobs/:id',
      label: 'Bill',
      hidden: true,
      component: lazy(() => import('../pages/admin/traders/JobBillPage')),
    },
    {
      path: '/traders/jobs/:id/edit',
      label: 'Edit bill',
      hidden: true,
      component: lazy(() => import('../pages/admin/traders/JobFormPage')),
    },
    {
      path: '/traders/partners/:id?',
      label: 'Partner',
      hidden: true,
      component: lazy(() => Promise.resolve({ default: OldPartnerLink })),
    },
    {
      path: '/traders/products',
      label: 'Products',
      icon: 'Package',
      group: 'Inventory',
      business: 'traders',
      component: lazy(() => import('../pages/admin/traders/ProductsPage')),
    },
    {
      path: '/traders/purchases',
      label: 'Purchases',
      icon: 'ShoppingCart',
      group: 'Inventory',
      business: 'traders',
      component: lazy(() => import('../pages/admin/traders/PurchasesPage')),
    },
    {
      path: '/traders/purchases/new',
      label: 'Record purchase',
      hidden: true,
      component: lazy(() => import('../pages/admin/traders/PurchaseFormPage')),
    },
    {
      path: '/traders/purchases/:id',
      label: 'Purchase',
      hidden: true,
      component: lazy(() => import('../pages/admin/traders/PurchaseDetailPage')),
    },
    {
      path: '/traders/purchases/:id/edit',
      label: 'Edit purchase',
      hidden: true,
      component: lazy(() => import('../pages/admin/traders/PurchaseFormPage')),
    },
    {
      path: '/traders/suppliers',
      label: 'Suppliers',
      icon: 'Truck',
      group: 'Inventory',
      business: 'traders',
      component: lazy(() => import('../pages/admin/traders/SuppliersPage')),
    },
    {
      path: '/traders/stock',
      label: 'Stock',
      icon: 'Boxes',
      group: 'Inventory',
      business: 'traders',
      component: lazy(() => import('../pages/admin/traders/StockPage')),
    },
    {
      path: '/traders/reports',
      label: 'Reports',
      icon: 'BarChart3',
      group: 'Inventory',
      business: 'traders',
      component: lazy(() => import('../pages/admin/traders/ReportsPage')),
    },
    {
      path: '/users',
      label: 'Users',
      icon: 'Users',
      group: 'Admin',
      component: lazy(() => import('../pages/admin/UsersPage')),
    },
    {
      path: '/website/images',
      label: 'Website images',
      icon: 'Images',
      group: 'Admin',
      component: lazy(() => import('../pages/admin/WebsiteImagesPage')),
    },
    {
      path: '/setup/company',
      label: 'Company setup',
      icon: 'Building2',
      group: 'Admin',
      component: lazy(() => import('../pages/admin/CompanySetupPage')),
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: 'Settings',
      group: 'Admin',
      component: lazy(() => import('../pages/admin/SettingsPage')),
    },
    {
      path: '/ui/showcase',
      label: 'UI Showcase',
      icon: 'Palette',
      group: 'Admin',
      component: lazy(() => import('../pages/admin/UiShowcasePage')),
    },
  ],
};

function LoadingFallback() {
  return <PageLoader label="Loading…" />;
}

function ScreenLoader() {
  return <PageLoader fullscreen label="Loading Silicon & Sanvi…" />;
}

function lazyElement(Component) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    element: (
      <Suspense fallback={<ScreenLoader />}>
        <PublicLayout />
      </Suspense>
    ),
    children: ROUTE_DEFS.public.map((route) => ({
      index: route.path === '/',
      path: route.path === '/' ? undefined : route.path.replace(/^\//, ''),
      element: lazyElement(route.component),
    })),
  },
  {
    path: '/silicon',
    element: (
      <Suspense fallback={<ScreenLoader />}>
        <SiliconLayout />
      </Suspense>
    ),
    children: [{ index: true, element: lazyElement(SiliconPage) }],
  },
  {
    path: '/sanvi',
    element: (
      <Suspense fallback={<ScreenLoader />}>
        <SanviLayout />
      </Suspense>
    ),
    children: [{ index: true, element: lazyElement(SanviPage) }],
  },
  {
    path: '/auth',
    element: (
      <Suspense fallback={<ScreenLoader />}>
        <AuthLayout />
      </Suspense>
    ),
    children: ROUTE_DEFS.auth.map((route) => ({
      path: route.path.replace('/auth/', ''),
      element: lazyElement(route.component),
    })),
  },
  {
    element: (
      <ProtectedRoute>
        <Suspense fallback={<ScreenLoader />}>
          <AdminLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    children: ROUTE_DEFS.admin.map((route) => ({
      path: route.path,
      element: lazyElement(route.component),
    })),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
