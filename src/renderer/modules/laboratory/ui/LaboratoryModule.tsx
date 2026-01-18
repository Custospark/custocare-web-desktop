import React from 'react';
import { Microscope } from 'lucide-react';
import { BaseActionWorkspace } from '../../../shared/components/workspace/BaseActionWorkspace';
import { LABORATORY_ROUTES } from '../../../app/routes/routeConstants';

interface TestsProps {
  theme: 'light' | 'dark';
}

const Tests: React.FC<TestsProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Laboratory Tests"
      icon={<Microscope className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={LABORATORY_ROUTES.TESTS_ORDER}
      actions={[
        { 
          key: 'order', 
          label: 'Order Tests', 
          icon: <Microscope className="w-4 h-4" />, 
          to: LABORATORY_ROUTES.TESTS_ORDER 
        },
        { 
          key: 'record', 
          label: 'Record Results', 
          icon: <Microscope className="w-4 h-4" />, 
          to: LABORATORY_ROUTES.TESTS_RECORD 
        },
        { 
          key: 'pending', 
          label: 'Pending Tests', 
          icon: <Microscope className="w-4 h-4" />, 
          to: LABORATORY_ROUTES.TESTS_PENDING 
        },
        { 
          key: 'search', 
          label: 'Search Results', 
          icon: <Microscope className="w-4 h-4" />, 
          to: LABORATORY_ROUTES.TESTS_SEARCH 
        },
      ]}
    />
  );
};

export default Tests;