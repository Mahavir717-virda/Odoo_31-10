import TaxListPage from './pages/TaxListPage';
import { USER_ROLES } from '../../utils/constants';

export const routes = [
  {
    path: '/taxes',
    element: <TaxListPage />,
    roles: [USER_ROLES.admin, USER_ROLES.staff],
  },
];

export default routes;

