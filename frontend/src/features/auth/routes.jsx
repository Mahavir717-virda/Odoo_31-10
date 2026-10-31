import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

export const routes = [
  { path: '/login', element: <LoginPage />, public: true },
  { path: '/register', element: <RegisterPage />, public: true },
  { path: '/forgot-password', element: <ForgotPasswordPage />, public: true },
  { path: '/reset-password', element: <ResetPasswordPage />, public: true },
];

export default routes;

