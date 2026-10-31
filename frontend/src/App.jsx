import { useEffect, useState } from 'react';
import { APP_ROUTES } from './routes/AppRoutes';

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onNavigate = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onNavigate);
    return () => window.removeEventListener('popstate', onNavigate);
  }, []);

  const route = APP_ROUTES.find((r) => r.path === path) || APP_ROUTES[0];
  const Element = route?.element;

  return (
    <div className="min-h-screen bg-gray-50">
      {Element ? <Element /> : <div className="p-4 text-red-600">Route not found</div>}
    </div>
  );
}
