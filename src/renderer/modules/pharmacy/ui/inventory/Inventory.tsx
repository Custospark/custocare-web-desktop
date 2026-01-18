// Inventory.tsx
/**
 * ============================================================================
 * INVENTORY MODULE (ROUTER-DRIVEN)
 * ============================================================================
 */

import React from 'react';
import { PackagePlus, Search, RefreshCcw, Archive, Boxes } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { PHARMACY_ROUTES } from '../../../../app/routes/routeConstants'; // adjust import path

interface InventoryProps {
  theme: 'light' | 'dark';
}

const Inventory: React.FC<InventoryProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Pharmacy Inventory"
      icon={<Boxes className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={PHARMACY_ROUTES.INVENTORY_OVERVIEW}
      actions={[
        { key: 'overview', label: 'Stock Overview', icon: <Boxes className="w-4 h-4" />, to: PHARMACY_ROUTES.INVENTORY_OVERVIEW },
        { key: 'add_stock', label: 'Add Stock', icon: <PackagePlus className="w-4 h-4" />, to: PHARMACY_ROUTES.INVENTORY_ADD_STOCK },
        { key: 'search_item', label: 'Search Item', icon: <Search className="w-4 h-4" />, to: PHARMACY_ROUTES.INVENTORY_SEARCH_ITEM },
        { key: 'adjust_stock', label: 'Adjust Stock', icon: <RefreshCcw className="w-4 h-4" />, to: PHARMACY_ROUTES.INVENTORY_ADJUST_STOCK },
        { key: 'expired_items', label: 'Expired Items', icon: <Archive className="w-4 h-4" />, to: PHARMACY_ROUTES.INVENTORY_EXPIRED_ITEMS },
      ]}
    />
  );
};

export default Inventory;
