import React from 'react';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';

type BedAction = 'assign' | 'transfer' | 'mark_available' | 'mark_maintenance';

interface BedActionPanelProps {
  theme: 'light' | 'dark';
  isDark: boolean;
  isBusy: boolean;
  isRefreshing: boolean;
  availableBedActions: BedAction[];
  selectedBedAction: BedAction;
  selectedBedIsOccupied: boolean;
  onSelectAction: (action: BedAction) => void;
  onContinue: () => void;
  continueDisabled: boolean;
}

const BedActionPanel: React.FC<BedActionPanelProps> = ({
  theme,
  isDark,
  isBusy,
  isRefreshing,
  availableBedActions,
  selectedBedAction,
  selectedBedIsOccupied,
  onSelectAction,
  onContinue,
  continueDisabled,
}) => {
  return (
    <div className={`mt-3 rounded-lg border p-3 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
      <div className="text-xs font-medium mb-2">Action on selected bed</div>
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
              {action === 'assign'
                ? 'Assign'
                : action === 'transfer'
                  ? 'Transfer'
                  : action === 'mark_available'
                    ? selectedBedIsOccupied
                      ? 'Release Bed'
                      : 'Set Available'
                    : 'Mark Maintenance'}
            </button>
          ))}
        </div>
      ) : (
        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          No valid actions for this bed in its current state.
        </p>
      )}
      <button
        onClick={onContinue}
        disabled={continueDisabled}
        className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs"
      >
        Continue with Action
      </button>
    </div>
  );
};

export default BedActionPanel;
