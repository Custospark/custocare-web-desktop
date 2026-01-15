/**
 * ============================================================================
 * INVENTORY MODULE (REWRITTEN)
 * ============================================================================
 */

import {
Inbox,
  SendIcon,
  Notebook,
  Trash,
  MessageCircleMore,
  Receipt,
  ReceiptIcon,
  NotebookIcon,
  InspectIcon,
  FileText,
} from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { FaFileInvoiceDollar } from 'react-icons/fa';

type BillingAction =
   | 'generate_bill'
  | 'receipts'
  | 'invoices'
  | 'inurance_claims';

interface BillingProps {
  theme: 'light' | 'dark';
}

const Billing: React.FC<BillingProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace<BillingAction>
      title="Payments & Insurance Claims."
      icon={<ReceiptIcon className="w-6 h-6" />}
      theme={theme}
      defaultAction="generate_bill"
      moduleId="bills"

      actions={[
     {
          key: 'generate_bill',
          label: 'Generate Bill.',
          icon: <ReceiptIcon className="w-4 h-4" />,
        },
        {
          key: 'receipts',
          label: 'Receipts',
          icon: <FileText className="w-4 h-4" />,
        },
        {
          key: 'invoices',
          label: 'Invoices',
          icon: <FaFileInvoiceDollar className="w-4 h-4" />,
        },
        {
          key: 'inurance_claims',
          label: 'Insurance Claims',
          icon: <InspectIcon className="w-4 h-4" />,
        },

      ]}
      renderAction={(action:BillingAction) => {
        switch (action) {
        case 'generate_bill':
        return <PlaceholderPanel title="Generate Bill." />;

        case 'receipts':
            return <PlaceholderPanel title="Receipts." />;

        case 'invoices':
            return <PlaceholderPanel title="Generate Invoices." />;

        case 'inurance_claims':
            return <PlaceholderPanel title="process Insurance Claims." />;
        default:
            return <PlaceholderPanel title="Generate Bill" />;
        }
      }}
    />
  );
};

export default Billing;

const PlaceholderPanel: React.FC<{ title: string }> = ({ title }) => (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-500">
      Temporary placeholder. Replace with real implementation.
    </p>
  </div>
);
