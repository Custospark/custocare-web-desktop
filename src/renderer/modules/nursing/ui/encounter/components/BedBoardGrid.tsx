import React from 'react';
import { BedDouble, CircleDot, Lock, Search, UserRound } from 'lucide-react';
import type { BedOption } from '../../../api/ward-bed/wardBedTypes';

export interface CurrentPatientBedSummary {
  name: string | null;
  patientNumber: string;
}

interface BedBoardGridProps {
  isDark: boolean;
  wardBedsLoading: boolean;
  filteredWardBeds: BedOption[];
  bedSearch: string;
  onBedSearchChange: (value: string) => void;
  onCreateBed: () => void;
  selectedBedId: number | null;
  selectedWardId: number | null;
  currentAssignedBedId: number | null;
  currentAssignedWardId: number | null;
  currentPatientBed: CurrentPatientBedSummary | null;
  assignmentUpdatedAt?: string | null;
  occupiedBedIds: Set<number>;
  occupiedBedMetaById: Map<number, { patient_name?: string | null; patient_uuid?: string | null; occupied_at?: string | null; visit_uuid?: string }>;
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
  selectedWardId,
  currentAssignedBedId,
  currentAssignedWardId,
  currentPatientBed,
  assignmentUpdatedAt,
  occupiedBedIds,
  occupiedBedMetaById,
  onSelectBed,
  formatOccupiedAt,
}) => {
  const formatAssignmentTime = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
  };

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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={`bed-skeleton-${idx}`}
                className={`min-h-28 rounded-lg border animate-pulse ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-200'}`}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {filteredWardBeds.map((bed) => {
              const isOccupied = occupiedBedIds.has(bed.id) || bed.status === 'occupied';
              const isBookable = !isOccupied && bed.status !== 'maintenance' && bed.status !== 'inactive';
              const isMaintenance = bed.status === 'maintenance';
              const active = selectedBedId === bed.id;
              const isSelectable = bed.status !== 'inactive';
              const occupiedMeta = occupiedBedMetaById.get(bed.id);

              const isCurrentEncounterBed =
                currentAssignedBedId != null &&
                bed.id === currentAssignedBedId &&
                currentAssignedWardId != null &&
                selectedWardId === currentAssignedWardId;

              const occupancyKind: 'free' | 'currentEncounter' | 'other' = isCurrentEncounterBed
                ? 'currentEncounter'
                : isOccupied
                  ? 'other'
                  : 'free';

              return (
                <button
                  key={bed.id}
                  type="button"
                  onClick={() => {
                    if (!isSelectable) return;
                    onSelectBed(bed, { isOccupied, isBookable, isMaintenance });
                  }}
                  className={`min-h-28 rounded-lg border p-2 text-left transition cursor-pointer flex flex-col ${
                    active
                      ? 'border-blue-500 bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50'
                      : occupancyKind === 'currentEncounter'
                        ? isDark
                          ? 'border-blue-600/90 bg-blue-950/70 text-blue-100 hover:bg-blue-900/55'
                          : 'border-blue-400 bg-blue-50 text-blue-950 hover:bg-blue-100/90'
                        : occupancyKind === 'other'
                          ? isDark
                            ? 'border-rose-900 bg-rose-950/55 text-rose-100 hover:bg-rose-950/80'
                            : 'border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100'
                          : bed.status === 'maintenance' || bed.status === 'inactive'
                            ? isDark
                              ? 'border-yellow-800 bg-yellow-900/10 text-yellow-300'
                              : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                            : isDark
                              ? 'border-gray-700 hover:bg-gray-800'
                              : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col flex-1 min-h-0">
                    <span
                      className={`text-[10px] leading-tight font-semibold uppercase tracking-wide ${
                        active
                          ? 'text-blue-50'
                          : occupancyKind === 'currentEncounter'
                            ? isDark
                              ? 'text-blue-200'
                              : 'text-blue-800'
                            : isDark
                              ? 'text-gray-400'
                              : 'text-gray-500'
                      }`}
                    >
                      {bed.room_label ? `Room ${bed.room_label} · ` : ''}
                      {bed.bed_label}
                    </span>

                    <span className="flex items-center gap-2 my-2 min-h-6">
                      {occupancyKind === 'free' ? (
                        <CircleDot className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-green-500'}`} />
                      ) : occupancyKind === 'currentEncounter' ? (
                        <UserRound className={`w-5 h-5 shrink-0 ${active ? 'text-white' : isDark ? 'text-blue-300' : 'text-blue-700'}`} />
                      ) : (
                        <Lock className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-rose-600'}`} />
                      )}
                      <span className={`text-[11px] font-medium leading-snug line-clamp-2 flex-1 min-w-0 ${active ? 'text-white' : ''}`}>
                        {occupancyKind === 'currentEncounter'
                          ? 'This encounter · your patient'
                          : occupancyKind === 'other'
                            ? occupiedMeta?.patient_name?.trim() || 'Other patient · occupied'
                            : bed.status === 'maintenance'
                              ? 'Maintenance'
                              : 'Available'}
                      </span>
                    </span>

                    {occupancyKind === 'currentEncounter' ? (
                      <div
                        className={`mt-auto text-[11px] leading-relaxed ${
                          active ? 'text-blue-50' : isDark ? 'text-blue-100/95' : 'text-blue-900'
                        }`}
                      >
                        <div className="font-semibold truncate">{currentPatientBed?.name?.trim() || 'Current patient'}</div>
                        <div className="opacity-95 truncate" title={currentPatientBed?.patientNumber || undefined}>
                          ID {currentPatientBed?.patientNumber || '—'}
                        </div>
                        {assignmentUpdatedAt ? (
                          <div className={`mt-0.5 text-[10px] ${active ? 'text-blue-100/90' : isDark ? 'text-blue-200/85' : 'text-blue-800/85'}`}>
                            Since {formatAssignmentTime(assignmentUpdatedAt)}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {occupancyKind === 'other' ? (
                      <div className={`mt-auto text-[10px] leading-relaxed ${active ? 'text-white/95' : isDark ? 'text-rose-100/95' : 'text-rose-900'}`}>
                        {occupiedMeta?.patient_uuid ? (
                          <div className="truncate font-mono" title={occupiedMeta.patient_uuid}>
                            Patient Number {occupiedMeta.patient_uuid}
                          </div>
                        ) : null}
                        <div>{formatOccupiedAt(occupiedMeta?.occupied_at)}</div>
                      </div>
                    ) : null}
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
