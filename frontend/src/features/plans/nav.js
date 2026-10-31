import { USER_ROLES } from '../../utils/constants';

export default {
  label: 'Plans',
  path: '/plans',
  roles: [USER_ROLES.admin, USER_ROLES.staff],
};

