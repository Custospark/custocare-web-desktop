/**
 * ============================================================================
 * BILLING WORKSPACE COMPONENT
 * ============================================================================
 *
 * Internal, state-driven billing and payments workspace for pharmacy operations.
 * No routing. No navigation. Conditional rendering only.
 *
 * This is a logic prototype — panels are placeholders.
 */

import React, { useState } from 'react';
import {
  CreditCard,
  FileText ,
  Search,
  Receipt,
  AlertOctagon,
} from 'lucide-react';

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
  const isDark = theme === 'dark';

  const [activeView, setActiveView] =
    useState<BillingView>('billing_queue');

  const actionButtons: {
    key: BillingView;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'billing_queue',
      label: 'Billing Queue',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      key: 'create_invoice',
      label: 'New Invoice',
      icon: <FileText  className="w-4 h-4" />,
    },
    {
      key: 'search_invoices',
      label: 'Search Invoices',
      icon: <Search className="w-4 h-4" />,
    },
    {
      key: 'payment_history',
      label: 'Payments',
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      key: 'billing_issues',
      label: 'Issues',
      icon: <AlertOctagon className="w-4 h-4" />,
    },
  ];

  const renderActivePanel = () => {
    switch (activeView) {
      case 'create_invoice':
        return <PlaceholderPanel title="Create New Invoice" />;

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
    <div className="space-y-4">
      {/* Header */}
      <div
        className={`rounded-xl p-6 border ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CreditCard className="w-6 h-6" />
          Billing
        </h2>

        {/* Action Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          {actionButtons.map((action) => {
            const isActive = activeView === action.key;

            return (
              <button
                key={action.key}
                onClick={() => setActiveView(action.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isDark
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {action.icon}
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Panel */}
      <div
        className={`rounded-xl p-6 border min-h-[300px] ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        {renderActivePanel()}
      </div>
    </div>
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
