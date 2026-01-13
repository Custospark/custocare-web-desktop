/**
 * ============================================================================ 
 * BILLING WORKSPACE USING BASE ACTION WORKSPACE
 * ============================================================================ 
 */

import React from 'react';
import {
  CreditCard,
  FileText,
  Search,
  Receipt,
  AlertOctagon,
} from 'lucide-react';
import { BaseActionWorkspace, ActionConfig } from  '../../../../shared/components/workspace/BaseActionWorkspace';
import CreateInvoice from './CreateInvoice';

type BillingView =
  | 'billing_queue'
  | 'create_invoice'
  | 'search_invoices'
  | 'payment_history'
  | 'billing_issues';

interface BillingProps {
  theme: 'light' | 'dark';
}

const Billing: React.FC<BillingProps> = ({ theme }) => {
  const actions: ActionConfig<BillingView>[] = [
    { key: 'billing_queue', label: 'Billing Queue', icon: <Receipt className="w-4 h-4" /> },
    { key: 'create_invoice', label: 'New Invoice', icon: <FileText className="w-4 h-4" /> },
    { key: 'search_invoices', label: 'Search Invoices', icon: <Search className="w-4 h-4" /> },
    { key: 'payment_history', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'billing_issues', label: 'Issues', icon: <AlertOctagon className="w-4 h-4" /> },
  ];

  const renderAction = (action: BillingView) => {
    switch (action) {
      case 'create_invoice':
        return <CreateInvoice theme={theme}></CreateInvoice>;
      case 'search_invoices':
        return <PlaceholderPanel title="Search & Filter Invoices" />;
      case 'payment_history':
        return <PlaceholderPanel title="Payment History" />;
      case 'billing_issues':
        return <PlaceholderPanel title="Billing Exceptions & Issues" />;
      case 'billing_queue':
      default:
        return <PlaceholderPanel title="Billing Processing Queue" />;
    }
  };

  return (
    <BaseActionWorkspace<BillingView>
      title="Billing"
      icon={<CreditCard className="w-6 h-6" />}
      theme={theme}
      actions={actions}
      moduleId="billing"
      defaultAction="billing_queue"
      renderAction={renderAction}
    />
  );
};

export default Billing;

/**
 * ============================================================================ 
 * PLACEHOLDER PANEL (TEMPORARY)
 * ============================================================================ 
 */
const PlaceholderPanel: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-500">
        This is a temporary placeholder.
        <br />
        Replace with the actual component when ready.
      </p>
    </div>
  );
};
