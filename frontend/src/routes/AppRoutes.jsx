import { createElement, useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/layout/PageHeader';
import ProfileCard from '../features/portal/components/ProfileCard';
import { DASHBOARD_ROUTES } from '../features/dashboard/routes';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import { INVOICES_ROUTES } from '../features/invoices/routes';
import { PAYMENTS_ROUTES } from '../features/payments/routes';
import { PORTAL_ROUTES } from '../features/portal/routes';
import { QUOTATION_TEMPLATES_ROUTES } from '../features/quotation-templates/routes';
import { SUBSCRIPTIONS_ROUTES } from '../features/subscriptions/routes';
import { useAuth } from '../context/AuthContext';
import DiscountFormPage from '../features/discounts/pages/DiscountFormPage';
import DiscountListPage from '../features/discounts/pages/DiscountListPage';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage';
import PlanFormPage from '../features/plans/pages/PlanFormPage';
import PlanListPage from '../features/plans/pages/PlanListPage';
import ProductFormPage from '../features/products/pages/ProductFormPage';
import ProductListPage from '../features/products/pages/ProductListPage';
import StaffListPage from '../features/staff/pages/StaffListPage';
import TaxListPage from '../features/taxes/pages/TaxListPage';
import MySubscriptionsPage from '../features/portal/pages/MySubscriptionsPage';
import MyInvoicesPage from '../features/portal/pages/MyInvoicesPage';
import MyInvoiceDetailPage from '../features/portal/pages/MyInvoiceDetailPage';
import Forbidden from '../pages/Forbidden';
import NotFound from '../pages/NotFound';
import ProtectedRoute from './ProtectedRoute';
import RoleRedirect from './RoleRedirect';

export const APP_ROUTES = [
  ...DASHBOARD_ROUTES,
  ...PORTAL_ROUTES,
  ...SUBSCRIPTIONS_ROUTES,
  ...QUOTATION_TEMPLATES_ROUTES,
  ...INVOICES_ROUTES,
  ...PAYMENTS_ROUTES,
];

const ADMIN_ROLES = ['ADMIN', 'admin'];
const STAFF_AND_ADMIN_ROLES = ['ADMIN', 'admin', 'STAFF', 'staff'];
const CUSTOMER_ROLES = ['CUSTOMER', 'customer'];

// Shell Fallback for features in progress
function ShellFeaturePlaceholder({ title, description }) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
          {description || 'This module is connected to the frontend shell.'}
        </p>
      </div>
    </div>
  );
}

function PortalOverview() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Portal"
        description="Welcome to your account portal. Review your subscriptions, invoices, and billing history."
      />
      <ProfileCard user={user} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-2">My Subscriptions</h4>
          <p className="text-sm text-gray-500 mb-4">View and manage your active service subscriptions and renewals.</p>
          <a
            href="/portal/subscriptions"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Manage Subscriptions &rarr;
          </a>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-2">My Invoices</h4>
          <p className="text-sm text-gray-500 mb-4">View billing history, payment statuses, and print receipts.</p>
          <a
            href="/portal/invoices"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            View Invoices &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}

// Dynamic Feature Route Discovery via Vite's import.meta.glob
function getDiscoveredRoutes() {
  try {
    const modules = import.meta.glob('../features/**/routes.jsx', { eager: true });
    const discovered = [];
    for (const path in modules) {
      if (path.includes('/auth/')) continue;
      if (path.includes('/portal/')) continue; // Handled explicitly under PortalLayout

      const mod = modules[path];
      const list = mod.default || mod.routes || mod.QUOTATION_TEMPLATES_ROUTES || mod.SUBSCRIPTIONS_ROUTES || Object.values(mod).find(Array.isArray);
      if (Array.isArray(list)) {
        list.forEach((r) => {
          if (r && r.path && r.element) {
            discovered.push(r);
          }
        });
      }
    }
    return discovered;
  } catch {
    return [];
  }
}

const discoveredRoutes = getDiscoveredRoutes();

// Known routes already explicitly declared in AppLayout or PortalLayout
const knownPaths = new Set([
  '/',
  '/dashboard',
  '/staff',
  '/products',
  '/products/new',
  '/products/:id',
  '/plans',
  '/plans/new',
  '/plans/:id',
  '/taxes',
  '/discounts',
  '/discounts/new',
  '/discounts/:id',
  '/portal',
  '/portal/subscriptions',
  '/portal/invoices',
  '/portal/invoices/:id',
]);

export default function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleNavigation = (event) => {
      if (event.detail?.to) navigate(event.detail.to, { replace: event.detail.replace });
    };
    window.addEventListener('app:navigate', handleNavigation);
    return () => window.removeEventListener('app:navigate', handleNavigation);
  }, [navigate]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/forbidden" element={<Forbidden />} />

      {/* Customer Portal Layout for CUSTOMER role */}
      <Route element={<ProtectedRoute allowedRoles={CUSTOMER_ROLES} />}>
        <Route path="/portal" element={<PortalOverview />} />
        <Route path="/portal/subscriptions" element={<MySubscriptionsPage />} />
        <Route path="/portal/invoices" element={<MyInvoicesPage />} />
        <Route path="/portal/invoices/:id" element={<MyInvoiceDetailPage />} />
      </Route>

      {/* Authenticated Staff & Admin Application Shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<RoleRedirect />} />

          {/* Admin & Staff: Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={STAFF_AND_ADMIN_ROLES}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Only: Staff Management */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                <StaffListPage />
              </ProtectedRoute>
            }
          />

          {/* Products: Staff can view; only Admin can create */}
          <Route
            path="/products"
            element={
              <ProtectedRoute allowedRoles={STAFF_AND_ADMIN_ROLES}>
                <ProductListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/new"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                <ProductFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:id"
            element={
              <ProtectedRoute allowedRoles={STAFF_AND_ADMIN_ROLES}>
                <ProductFormPage />
              </ProtectedRoute>
            }
          />

          {/* Plans: Admin Only */}
          <Route
            path="/plans"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                <PlanListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plans/new"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                <PlanFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plans/:id"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                <PlanFormPage />
              </ProtectedRoute>
            }
          />

          {/* Taxes: Admin Only */}
          <Route
            path="/taxes"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                <TaxListPage />
              </ProtectedRoute>
            }
          />

          {/* Discounts: Staff can view; only Admin can create */}
          <Route
            path="/discounts"
            element={
              <ProtectedRoute allowedRoles={STAFF_AND_ADMIN_ROLES}>
                <DiscountListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/discounts/new"
            element={
              <ProtectedRoute allowedRoles={ADMIN_ROLES}>
                <DiscountFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/discounts/:id"
            element={
              <ProtectedRoute allowedRoles={STAFF_AND_ADMIN_ROLES}>
                <DiscountFormPage />
              </ProtectedRoute>
            }
          />

          {/* Quotation Templates Shell Placeholders */}
          <Route
            path="/quotation-templates"
            element={
              <ProtectedRoute allowedRoles={STAFF_AND_ADMIN_ROLES}>
                <ShellFeaturePlaceholder
                  title="Quotation Templates"
                  description="Standardized contract and quote blueprints."
                />
              </ProtectedRoute>
            }
          />

          {/* Dynamically Discovered Feature Routes from features */}
          {discoveredRoutes
            .filter((route) => !knownPaths.has(route.path))
            .map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<ProtectedRoute allowedRoles={route.roles}>{createElement(route.element)}</ProtectedRoute>}
              />
            ))}
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}