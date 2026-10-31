import { createElement, useEffect } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/layout/PageHeader';
import ProfileCard from '../features/portal/components/ProfileCard';
import { DASHBOARD_ROUTES } from '../features/dashboard/routes';
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

const ADMIN = ['ADMIN', 'admin'];
const STAFF_ADMIN = ['ADMIN', 'admin', 'STAFF', 'staff'];
const CUSTOMER = ['CUSTOMER', 'customer'];

function PortalOverview() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <PageHeader title="Customer portal" description="Review your account and recent activity." />
      <ProfileCard user={user} />
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900">My subscriptions</h2>
          <p className="mt-2 text-sm text-gray-500">Review your plans and line items.</p>
          <Link className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline" to="/portal/subscriptions">View subscriptions</Link>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900">My invoices</h2>
          <p className="mt-2 text-sm text-gray-500">Review invoice history and balances.</p>
          <Link className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline" to="/portal/invoices">View invoices</Link>
        </section>
      </div>
    </div>
  );
}

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
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/staff" element={<ProtectedRoute allowedRoles={ADMIN}><StaffListPage /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute allowedRoles={STAFF_ADMIN}><ProductListPage /></ProtectedRoute>} />
          <Route path="/products/new" element={<ProtectedRoute allowedRoles={ADMIN}><ProductFormPage /></ProtectedRoute>} />
          <Route path="/products/:id" element={<ProtectedRoute allowedRoles={STAFF_ADMIN}><ProductFormPage /></ProtectedRoute>} />
          <Route path="/plans" element={<ProtectedRoute allowedRoles={ADMIN}><PlanListPage /></ProtectedRoute>} />
          <Route path="/plans/new" element={<ProtectedRoute allowedRoles={ADMIN}><PlanFormPage /></ProtectedRoute>} />
          <Route path="/plans/:id" element={<ProtectedRoute allowedRoles={ADMIN}><PlanFormPage /></ProtectedRoute>} />
          <Route path="/taxes" element={<ProtectedRoute allowedRoles={ADMIN}><TaxListPage /></ProtectedRoute>} />
          <Route path="/discounts" element={<ProtectedRoute allowedRoles={STAFF_ADMIN}><DiscountListPage /></ProtectedRoute>} />
          <Route path="/discounts/new" element={<ProtectedRoute allowedRoles={ADMIN}><DiscountFormPage /></ProtectedRoute>} />
          <Route path="/discounts/:id" element={<ProtectedRoute allowedRoles={STAFF_ADMIN}><DiscountFormPage /></ProtectedRoute>} />
          <Route path="/portal" element={<ProtectedRoute allowedRoles={CUSTOMER}><PortalOverview /></ProtectedRoute>} />
          <Route path="/quotation-templates" element={<Navigate to="/templates" replace />} />
          {APP_ROUTES.map((route) => {
            const Page = route.element;
            return (
              <Route
                key={route.path}
                path={route.path}
                element={<ProtectedRoute allowedRoles={route.roles}>{createElement(Page)}</ProtectedRoute>}
              />
            );
          })}
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
