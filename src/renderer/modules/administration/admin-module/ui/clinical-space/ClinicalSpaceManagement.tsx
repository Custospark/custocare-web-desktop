/**
 * ============================================================================
 * CLINICAL SPACE MANAGEMENT (ROUTER-DRIVEN)
 * ============================================================================
 */

import React from 'react';
import { MapPin, LayoutGrid, Hospital, Shuffle } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../../shared/components/workspace/BaseActionWorkspace';
import { ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES } from '../../../../../app/routes/constants/administration.paths';
interface ClinicalSpaceManagementProps {
  theme: 'light' | 'dark';
}

const ClinicalSpaceManagement: React.FC<ClinicalSpaceManagementProps> = ({ theme }) => {
  return (
    <BaseActionWorkspace
      title="Clinical Space Management"
      icon={<MapPin className="w-6 h-6" />}
      theme={theme}
      defaultActionTo={ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.CLINICAL_ROOMS}
      actions={[
        {
          key: 'rooms',
          label: 'Clinical Rooms',
          icon: <LayoutGrid className="w-4 h-4" />,
          to: ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.CLINICAL_ROOMS,
        },
        {
          key: 'wards',
          label: 'Ward Management',
          icon: <Hospital className="w-4 h-4" />,
          to: ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.WARD_MANAGEMENT,
        },
        {
          key: 'zones',
          label: 'Facility Zones',
          icon: <MapPin className="w-4 h-4" />,
          to: ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.FACILITY_ZONES,
        },
        {
          key: 'allocation',
          label: 'Space Allocation',
          icon: <Shuffle className="w-4 h-4" />,
          to: ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.SPACE_ALLOCATION,
        },
      ]}
    />
  );
};

export default ClinicalSpaceManagement;
