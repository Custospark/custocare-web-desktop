/**
 * ============================================================================
 * INVENTORY MODULE (REWRITTEN)
 * ============================================================================
 */

import {
  Forward,
  Stethoscope,
  ListStart,
} from 'lucide-react';

import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
type DiagnosisAction =
   | 'start_diagnosis'
  | 'assess_patient'
  | 'forward_patient';

interface DiagnosisProps {
  theme: 'light' | 'dark';
}

const Diagnosis: React.FC<DiagnosisProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace<DiagnosisAction>
      title="Doctor's Medical Diagnosis of Patient."
      icon={<Stethoscope className="w-6 h-6" />}
      theme={theme}
      defaultAction="start_diagnosis"
      moduleId="diagnosis"

      actions={[
      {
            key: 'start_diagnosis',
            label: 'Start Diagnosis',
            icon: <ListStart className="w-4 h-4" />,
          },
          {
            key: 'assess_patient',
            label: 'Assess Patient Conditions.',
            icon: <Stethoscope className="w-4 h-4" />,
          },
          {
            key: 'forward_patient',
            label: 'Forward Patient.',
            icon: <Forward className="w-4 h-4" />,
          },
      ]}
      renderAction={(action) => {
        switch (action) {
        case 'start_diagnosis':
        return <PlaceholderPanel title="Start Medical Diagnosis" />;

        case 'assess_patient':
            return <PlaceholderPanel title="Assess Patient Conditions." />;

        case 'forward_patient':
            return <PlaceholderPanel title="Forward Patient." />;
        default:
        return <PlaceholderPanel title="Start Medical Diagnosis." />;
        }
      }}
    />
  );
};

export default Diagnosis;

const PlaceholderPanel: React.FC<{ title: string }> = ({ title }) => (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-500">
      Temporary placeholder. Replace with real implementation.
    </p>
  </div>
);
