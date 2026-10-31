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
