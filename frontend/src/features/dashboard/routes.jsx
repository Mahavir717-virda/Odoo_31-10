import DashboardPage from './pages/DashboardPage';

export const DASHBOARD_ROUTES = [
  {
    path: '/dashboard',
    element: DashboardPage,
    roles: ['ADMIN', 'STAFF'],
  },
];

export default DASHBOARD_ROUTES;
