import TemplateListPage from './pages/TemplateListPage';
import TemplateFormPage from './pages/TemplateFormPage';

export const QUOTATION_TEMPLATES_ROUTES = [
  {
    path: '/quotation-templates',
    element: TemplateListPage,
  },
  {
    path: '/quotation-templates/create',
    element: TemplateFormPage,
  },
  {
    path: '/quotation-templates/edit/:id',
    element: TemplateFormPage,
  },
];
