import SubscriptionListPage from './pages/SubscriptionListPage';
import SubscriptionFormPage from './pages/SubscriptionFormPage';
import SubscriptionDetailPage from './pages/SubscriptionDetailPage';

export const SUBSCRIPTIONS_ROUTES = [
  {
    path: '/subscriptions',
    element: SubscriptionListPage,
  },
  {
    path: '/subscriptions/create',
    element: SubscriptionFormPage,
  },
  {
    path: '/subscriptions/create-from-template/:id',
    element: SubscriptionFormPage,
  },
  {
    path: '/subscriptions/:id',
    element: SubscriptionDetailPage,
  },
];
