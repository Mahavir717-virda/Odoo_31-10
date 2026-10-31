import InvoiceListPage from './pages/InvoiceListPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';

export const INVOICES_ROUTES = [
  {
    path: '/invoices',
    element: InvoiceListPage,
    roles: ['ADMIN', 'STAFF'],
  },
  {
    path: '/invoices/:id',
    element: InvoiceDetailPage,
    roles: ['ADMIN', 'STAFF'],
  },
];
