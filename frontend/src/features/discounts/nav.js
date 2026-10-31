import { USER_ROLES } from '../../utils/constants';

export default {
  label: 'Discounts',
  path: '/discounts',
  roles: [USER_ROLES.admin, USER_ROLES.staff],
};

