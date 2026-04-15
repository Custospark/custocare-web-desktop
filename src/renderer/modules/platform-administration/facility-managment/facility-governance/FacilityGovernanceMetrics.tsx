import React from 'react';
import {
  Building2,
  Ban,
  ShieldAlert,
  Users,
  UserCheck,
  UserMinus,
  Wallet,
  Activity,
} from 'lucide-react';
import type {
  FacilityCounts,
  PatientCounts,
  StaffCounts,
} from  '../../statistics/api/platform-control/PlatformControlTypes';
import { GovernanceStatCard } from './facilityGovernance.primitives';
import { formatNumber } from './facilityGovernance.utils';

interface FacilityGovernanceMetricsProps {
  isDark: boolean;
  facilityCounts: FacilityCounts;
  staffCounts: StaffCounts;
  patientCounts: PatientCounts;
}

const FacilityGovernanceMetrics: React.FC<FacilityGovernanceMetricsProps> = ({
  isDark,
  facilityCounts,
  staffCounts,
  patientCounts,
}) => {
  const metrics = [
    {
      title: 'Total Facilities',
      value: formatNumber(facilityCounts.total),
      subtitle: `${formatNumber(facilityCounts.this_month)} added this month`,
      icon: Building2,
      tone: 'blue' as const,
    },
    {
      title: 'Active Facilities',
      value: formatNumber(facilityCounts.active),
      subtitle: `${formatNumber(facilityCounts.suspended)} suspended`,
      icon: Activity,
      tone: 'green' as const,
    },
    {
      title: 'Banned Facilities',
      value: formatNumber(facilityCounts.banned),
      subtitle: 'Hard-restricted platform facilities',
      icon: Ban,
      tone: 'rose' as const,
    },
    {
      title: 'Assigned Staff',
      value: formatNumber(staffCounts.assigned),
      subtitle: `${formatNumber(staffCounts.total)} total staff records`,
      icon: UserCheck,
      tone: 'violet' as const,
    },
    {
      title: 'Unassigned Staff',
      value: formatNumber(staffCounts.unassigned),
      subtitle: 'Governance reassignment opportunity',
      icon: UserMinus,
      tone: 'amber' as const,
    },
    {
      title: 'Total Patients',
      value: formatNumber(patientCounts.total),
      subtitle: `${formatNumber(patientCounts.this_month)} registered this month`,
      icon: Users,
      tone: 'blue' as const,
    },
    {
      title: 'Active Patients',
      value: formatNumber(patientCounts.active),
      subtitle: `${formatNumber(patientCounts.inactive)} inactive`,
      icon: ShieldAlert,
      tone: 'green' as const,
    },
    {
      title: 'Deceased Patients',
      value: formatNumber(patientCounts.deceased),
      subtitle: 'Registry status-controlled records',
      icon: Wallet,
      tone: 'rose' as const,
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <GovernanceStatCard
          key={metric.title}
          isDark={isDark}
          title={metric.title}
          value={metric.value}
          subtitle={metric.subtitle}
          icon={metric.icon}
          tone={metric.tone}
        />
      ))}
    </section>
  );
};

export default FacilityGovernanceMetrics;
