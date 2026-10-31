import DiscountListPage from './pages/DiscountListPage';
import DiscountFormPage from './pages/DiscountFormPage';
import { USER_ROLES } from '../../utils/constants';

export const routes = [
  {
    path: '/discounts',
    element: <DiscountListPage />,
    roles: [USER_ROLES.admin, USER_ROLES.staff],
  },
  {
    path: '/discounts/new',
    element: <DiscountFormPage />,
    roles: [USER_ROLES.admin, USER_ROLES.staff],
  },
  {
    path: '/discounts/:id',
    element: <DiscountFormPage />,
    roles: [USER_ROLES.admin, USER_ROLES.staff],
  },
];

export default routes;

