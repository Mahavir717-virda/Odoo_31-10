import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader';
import Button from '../../../components/ui/Button';

export default function TemplateFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div>
      <PageHeader
        title={id ? `Edit Quotation Template #${id}` : 'Create Quotation Template'}
        breadcrumbs={[
          { label: 'Quotation Templates', href: '/quotation-templates' },
          { label: id ? 'Edit' : 'Create' },
        ]}
      />
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-xl mx-auto text-center">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Quotation Template Editor</h3>
        <p className="text-sm text-gray-500 mb-4">
          Quotation templates can be configured and managed directly from the Quotation Templates list.
        </p>
        <Button variant="primary" onClick={() => navigate('/quotation-templates')}>
          View Quotation Templates
        </Button>
      </div>
    </div>
  );
}

