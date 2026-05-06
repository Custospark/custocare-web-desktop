import React from 'react';
import { BedDouble, CircleDot, Lock, Search } from 'lucide-react';
import type { BedOption } from '../../../api/ward-bed/wardBedTypes';

interface BedBoardGridProps {
  isDark: boolean;
  wardBedsLoading: boolean;
  filteredWardBeds: BedOption[];
  bedSearch: string;
  onBedSearchChange: (value: string) => void;
  onCreateBed: () => void;
  selectedBedId: number | null;
  currentAssignedBedId: number | null;
  occupiedBedIds: Set<number>;
  occupiedBedMetaById: Map<number, { patient_name?: string | null; patient_uuid?: string | null; occupied_at?: string | null }>;
  onSelectBed: (bed: BedOption, flags: { isOccupied: boolean; isBookable: boolean; isMaintenance: boolean }) => void;
  formatOccupiedAt: (iso?: string | null) => string;
}

const BedBoardGrid: React.FC<BedBoardGridProps> = ({
  isDark,
  wardBedsLoading,
  filteredWardBeds,
  bedSearch,
  onBedSearchChange,
  onCreateBed,
  selectedBedId,
  currentAssignedBedId,
  occupiedBedIds,
  occupiedBedMetaById,
  onSelectBed,
  formatOccupiedAt,
}) => {
  return (
    <>
      <div className="mb-2">
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-white'}`}>
          <Search className="w-4 h-4 opacity-70" />
          <input
            value={bedSearch}
            onChange={(e) => onBedSearchChange(e.target.value)}
            placeholder="Search bed label..."
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>
      </div>
      <div className={`rounded-xl border p-3 max-h-[55vh] overflow-auto ${isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'}`}>
        {wardBedsLoading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 14 }).map((_, idx) => (
              <div
                key={`bed-skeleton-${idx}`}
                className={`aspect-square rounded-lg border animate-pulse ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-200'}`}
              />
            ))}
          </div>
        ) : filteredWardBeds.length === 0 ? (
          <div className={`rounded-lg border border-dashed p-6 text-center ${isDark ? 'border-gray-700 bg-gray-900/40' : 'border-gray-300 bg-white'}`}>
            <BedDouble className={`w-7 h-7 mx-auto mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <div className="text-sm font-medium">No rooms or beds found in this ward</div>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Create a room/bed first, then assign a patient from this board.
            </p>
            <button
              onClick={onCreateBed}
              className="mt-3 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 cursor-pointer text-xs"
            >
              Create Bed
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {filteredWardBeds.map((bed) => {
              const isOccupied = occupiedBedIds.has(bed.id) || bed.status === 'occupied';
              const isBookable = !isOccupied && bed.status !== 'maintenance' && bed.status !== 'inactive';
              const isMaintenance = bed.status === 'maintenance';
              const active = selectedBedId === bed.id;
              const isSelectable = bed.status !== 'inactive';
              const occupiedMeta = occupiedBedMetaById.get(bed.id);
              return (
                <button
                  key={bed.id}
                  onClick={() => {
                    if (!isSelectable) return;
                    onSelectBed(bed, { isOccupied, isBookable, isMaintenance });
                  }}
                  className={`aspect-square rounded-lg border p-2 transition cursor-pointer ${
                    active
                      ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                      : isOccupied
                        ? isDark
                          ? 'border-red-800 bg-red-900/20 text-red-300 hover:bg-red-900/30'
                          : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                        : bed.status === 'maintenance' || bed.status === 'inactive'
                          ? isDark
                            ? 'border-yellow-800 bg-yellow-900/10 text-yellow-300'
                            : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                          : isDark
                            ? 'border-gray-700 hover:bg-gray-800'
                            : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="h-full flex flex-col">
                    <span className={`text-[10px] leading-none uppercase tracking-wide truncate ${active ? 'text-blue-100' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {bed.room_label ? `R:${bed.room_label} • ` : ''}{bed.bed_label}
                    </span>
                    <span className="flex-1 flex items-center justify-center">
                      {isOccupied ? (
                        <Lock className={`w-4 h-4 ${active ? 'text-white' : 'text-red-500'}`} />
                      ) : (
                        <CircleDot className={`w-4 h-4 ${active ? 'text-white' : 'text-green-500'}`} />
                      )}
                    </span>
                    {isOccupied && (
                      <span className={`mt-1 text-[9px] leading-tight ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                        {(occupiedMeta?.patient_name ?? 'Occupied')}{occupiedMeta?.patient_uuid ? ` (${occupiedMeta.patient_uuid})` : ''}
                        <br />
                        {formatOccupiedAt(occupiedMeta?.occupied_at)}
                      </span>
                    )}
                    {!isOccupied && currentAssignedBedId === bed.id && (
                      <span className={`mt-1 text-[9px] ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Current patient bed</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default BedBoardGrid;
