import PlanListPage from './pages/PlanListPage';
import PlanFormPage from './pages/PlanFormPage';

export const routes = [
  {
    path: '/plans',
    element: <PlanListPage />,
    roles: ['ADMIN', 'admin'],
  },
  {
    path: '/plans/new',
    element: <PlanFormPage />,
    roles: ['ADMIN', 'admin'],
  },
  {
    path: '/plans/:id',
    element: <PlanFormPage />,
    roles: ['ADMIN', 'admin'],
  },
];

export default routes;
