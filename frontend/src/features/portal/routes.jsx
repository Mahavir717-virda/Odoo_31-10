import MyInvoiceDetailPage from './pages/MyInvoiceDetailPage';
import MyInvoicesPage from './pages/MyInvoicesPage';
import MySubscriptionsPage from './pages/MySubscriptionsPage';

const CUSTOMER = ['CUSTOMER'];

export const PORTAL_ROUTES = [
  { path: '/portal/subscriptions', element: MySubscriptionsPage, roles: CUSTOMER },
  { path: '/portal/invoices', element: MyInvoicesPage, roles: CUSTOMER },
  { path: '/portal/invoices/:id', element: MyInvoiceDetailPage, roles: CUSTOMER },
];

export default PORTAL_ROUTES;
