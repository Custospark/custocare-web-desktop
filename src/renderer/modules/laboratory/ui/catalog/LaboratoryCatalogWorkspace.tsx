import React from 'react';
import { ClipboardList, Package, ScanSearch } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { LABORATORY_ROUTES } from '../../../../app/routes/routeConstants';

interface LaboratoryCatalogWorkspaceProps {
  theme: 'light' | 'dark';
}

const LaboratoryCatalogWorkspace: React.FC<LaboratoryCatalogWorkspaceProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Laboratory Catalog"
      icon={<ClipboardList className="h-6 w-6" />}
      theme={theme}
      defaultActionTo={LABORATORY_ROUTES.CATALOG_SERVICES}
      actions={[
        {
          key: 'services',
          label: 'Lab Service Catalog',
          icon: <ScanSearch className="h-4 w-4" />,
          to: LABORATORY_ROUTES.CATALOG_SERVICES,
          description: 'Manage billable diagnostic services and test pricing',
        },
        {
          key: 'inventory',
          label: 'Lab Inventory Catalog',
          icon: <Package className="h-4 w-4" />,
          to: LABORATORY_ROUTES.CATALOG_INVENTORY,
          description: 'Manage consumables and stock items used in laboratory workflows',
        },
      ]}
    />
  );
};

export default LaboratoryCatalogWorkspace;
