import PlanListPage from './pages/PlanListPage';
import PlanFormPage from './pages/PlanFormPage';
import { USER_ROLES } from '../../utils/constants';

export const routes = [
  {
    path: '/plans',
    element: <PlanListPage />,
    roles: [USER_ROLES.admin, USER_ROLES.staff],
  },
  {
    path: '/plans/new',
    element: <PlanFormPage />,
    roles: [USER_ROLES.admin, USER_ROLES.staff],
  },
  {
    path: '/plans/:id',
    element: <PlanFormPage />,
    roles: [USER_ROLES.admin, USER_ROLES.staff],
  },
];

export default routes;

