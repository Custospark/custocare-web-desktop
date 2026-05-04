// Inventory.tsx
/**
 * ============================================================================
 * INVENTORY MODULE (ROUTER-DRIVEN)
 * ============================================================================
 */

import React from 'react';
import { Boxes } from 'lucide-react';
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
      defaultActionTo={PHARMACY_ROUTES.INVENTORY}
      actions={[
        {
          key: 'catalog',
          label: 'Facility inventory',
          icon: <Boxes className="w-4 h-4" />,
          to: PHARMACY_ROUTES.INVENTORY,
        },
      ]}
    />
  );
};

export default Inventory;
