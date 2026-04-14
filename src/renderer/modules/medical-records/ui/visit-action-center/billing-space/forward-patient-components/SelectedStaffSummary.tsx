import React from 'react';

import type {
  ForwardingStaff,
  StaffPresenceStatus,
} from '../../../../../pharmacy/api/dispensing/visit-queue/visitTypes';

import type { ForwardPatientColors } from './constants';

export interface SelectedStaffSummaryProps {
  selectedStaff: ForwardingStaff;
  colors: ForwardPatientColors;
  getStatusInfo: (status: StaffPresenceStatus) => {
    bg: string;
    text: string;
    label: string;
    icon: React.ReactNode;
  };
}

export const SelectedStaffSummary: React.FC<SelectedStaffSummaryProps> = ({
  selectedStaff,
  colors,
  getStatusInfo,
}) => {
  const statusInfo = getStatusInfo(selectedStaff.presence_status);

  return (
    <div
      className={`p-4 rounded-lg border ${colors.border.primary} ${colors.bg.secondary}`}
    >
      <h4 className={`text-sm font-medium mb-3 ${colors.text.secondary}`}>
        Forwarding to:
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className={`text-xs ${colors.text.tertiary}`}>Staff Member</p>
          <p className={`font-medium ${colors.text.primary}`}>
            {selectedStaff.full_name}
          </p>
        </div>

        <div>
          <p className={`text-xs ${colors.text.tertiary}`}>Status</p>
          <div className="flex items-center gap-2">
            {statusInfo.icon}
            <span className={`font-medium ${colors.text.primary}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        <div>
          <p className={`text-xs ${colors.text.tertiary}`}>Location</p>
          <p className={`font-medium ${colors.text.primary}`}>
            {selectedStaff.current_space?.name || 'No room assigned'}
          </p>
        </div>

        <div>
          <p className={`text-xs ${colors.text.tertiary}`}>Workload</p>
          <p className={`font-medium ${colors.text.primary}`}>
            {selectedStaff.current_patient_count}/
            {selectedStaff.max_concurrent_patients} patients
          </p>
        </div>
      </div>
    </div>
  );
};
