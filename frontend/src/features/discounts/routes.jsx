import DiscountListPage from './pages/DiscountListPage';
import DiscountFormPage from './pages/DiscountFormPage';

export const routes = [
  {
    path: '/discounts',
    element: <DiscountListPage />,
    roles: ['ADMIN', 'admin'],
  },
  {
    path: '/discounts/new',
    element: <DiscountFormPage />,
    roles: ['ADMIN', 'admin'],
  },
  {
    path: '/discounts/:id',
    element: <DiscountFormPage />,
    roles: ['ADMIN', 'admin'],
  },
];

export default routes;
