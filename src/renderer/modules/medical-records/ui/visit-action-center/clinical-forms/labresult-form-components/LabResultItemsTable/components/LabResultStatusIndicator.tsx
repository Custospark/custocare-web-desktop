import React from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  TestTubeDiagonal,
} from 'lucide-react';
import { cn } from '../../../../../../../../shared/utils/classNameUtils';
import { formatLabel, getItemStatusClasses } from '../../labResultForm.utils';
import { LabRequestItemStatus } from '../../../../../../api/lab/LabTypes';


interface LabResultStatusIndicatorProps {
  item: {
    status: LabRequestItemStatus;
  };
  isDark: boolean;
}

export const LabResultStatusIndicator: React.FC<LabResultStatusIndicatorProps> = ({ item, isDark }) => {
  const getStatusIcon = () => {
    switch (item.status) {
      case LabRequestItemStatus.VERIFIED:
        return <ShieldCheck className="h-3.5 w-3.5" />;
      case LabRequestItemStatus.COMPLETED:
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case LabRequestItemStatus.IN_PROGRESS:
        return <Activity className="h-3.5 w-3.5" />;
      case LabRequestItemStatus.SAMPLE_COLLECTED:
        return <TestTubeDiagonal className="h-3.5 w-3.5" />;
      case LabRequestItemStatus.CANCELLED:
        return <AlertCircle className="h-3.5 w-3.5" />;
      default:
        return <Clock3 className="h-3.5 w-3.5" />;
    }
  };

  const badgeBase = 'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={cn(badgeBase, getItemStatusClasses(item.status, isDark))}>
      {getStatusIcon()}
      {formatLabel(item.status)}
    </span>
  );
};