import InvoiceListPage from './pages/InvoiceListPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';

export const INVOICES_ROUTES = [
  {
    path: '/invoices',
    element: InvoiceListPage,
  },
  {
    path: '/invoices/:id',
    element: InvoiceDetailPage,
  },
];
