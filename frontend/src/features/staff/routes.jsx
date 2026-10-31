import StaffListPage from './pages/StaffListPage';
import { USER_ROLES } from '../../utils/constants';

export const routes = [
  {
    path: '/staff',
    element: <StaffListPage />,
    roles: [USER_ROLES.admin],
  },
];

export default routes;

