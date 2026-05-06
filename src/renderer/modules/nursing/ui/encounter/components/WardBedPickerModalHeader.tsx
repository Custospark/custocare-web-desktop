import React from 'react';
import { CircleDot, Lock, Pencil, UserRound, X } from 'lucide-react';

interface Props {
  wardName: string;
  isDark: boolean;
  onEditWard: () => void;
  onCloseModal: () => void;
  editDisabled?: boolean;
}

/**
 * Top bar for the ward bed board modal: title, Edit ward (opens admin-style drawer), legend, close.
 */
const WardBedPickerModalHeader: React.FC<Props> = ({
  wardName,
  isDark,
  onEditWard,
  onCloseModal,
  editDisabled,
}) => {
  const btnOutline = isDark
    ? 'border-gray-600 bg-gray-900/80 text-gray-100 hover:bg-gray-800'
    : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-2">
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <label className="text-sm font-medium truncate">{wardName} Bed Board</label>
        <button
          type="button"
          onClick={onEditWard}
          disabled={editDisabled}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${btnOutline}`}
        >
          <Pencil className="w-3.5 h-3.5 shrink-0" aria-hidden />
          Edit ward
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
        <div className="text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <CircleDot className="w-3.5 h-3.5 text-green-500 shrink-0" aria-hidden /> Free
          </span>
          <span className="inline-flex items-center gap-1">
            <UserRound className="w-3.5 h-3.5 text-blue-500 shrink-0" aria-hidden /> This patient
          </span>
          <span className="inline-flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" aria-hidden /> Other patient
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseModal}
          className={`p-1.5 rounded-md border shrink-0 cursor-pointer ${isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}
          aria-label="Close bed board"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default WardBedPickerModalHeader;
