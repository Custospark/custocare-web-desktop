import React from 'react';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

type BedAction = 'assign' | 'transfer' | 'mark_available' | 'mark_maintenance';

interface BedActionPanelProps {
  theme: 'light' | 'dark';
  isDark: boolean;
  isBusy: boolean;
  isRefreshing: boolean;
  /** Optional line explaining why actions are limited */
  actionHint?: string;
  availableBedActions: BedAction[];
  selectedBedAction: BedAction;
  /** Selected bed is active encounter's assigned occupied bed (shows "Release bed") */
  canReleaseCurrentPatientBed?: boolean;
  /** Selected bed is occupied by another visit we can resolve — release clears that visit's assignment */
  releaseOccupantHint?: boolean;
  selectedBedIsMaintenance?: boolean;
  onSelectAction: (action: BedAction) => void;
  onContinue: () => void;
  continueDisabled: boolean;
}

const BedActionPanel: React.FC<BedActionPanelProps> = ({
  theme,
  isDark,
  isBusy,
  isRefreshing,
  actionHint,
  availableBedActions,
  selectedBedAction,
  canReleaseCurrentPatientBed = false,
  releaseOccupantHint = false,
  selectedBedIsMaintenance = false,
  onSelectAction,
  onContinue,
  continueDisabled,
}) => {
  const actionLabel = (action: BedAction) => {
    if (action === 'assign') return 'Assign patient';
    if (action === 'transfer') return 'Transfer patient';
    if (action === 'mark_available') {
      if (canReleaseCurrentPatientBed) return 'Release bed';
      if (releaseOccupantHint) return 'Release occupant';
      if (selectedBedIsMaintenance) return 'Remove maintenance';
      return 'Set available';
    }
    return 'Mark maintenance';
  };

  return (
    <div className={`mt-3 rounded-lg border p-3 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
      <div className="text-xs font-medium mb-2">Actions for selected bed</div>
      <p className={`text-[10px] mb-2 leading-snug ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Free bed: Assign. Your assigned occupied bed: Transfer or Release bed. Another patient&apos;s occupied bed:
        Release occupant frees that patient&apos;s assignment on this bed (not the encounter open in your slice).
      </p>
      {actionHint ? (
        <p className={`text-xs mb-2 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{actionHint}</p>
      ) : null}
      {(isBusy || isRefreshing) && (
        <LoadingSkeleton
          variant="minimal"
          theme={theme}
          message={isBusy ? 'Processing action...' : 'Refreshing bed board...'}
          className="mb-2"
        />
      )}
      {availableBedActions.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-2">
          {availableBedActions.map((action) => (
            <button
              key={action}
              onClick={() => onSelectAction(action)}
              className={`px-2.5 py-1 rounded-full text-xs border cursor-pointer ${
                selectedBedAction === action
                  ? action === 'assign'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : action === 'transfer'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : action === 'mark_available'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-amber-600 text-white border-amber-600'
                  : isDark
                    ? 'border-gray-700 hover:bg-gray-800'
                    : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {actionLabel(action)}
            </button>
          ))}
        </div>
      ) : (
        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          No actions for this bed. Select a free bed to assign or transfer, or select your assigned bed (highlighted as
          current patient bed when applicable) for Release / Transfer.
        </p>
      )}
      <div className="flex justify-end">
        <button
          onClick={onContinue}
          disabled={continueDisabled}
          className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default BedActionPanel;
