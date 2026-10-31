import MySubscriptionsPage from './pages/MySubscriptionsPage';
import MyInvoicesPage from './pages/MyInvoicesPage';
import MyInvoiceDetailPage from './pages/MyInvoiceDetailPage';

export const PORTAL_ROUTES = [
  {
    path: '/portal/subscriptions',
    element: <MySubscriptionsPage />,
  },
  {
    path: '/portal/invoices',
    element: <MyInvoicesPage />,
  },
  {
    path: '/portal/invoices/:id',
    element: <MyInvoiceDetailPage />,
  },
];

export default PORTAL_ROUTES;
