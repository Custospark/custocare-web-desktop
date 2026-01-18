import React from 'react';
import { Microscope, FlaskConical, FileText, Search, ListChecks, Upload, Download } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { LABORATORY_ROUTES } from '../../../../app/routes/routeConstants';

interface LaboratoryTestProps {
  theme: 'light' | 'dark';
}

const LaboratoryTest: React.FC<LaboratoryTestProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Laboratory Tests"
      icon={<Microscope className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={LABORATORY_ROUTES.TESTS_ORDER}
      actions={[
        { 
          key: 'order_test', 
          label: 'Order Test', 
          icon: <FlaskConical className="w-4 h-4" />, 
          to: LABORATORY_ROUTES.TESTS_ORDER 
        },
        { 
          key: 'record_results', 
          label: 'Record Results', 
          icon: <FileText className="w-4 h-4" />, 
          to: LABORATORY_ROUTES.TESTS_RECORD 
        },
        { 
          key: 'pending_tests', 
          label: 'Pending Tests', 
          icon: <ListChecks className="w-4 h-4" />, 
          to: LABORATORY_ROUTES.TESTS_PENDING 
        },
        { 
          key: 'search_results', 
          label: 'Search Results', 
          icon: <Search className="w-4 h-4" />, 
          to: LABORATORY_ROUTES.TESTS_SEARCH 
        },
        { 
          key: 'upload_results', 
          label: 'Upload Results', 
          icon: <Upload className="w-4 h-4" />, 
          to: LABORATORY_ROUTES.TESTS_UPLOAD 
        },
        { 
          key: 'export_results', 
          label: 'Export Results', 
          icon: <Download className="w-4 h-4" />, 
          to: LABORATORY_ROUTES.TESTS_EXPORT 
        },
      ]}
    />
  );
};

export default LaboratoryTest;