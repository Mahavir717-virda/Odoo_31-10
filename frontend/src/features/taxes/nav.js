import { USER_ROLES } from '../../utils/constants';

export default {
  label: 'Taxes',
  path: '/taxes',
  roles: [USER_ROLES.admin, USER_ROLES.staff],
};

