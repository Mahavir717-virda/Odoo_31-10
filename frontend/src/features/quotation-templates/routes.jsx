import TemplateFormPage from './pages/TemplateFormPage';
import TemplateListPage from './pages/TemplateListPage';

export const QUOTATION_TEMPLATES_ROUTES = [
  { path: '/templates', element: TemplateListPage, roles: ['ADMIN', 'STAFF'] },
  { path: '/templates/new', element: TemplateFormPage, roles: ['ADMIN'] },
  { path: '/templates/:id', element: TemplateFormPage, roles: ['ADMIN', 'STAFF'] },
];

export default QUOTATION_TEMPLATES_ROUTES;
