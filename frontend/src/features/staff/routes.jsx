import StaffListPage from './pages/StaffListPage';

export const routes = [
  {
    path: '/staff',
    element: <StaffListPage />,
    roles: ['ADMIN', 'admin'],
  },
];

export default routes;
