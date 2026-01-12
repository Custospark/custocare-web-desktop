/**
 * ============================================================================
 * INVENTORY MANAGEMENT COMPONENT
 * ============================================================================
 *
 * Internal state–driven inventory workspace for pharmacy operations.
 * No routing. No navigation. Pure conditional rendering.
 *
 * This is a logic prototype — panels are placeholders and can be replaced later.
 */

import React, { useState } from 'react';
import {
  PackagePlus,
  Search,
  RefreshCcw,
  Archive,
  Boxes,
} from 'lucide-react';

type InventoryView =
  | 'add_stock'
  | 'search_item'
  | 'adjust_stock'
  | 'stock_overview'
  | 'expired_items';

interface InventoryProps {
  theme: 'light' | 'dark';
}

const Inventory: React.FC<InventoryProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  const [activeView, setActiveView] = useState<InventoryView>('stock_overview');

  const actionButtons: {
    key: InventoryView;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { key: 'stock_overview', label: 'Stock Overview', icon: <Boxes className="w-4 h-4" /> },
    { key: 'add_stock', label: 'Add Stock', icon: <PackagePlus className="w-4 h-4" /> },
    { key: 'search_item', label: 'Search Item', icon: <Search className="w-4 h-4" /> },
    { key: 'adjust_stock', label: 'Adjust Stock', icon: <RefreshCcw className="w-4 h-4" /> },
    { key: 'expired_items', label: 'Expired Items', icon: <Archive className="w-4 h-4" /> },
  ];

  const renderActivePanel = () => {
    switch (activeView) {
      case 'add_stock':
        return <PlaceholderPanel title="Add Stock Form" />;
      case 'search_item':
        return <PlaceholderPanel title="Search Inventory Items" />;
      case 'adjust_stock':
        return <PlaceholderPanel title="Adjust Existing Stock" />;
      case 'expired_items':
        return <PlaceholderPanel title="Expired / Near-Expiry Items" />;
      case 'stock_overview':
      default:
        return <PlaceholderPanel title="Inventory Stock Overview" />;
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
          <Boxes className="w-6 h-6" />
          Pharmacy Inventory
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

export default Inventory;

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
