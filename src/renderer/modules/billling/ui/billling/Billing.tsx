import React from 'react';
import { Receipt, FileText, CreditCard, Shield } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { BILLING_ROUTES } from '../../../../app/routes/routeConstants';

interface BillingProps {
  theme: 'light' | 'dark';
}

const Billing: React.FC<BillingProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Billing & Insurance"
      icon={<Receipt className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={BILLING_ROUTES.INVOICES_SEARCH}
      actions={[
        { 
          key: 'search_invoices', 
          label: 'Search Invoices', 
          icon: <FileText className="w-4 h-4" />, 
          to: BILLING_ROUTES.INVOICES_SEARCH 
        },
        { 
          key: 'create_invoice', 
          label: 'Create Invoice', 
          icon: <FileText className="w-4 h-4" />, 
          to: BILLING_ROUTES.INVOICES_CREATE 
        },
        { 
          key: 'draft_invoices', 
          label: 'Draft Invoices', 
          icon: <FileText className="w-4 h-4" />, 
          to: BILLING_ROUTES.INVOICES_DRAFT 
        },
        { 
          key: 'pending_invoices', 
          label: 'Pending Invoices', 
          icon: <FileText className="w-4 h-4" />, 
          to: BILLING_ROUTES.INVOICES_PENDING 
        },
        { 
          key: 'receive_payment', 
          label: 'Receive Payment', 
          icon: <CreditCard className="w-4 h-4" />, 
          to: BILLING_ROUTES.PAYMENTS_RECEIVE 
        },
        { 
          key: 'payment_history', 
          label: 'Payment History', 
          icon: <CreditCard className="w-4 h-4" />, 
          to: BILLING_ROUTES.PAYMENTS_HISTORY 
        },
        { 
          key: 'reconcile_payments', 
          label: 'Reconcile Payments', 
          icon: <CreditCard className="w-4 h-4" />, 
          to: BILLING_ROUTES.PAYMENTS_RECONCILE 
        },
        { 
          key: 'submit_claim', 
          label: 'Submit Claim', 
          icon: <Shield className="w-4 h-4" />, 
          to: BILLING_ROUTES.CLAIMS_SUBMIT 
        },
        { 
          key: 'track_claims', 
          label: 'Track Claims', 
          icon: <Shield className="w-4 h-4" />, 
          to: BILLING_ROUTES.CLAIMS_TRACK 
        },
        { 
          key: 'approved_claims', 
          label: 'Approved Claims', 
          icon: <Shield className="w-4 h-4" />, 
          to: BILLING_ROUTES.CLAIMS_APPROVED 
        },
        { 
          key: 'denied_claims', 
          label: 'Denied Claims', 
          icon: <Shield className="w-4 h-4" />, 
          to: BILLING_ROUTES.CLAIMS_DENIED 
        },
      ]}
    />
  );
};

export default Billing;