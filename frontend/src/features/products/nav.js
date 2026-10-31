import { USER_ROLES } from '../../utils/constants';

export default {
  label: 'Products',
  path: '/products',
  roles: [USER_ROLES.admin, USER_ROLES.staff],
};

