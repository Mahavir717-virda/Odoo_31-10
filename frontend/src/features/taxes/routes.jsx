import TaxListPage from './pages/TaxListPage';

export const routes = [
  {
    path: '/taxes',
    element: <TaxListPage />,
    roles: ['ADMIN', 'admin'],
  },
];

export default routes;
