import { DASHBOARD_ROUTES } from '../features/dashboard/routes';
import { PORTAL_ROUTES } from '../features/portal/routes';
import { SUBSCRIPTIONS_ROUTES } from '../features/subscriptions/routes';
import { QUOTATION_TEMPLATES_ROUTES } from '../features/quotation-templates/routes';

export const APP_ROUTES = [
  ...DASHBOARD_ROUTES,
  ...PORTAL_ROUTES,
  ...SUBSCRIPTIONS_ROUTES,
  ...QUOTATION_TEMPLATES_ROUTES,
];

import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRedirect from './RoleRedirect';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/layout/PageHeader';
import Forbidden from '../pages/Forbidden';
import NotFound from '../pages/NotFound';
import { useAuth } from '../context/AuthContext';
import ProfileCard from '../features/portal/components/ProfileCard';

// Public Auth Pages
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage';

// FE1 Feature Pages
import StaffListPage from '../features/staff/pages/StaffListPage';
import ProductListPage from '../features/products/pages/ProductListPage';
import ProductFormPage from '../features/products/pages/ProductFormPage';
import PlanListPage from '../features/plans/pages/PlanListPage';
import PlanFormPage from '../features/plans/pages/PlanFormPage';
import TaxListPage from '../features/taxes/pages/TaxListPage';
import DiscountListPage from '../features/discounts/pages/DiscountListPage';
import DiscountFormPage from '../features/discounts/pages/DiscountFormPage';

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
        description="Welcome to your account portal. Review your details and recent activity."
      />
      <ProfileCard user={user} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-2">My Subscriptions</h4>
          <p className="text-sm text-gray-500">View and manage your active subscriptions.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-2">My Invoices</h4>
          <p className="text-sm text-gray-500">View billing history and download receipts.</p>
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

export default function AppRoutes() {
  const discoveredRoutes = getDiscoveredRoutes();

  // Known routes already explicitly declared in fallback map
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
  ]);

  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Global Fallback & Access Control Routes */}
      <Route path="/forbidden" element={<Forbidden />} />

      {/* Authenticated Application Shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Default entry route redirects based on role */}
          <Route path="/" element={<RoleRedirect />} />

          {/* Admin & Staff Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={STAFF_AND_ADMIN_ROLES}>
                <ShellFeaturePlaceholder
                  title="Dashboard"
                  description="Performance metrics, revenue analytics, and overdue subscription tracking."
                />
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

          {/* Discounts: Admin & Staff */}
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
              <ProtectedRoute allowedRoles={STAFF_AND_ADMIN_ROLES}>
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

          {/* Subscriptions Module Shell Placeholders */}
          <Route
            path="/subscriptions"
            element={
              <ProtectedRoute allowedRoles={STAFF_AND_ADMIN_ROLES}>
                <ShellFeaturePlaceholder
                  title="Subscriptions"
                  description="Recurring subscription lifecycle and status management."
                />
              </ProtectedRoute>
            }
          />

          {/* Invoices Module Shell Placeholders */}
          <Route
            path="/invoices"
            element={
              <ProtectedRoute allowedRoles={STAFF_AND_ADMIN_ROLES}>
                <ShellFeaturePlaceholder
                  title="Invoices"
                  description="Customer invoices and payment status tracking."
                />
              </ProtectedRoute>
            }
          />

          {/* Payments Module Shell Placeholders */}
          <Route
            path="/payments"
            element={
              <ProtectedRoute allowedRoles={STAFF_AND_ADMIN_ROLES}>
                <ShellFeaturePlaceholder
                  title="Payments"
                  description="Transaction ledger and payment reconciliation."
                />
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

          {/* Customer Portal Routes */}
          <Route
            path="/portal"
            element={
              <ProtectedRoute allowedRoles={CUSTOMER_ROLES}>
                <PortalOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/subscriptions"
            element={
              <ProtectedRoute allowedRoles={CUSTOMER_ROLES}>
                <ShellFeaturePlaceholder
                  title="My Subscriptions"
                  description="Review your active service subscriptions and renewals."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/invoices"
            element={
              <ProtectedRoute allowedRoles={CUSTOMER_ROLES}>
                <ShellFeaturePlaceholder
                  title="My Invoices"
                  description="Review invoice history and payment receipts."
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
                element={
                  route.roles ? (
                    <ProtectedRoute allowedRoles={route.roles}>{route.element}</ProtectedRoute>
                  ) : (
                    route.element
                  )
                }
              />
            ))}
        </Route>
      </Route>

      {/* 404 Catch-All Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
