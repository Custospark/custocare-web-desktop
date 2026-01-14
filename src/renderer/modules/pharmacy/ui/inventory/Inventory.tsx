/**
 * ============================================================================
 * INVENTORY MODULE (REWRITTEN)
 * ============================================================================
 */

import {
  PackagePlus,
  Search,
  RefreshCcw,
  Archive,
  Boxes,
} from 'lucide-react';

import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import AddStock from './AddStock';
import SearchStock from './views/SearchStock';

type InventoryAction =
  | 'overview'
  | 'add_stock'
  | 'search_item'
  | 'adjust_stock'
  | 'expired_items';

interface InventoryProps {
  theme: 'light' | 'dark';
}

const Inventory: React.FC<InventoryProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace<InventoryAction>
      title="Pharmacy Inventory"
      icon={<Boxes className="w-6 h-6" />}
      theme={theme}
      defaultAction="overview"
      moduleId="inventory"

      actions={[
        { key: 'overview', label: 'Stock Overview', icon: <Boxes className="w-4 h-4" /> },
        { key: 'add_stock', label: 'Add Stock', icon: <PackagePlus className="w-4 h-4" /> },
        { key: 'search_item', label: 'Search Item', icon: <Search className="w-4 h-4" /> },
        { key: 'adjust_stock', label: 'Adjust Stock', icon: <RefreshCcw className="w-4 h-4" /> },
        { key: 'expired_items', label: 'Expired Items', icon: <Archive className="w-4 h-4" /> },
      ]}
      renderAction={(action) => {
        switch (action) {
          case 'add_stock':
            return <AddStock theme={theme} />
          case 'search_item':
            return <SearchStock theme={theme} />;
          case 'adjust_stock':
            return <PlaceholderPanel title="Adjust Existing Stock" />;
          case 'expired_items':
            return <PlaceholderPanel title="Expired / Near-Expiry Items" />;
          case 'overview':
          default:
            return <PlaceholderPanel title="Inventory Stock Overview" />;
        }
      }}
    />
  );
};

export default Inventory;

const PlaceholderPanel: React.FC<{ title: string }> = ({ title }) => (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-gray-500">
      Temporary placeholder. Replace with real implementation.
    </p>
  </div>
);
