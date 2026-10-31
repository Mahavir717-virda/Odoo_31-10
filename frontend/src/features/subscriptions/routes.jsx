import SubscriptionDetailPage from './pages/SubscriptionDetailPage';
import SubscriptionFormPage from './pages/SubscriptionFormPage';
import SubscriptionListPage from './pages/SubscriptionListPage';

export const SUBSCRIPTIONS_ROUTES = [
  { path: '/subscriptions', element: SubscriptionListPage, roles: ['ADMIN', 'STAFF'] },
  { path: '/subscriptions/new', element: SubscriptionFormPage, roles: ['ADMIN', 'STAFF'] },
  { path: '/subscriptions/:id/edit', element: SubscriptionFormPage, roles: ['ADMIN', 'STAFF'] },
  { path: '/subscriptions/:id', element: SubscriptionDetailPage, roles: ['ADMIN', 'STAFF'] },
];

export default SUBSCRIPTIONS_ROUTES;
