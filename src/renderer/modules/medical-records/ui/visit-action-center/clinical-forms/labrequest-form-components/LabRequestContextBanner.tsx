// labrequest-form-components/LabRequestContextBanner.tsx
import React from 'react';
import { Activity, Building2, FlaskConical, User, WalletCards } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabRequest } from '../../../../api/lab/LabTypes';
import type { ColorTokens } from './labRequestForm.types';

interface LabRequestContextBannerProps {
  isDark: boolean;
  colors: ColorTokens;
  facilityId: number | null;
  patientId: number | null;
  visitId: number | null;
  requestedByStaffId: number | null;
  request: LabRequest | null;
}

const ContextPill: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
  isDark: boolean;
}> = ({ icon, label, value, isDark }) => (
  <div
    className={cn(
      'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium',
      isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
    )}
  >
    {icon}
    <span>{label}:</span>
    <span className="font-semibold">{value ?? 'N/A'}</span>
  </div>
);

export const LabRequestContextBanner: React.FC<LabRequestContextBannerProps> = ({
  isDark,
  colors,
  facilityId,
  patientId,
  visitId,
  requestedByStaffId,
  request,
}) => {
  return (
    <div
      className={cn(
        'mb-6 rounded-xl border p-4',
        colors.border.primary,
        isDark ? 'bg-gray-900/70' : 'bg-white'
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <FlaskConical className={cn('h-4 w-4', isDark ? 'text-cyan-300' : 'text-cyan-700')} />
        <h3 className={cn('text-sm font-semibold', colors.text.primary)}>
          Active Request Context
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        <ContextPill
          isDark={isDark}
          icon={<Building2 className="h-3.5 w-3.5" />}
          label="Facility"
          value={facilityId}
        />
        <ContextPill
          isDark={isDark}
          icon={<User className="h-3.5 w-3.5" />}
          label="Patient"
          value={patientId}
        />
        <ContextPill
          isDark={isDark}
          icon={<WalletCards className="h-3.5 w-3.5" />}
          label="Visit"
          value={visitId}
        />
        <ContextPill
          isDark={isDark}
          icon={<Activity className="h-3.5 w-3.5" />}
          label="Requested By"
          value={requestedByStaffId}
        />

        {request?.priority && (
          <ContextPill
            isDark={isDark}
            icon={<FlaskConical className="h-3.5 w-3.5" />}
            label="Priority"
            value={request.priority_label || request.priority}
          />
        )}
      </div>

      <p className={cn('mt-3 text-xs', colors.text.secondary)}>
        Visit ID, patient ID, facility ID, and staff ID are sourced from the active visit and user context using the same extraction pattern as the prescription workflow.
      </p>
    </div>
  );
};

export default LabRequestContextBanner;
