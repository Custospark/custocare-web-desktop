import React from 'react';
import { CircleDot, Lock, MoveRight, Search, X } from 'lucide-react';
import type { BedOption } from '../../../api/ward-bed/wardBedTypes';

interface BedPickerModalProps {
  open: boolean;
  isDark: boolean;
  wardName?: string | null;
  bedSearch: string;
  onSearchChange: (value: string) => void;
  beds: BedOption[];
  occupiedBedIds: Set<number>;
  selectedBedId: number | null;
  onSelectBed: (bedId: number) => void;
  onClose: () => void;
  onAssign: () => void;
  canSubmit: boolean;
  isAssigning: boolean;
}

const BedPickerModal: React.FC<BedPickerModalProps> = ({
  open,
  isDark,
  wardName,
  bedSearch,
  onSearchChange,
  beds,
  occupiedBedIds,
  selectedBedId,
  onSelectBed,
  onClose,
  onAssign,
  canSubmit,
  isAssigning,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        onClick={onClose}
        className="absolute inset-0 bg-black/50 cursor-pointer"
        aria-label="Close bed picker"
      />
      <div
        className={`absolute left-1/2 top-1/2 w-[92vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-4 ${
          isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Ward bed picker"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-lg font-semibold">{wardName ?? 'Selected Ward'} Bed Board</h4>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Click a free bed tile to select for this visit.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close bed picker panel" className="p-2 rounded-lg border cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-3">
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${isDark ? 'border-gray-700 bg-gray-950' : 'border-gray-300 bg-gray-50'}`}>
            <Search className="w-4 h-4 opacity-70" />
            <input
              value={bedSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search bed label..."
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 max-h-[55vh] overflow-auto">
          {beds.map((bed) => {
            const isOccupied = occupiedBedIds.has(bed.id) || bed.status === 'occupied';
            const isBookable = !isOccupied && bed.status !== 'maintenance' && bed.status !== 'inactive';
            const active = selectedBedId === bed.id && isBookable;
            const dateLikeLabel = (bed.bed_label.match(/\d+/)?.[0] ?? bed.bed_label).slice(0, 3);

            return (
              <button
                key={bed.id}
                onClick={() => {
                  if (!isBookable) return;
                  onSelectBed(bed.id);
                }}
                className={`aspect-square rounded-lg border p-2 transition cursor-pointer ${
                  active
                    ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                    : isOccupied
                      ? isDark
                        ? 'border-red-800 bg-red-900/20 text-red-300 cursor-not-allowed'
                        : 'border-red-200 bg-red-50 text-red-700 cursor-not-allowed'
                      : bed.status === 'maintenance' || bed.status === 'inactive'
                        ? isDark
                          ? 'border-yellow-800 bg-yellow-900/10 text-yellow-300 cursor-not-allowed'
                          : 'border-yellow-200 bg-yellow-50 text-yellow-700 cursor-not-allowed'
                        : isDark
                          ? 'border-gray-700 hover:bg-gray-800 cursor-pointer'
                          : 'border-gray-300 hover:bg-gray-50 cursor-pointer'
                }`}
              >
                    <div className="h-full flex flex-col">
                      <span className={`text-[10px] leading-none uppercase tracking-wide truncate ${active ? 'text-blue-100' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {bed.bed_label}
                      </span>
                      <span className="flex-1 flex items-center justify-center">
                        <span className={`text-sm font-semibold ${active ? 'text-white' : isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                          {dateLikeLabel}
                        </span>
                      </span>
                      <span className="self-end">
                    {isOccupied ? (
                      <Lock className={`w-4 h-4 ${active ? 'text-white' : 'text-red-500'}`} />
                    ) : (
                      <CircleDot className={`w-4 h-4 ${active ? 'text-white' : 'text-green-500'}`} />
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-lg border cursor-pointer">
            Close
          </button>
          <button
            onClick={onAssign}
            disabled={!canSubmit || isAssigning}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <MoveRight className="w-4 h-4" />
            {isAssigning ? 'Saving...' : 'Assign Selected Bed'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BedPickerModal;

