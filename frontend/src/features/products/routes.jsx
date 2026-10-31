import ProductListPage from './pages/ProductListPage';
import ProductFormPage from './pages/ProductFormPage';

export const routes = [
  {
    path: '/products',
    element: <ProductListPage />,
    roles: ['ADMIN', 'admin', 'STAFF', 'staff'],
  },
  {
    path: '/products/new',
    element: <ProductFormPage />,
    roles: ['ADMIN', 'admin'],
  },
  {
    path: '/products/:id',
    element: <ProductFormPage />,
    roles: ['ADMIN', 'admin', 'STAFF', 'staff'],
  },
];

export default routes;
