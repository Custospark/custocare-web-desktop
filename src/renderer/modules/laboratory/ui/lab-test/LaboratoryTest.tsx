/**
 * ============================================================================
 * INVENTORY MODULE (REWRITTEN)
 * ============================================================================
 */

import {
  Forward,
  Microscope,
  FlaskConical,
  FileText,
} from 'lucide-react';

import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
type LaboratoryTestAction =
   | 'start_test'
  | 'record_test_results'
  | 'forward_patient';

interface LaboratoryTestProps {
  theme: 'light' | 'dark';
}

const LaboratoryTest: React.FC<LaboratoryTestProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace<LaboratoryTestAction>
      title="Laboratory Test"
      icon={<Microscope className="w-6 h-6" />}
      theme={theme}
      defaultAction="start_test"
      moduleId="lab_test"

      actions={[
      {
            key: 'start_test',
            label: 'Start Test',
            icon: <FlaskConical className="w-4 h-4" />,
          },
          {
            key: 'record_test_results',
            label: 'Record Test Results.',
            icon: <FileText className="w-4 h-4" />,
          },
          {
            key: 'forward_patient',
            label: 'Forward Patient.',
            icon: <Forward className="w-4 h-4" />,
          },
      ]}
      renderAction={(action) => {
        switch (action) {
        case 'start_test':
        return <PlaceholderPanel title="Start Medical Laboratory test" />;

        case 'record_test_results':
            return <PlaceholderPanel title="Record test results." />;

        case 'forward_patient':
            return <PlaceholderPanel title="Forward Patient." />;
        default:
        return <PlaceholderPanel title="Start Medical Laboratory test." />;
        }
      }}
    />
  );
};

export default LaboratoryTest;

const PlaceholderPanel: React.FC<{ title: string }> = ({ title }) => (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-500">
      Temporary placeholder. Replace with real implementation.
    </p>
  </div>
);
