import ProductListPage from './pages/ProductListPage';
import ProductFormPage from './pages/ProductFormPage';
import { USER_ROLES } from '../../utils/constants';

export const routes = [
  {
    path: '/products',
    element: <ProductListPage />,
    roles: [USER_ROLES.admin, USER_ROLES.staff],
  },
  {
    path: '/products/new',
    element: <ProductFormPage />,
    roles: [USER_ROLES.admin, USER_ROLES.staff],
  },
  {
    path: '/products/:id',
    element: <ProductFormPage />,
    roles: [USER_ROLES.admin, USER_ROLES.staff],
  },
];

export default routes;

