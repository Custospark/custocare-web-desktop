import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { Search, AlertTriangle, CalendarClock, Building2, FileText } from 'lucide-react';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { selectActiveVisitPatientId } from '../../../../../app/store/slices/visitSlice';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import { useGetVisitsByPatient } from '../../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';

interface MedicalHistoryProps {
  theme?: 'light' | 'dark';
}

type TimeRange = 'all' | 'year' | '6months' | 'month';

interface VisitRecord {
  id: number;
  facility_id: number | null;
  arrived_at: string | null;
  status?: string | null;
  current_phase?: string | null;
  visit_type?: string | null;
  facility?: {
    id: number;
    name: string;
  } | null;
}

interface HistorySectionItem {
  id: string;
  title: string;
  subtitle?: string | null;
  createdAt?: string | null;
  tone?: 'neutral' | 'warning' | 'danger';
}

const getFromPayloadArray = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const value = payload as { data?: unknown; requests?: unknown };
  if (Array.isArray(value.data)) return value.data;

  if (value.data && typeof value.data === 'object') {
    const nested = value.data as { data?: unknown; requests?: unknown };
    if (Array.isArray(nested.data)) return nested.data;
    if (Array.isArray(nested.requests)) return nested.requests;
  }

  if (Array.isArray(value.requests)) return value.requests;
  return [];
};

const toTimestamp = (value?: string | null): number => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const isWithinRange = (dateValue: string | null | undefined, range: TimeRange): boolean => {
  if (range === 'all') return true;
  const ts = toTimestamp(dateValue ?? null);
  if (!ts) return false;
  const now = Date.now();
  const days = range === 'year' ? 365 : range === '6months' ? 183 : 31;
  return ts >= now - days * 24 * 60 * 60 * 1000;
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return 'Date not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date not available';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const MedicalHistory: React.FC<MedicalHistoryProps> = ({ theme = 'light' }) => {
  const patientId = useSelector(selectActiveVisitPatientId);
  const patientNumericId = patientId ? Number(patientId) : 0;
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);

  const visitsQuery = useGetVisitsByPatient(patientNumericId, {}, { enabled: !!patientNumericId });

  const allergiesQuery = useQuery({
    queryKey: ['medical-history', 'allergies', patientNumericId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/patients/${patientNumericId}/allergies`);
      return response.data;
    },
    enabled: !!patientNumericId,
  });

  const clinicalNotesQuery = useQuery({
    queryKey: ['medical-history', 'clinical-notes', patientNumericId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/clinical-notes/patient/${patientNumericId}`);
      return response.data;
    },
    enabled: !!patientNumericId,
  });

  const vitalsQuery = useQuery({
    queryKey: ['medical-history', 'vitals', patientNumericId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/vitals/patient/${patientNumericId}`);
      return response.data;
    },
    enabled: !!patientNumericId,
  });

  const diagnosesQuery = useQuery({
    queryKey: ['medical-history', 'diagnoses', patientNumericId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/diagnoses/patient/${patientNumericId}`);
      return response.data;
    },
    enabled: !!patientNumericId,
  });

  const consultationsQuery = useQuery({
    queryKey: ['medical-history', 'consultations', patientNumericId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/consultations/patient/${patientNumericId}`);
      return response.data;
    },
    enabled: !!patientNumericId,
  });

  const prescriptionsQuery = useQuery({
    queryKey: ['medical-history', 'prescriptions', patientNumericId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/prescriptions/patient/${patientNumericId}`);
      return response.data;
    },
    enabled: !!patientNumericId,
  });

  const labRequestsQuery = useQuery({
    queryKey: ['medical-history', 'lab-requests', patientNumericId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/lab/requests/patient/${patientNumericId}`);
      return response.data;
    },
    enabled: !!patientNumericId,
  });

  const isLoading =
    visitsQuery.isLoading ||
    allergiesQuery.isLoading ||
    clinicalNotesQuery.isLoading ||
    vitalsQuery.isLoading ||
    diagnosesQuery.isLoading ||
    consultationsQuery.isLoading ||
    prescriptionsQuery.isLoading ||
    labRequestsQuery.isLoading;

  const allVisits = useMemo<VisitRecord[]>(() => {
    const payload = visitsQuery.data;
    if (!payload || typeof payload !== 'object') return [];
    const raw = getFromPayloadArray(payload);
    return raw
      .map((item) => item as Partial<VisitRecord>)
      .filter((item): item is VisitRecord => typeof item.id === 'number')
      .sort((a, b) => toTimestamp(b.arrived_at) - toTimestamp(a.arrived_at));
  }, [visitsQuery.data]);

  const filteredVisits = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allVisits.filter((visit) => {
      const inRange = isWithinRange(visit.arrived_at, timeRange);
      if (!inRange) return false;
      if (!query) return true;
      const searchable = [
        visit.facility?.name ?? '',
        visit.status ?? '',
        visit.current_phase ?? '',
        visit.visit_type ?? '',
        String(visit.id),
      ]
        .join(' ')
        .toLowerCase();
      return searchable.includes(query);
    });
  }, [allVisits, searchQuery, timeRange]);

  const effectiveSelectedVisitId = useMemo(() => {
    if (!filteredVisits.length) return null;
    const exists = filteredVisits.some((visit) => visit.id === selectedVisitId);
    return exists ? selectedVisitId : filteredVisits[0].id;
  }, [filteredVisits, selectedVisitId]);

  const selectedVisit = useMemo(
    () => filteredVisits.find((visit) => visit.id === effectiveSelectedVisitId) ?? null,
    [effectiveSelectedVisitId, filteredVisits]
  );

  const allergies = useMemo(() => getFromPayloadArray(allergiesQuery.data), [allergiesQuery.data]);
  const clinicalNotes = useMemo(
    () => getFromPayloadArray(clinicalNotesQuery.data),
    [clinicalNotesQuery.data]
  );
  const vitals = useMemo(() => getFromPayloadArray(vitalsQuery.data), [vitalsQuery.data]);
  const diagnoses = useMemo(() => getFromPayloadArray(diagnosesQuery.data), [diagnosesQuery.data]);
  const consultations = useMemo(
    () => getFromPayloadArray(consultationsQuery.data),
    [consultationsQuery.data]
  );
  const prescriptions = useMemo(
    () => getFromPayloadArray(prescriptionsQuery.data),
    [prescriptionsQuery.data]
  );
  const labRequests = useMemo(() => getFromPayloadArray(labRequestsQuery.data), [labRequestsQuery.data]);

  const visitFilter = useCallback(
    (record: unknown): boolean => {
      if (!selectedVisit) return false;
      if (!record || typeof record !== 'object') return false;
      const candidate = record as { visit_id?: number; facility_id?: number };
      if (candidate.visit_id !== selectedVisit.id) return false;
      if (!selectedVisit.facility_id || !candidate.facility_id) return true;
      return candidate.facility_id === selectedVisit.facility_id;
    },
    [selectedVisit]
  );

  const visitAllergies = useMemo(() => allergies.filter(visitFilter), [allergies, visitFilter]);
  const visitClinicalNotes = useMemo(() => clinicalNotes.filter(visitFilter), [clinicalNotes, visitFilter]);
  const visitVitals = useMemo(() => vitals.filter(visitFilter), [vitals, visitFilter]);
  const visitDiagnoses = useMemo(() => diagnoses.filter(visitFilter), [diagnoses, visitFilter]);
  const visitConsultations = useMemo(
    () => consultations.filter(visitFilter),
    [consultations, visitFilter]
  );
  const visitPrescriptions = useMemo(
    () => prescriptions.filter(visitFilter),
    [prescriptions, visitFilter]
  );
  const visitLabRequests = useMemo(() => labRequests.filter(visitFilter), [labRequests, visitFilter]);

  const summaryCards = useMemo(
    () => [
      { label: 'Clinical Notes', count: visitClinicalNotes.length },
      { label: 'Vitals', count: visitVitals.length },
      { label: 'Diagnoses', count: visitDiagnoses.length },
      { label: 'Consultations', count: visitConsultations.length },
      { label: 'Prescriptions', count: visitPrescriptions.length },
      { label: 'Lab Requests', count: visitLabRequests.length },
      { label: 'Allergies noted in visit', count: visitAllergies.length },
    ],
    [
      visitAllergies.length,
      visitClinicalNotes.length,
      visitConsultations.length,
      visitDiagnoses.length,
      visitLabRequests.length,
      visitPrescriptions.length,
      visitVitals.length,
    ]
  );

  const sectionData = useMemo<
    Array<{ title: string; icon: React.ReactNode; items: HistorySectionItem[] }>
  >(
    () => [
      {
        title: 'Clinical Notes',
        icon: <FileText className="h-4 w-4 text-blue-500" />,
        items: visitClinicalNotes.map((item, idx) => {
          const note = item as {
            id?: number;
            uuid?: string;
            note_type?: string;
            note_status?: string;
            assessment?: string | null;
            created_at?: string | null;
          };
          return {
            id: String(note.id ?? note.uuid ?? idx),
            title: `${note.note_type ?? 'Clinical'} note`,
            subtitle: note.assessment || note.note_status || 'No additional narrative',
            createdAt: note.created_at ?? null,
          };
        }),
      },
      {
        title: 'Diagnoses',
        icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        items: visitDiagnoses.map((item, idx) => {
          const dx = item as {
            id?: number;
            diagnosis_description?: string;
            diagnosis_code?: string;
            clinical_status?: string;
            created_at?: string | null;
          };
          return {
            id: String(dx.id ?? idx),
            title: dx.diagnosis_description || 'Diagnosis recorded',
            subtitle: [dx.diagnosis_code, dx.clinical_status].filter(Boolean).join(' • '),
            createdAt: dx.created_at ?? null,
            tone: 'warning',
          };
        }),
      },
      {
        title: 'Lab Requests',
        icon: <CalendarClock className="h-4 w-4 text-purple-500" />,
        items: visitLabRequests.map((item, idx) => {
          const req = item as {
            id?: number;
            request_uuid?: string;
            status?: string;
            priority?: string;
            created_at?: string | null;
          };
          return {
            id: String(req.id ?? req.request_uuid ?? idx),
            title: `Lab request (${req.status ?? 'submitted'})`,
            subtitle: req.priority ? `Priority: ${req.priority}` : 'Laboratory order',
            createdAt: req.created_at ?? null,
          };
        }),
      },
    ],
    [visitClinicalNotes, visitDiagnoses, visitLabRequests]
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Medical History</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Complete patient clinical history across all visits
        </p>
      </div>

      <div className="mb-6 flex gap-2 border-b pb-4">
        <button
          type="button"
          onClick={() => setTimeRange('all')}
          className={`rounded-lg px-3 py-1 text-sm transition-colors ${
            timeRange === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          All Time
        </button>
        <button
          type="button"
          onClick={() => setTimeRange('year')}
          className={`rounded-lg px-3 py-1 text-sm transition-colors ${
            timeRange === 'year'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          Last Year
        </button>
        <button
          type="button"
          onClick={() => setTimeRange('6months')}
          className={`rounded-lg px-3 py-1 text-sm transition-colors ${
            timeRange === '6months'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          6 Months
        </button>
        <button
          type="button"
          onClick={() => setTimeRange('month')}
          className={`rounded-lg px-3 py-1 text-sm transition-colors ${
            timeRange === 'month'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          Last Month
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search medical history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="list" theme={theme} message="Loading medical history..." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
            <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Visits Across Facilities
            </h3>
            <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1">
              {filteredVisits.length === 0 ? (
                <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  No visits match your filters.
                </p>
              ) : (
                filteredVisits.map((visit) => {
                  const selected = visit.id === effectiveSelectedVisitId;
                  return (
                    <button
                      key={visit.id}
                      type="button"
                      onClick={() => setSelectedVisitId(visit.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        selected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/60'
                      }`}
                    >
                      <p className="text-sm font-semibold">Visit #{visit.id}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formatDateTime(visit.arrived_at)}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {visit.facility?.name ?? `Facility ${visit.facility_id ?? 'Unknown'}`}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-4">
            {!selectedVisit ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Select a visit to review what happened in that facility.
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="text-base font-semibold">
                    Visit #{selectedVisit.id} -{' '}
                    {selectedVisit.facility?.name ?? `Facility ${selectedVisit.facility_id ?? 'Unknown'}`}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {formatDateTime(selectedVisit.arrived_at)} • Status: {selectedVisit.status ?? 'N/A'} •
                    Phase: {selectedVisit.current_phase ?? 'N/A'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {summaryCards.map((card) => (
                    <div key={card.label} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                      <p className="mt-1 text-xl font-semibold">{card.count}</p>
                    </div>
                  ))}
                </div>

                {sectionData.map((section) => (
                  <div key={section.title} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <div className="mb-3 flex items-center gap-2">
                      {section.icon}
                      <h4 className="font-semibold">{section.title}</h4>
                    </div>
                    {section.items.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No {section.title.toLowerCase()} captured for this visit/facility.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {section.items.map((entry) => (
                          <div key={entry.id} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                            <p className="font-medium">{entry.title}</p>
                            {entry.subtitle && (
                              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{entry.subtitle}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-400">{formatDateTime(entry.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold">Longitudinal Allergy History (All Visits)</h3>
              </div>
              {allergies.length === 0 ? (
                <p className="text-sm text-gray-500">No allergies recorded</p>
              ) : (
                <div className="space-y-2">
                  {allergies.map((item, index) => {
                    const allergy = item as {
                      id?: number;
                      allergen?: string;
                      severity?: string;
                      reaction?: string | null;
                      created_at?: string | null;
                      facility_name?: string | null;
                    };
                    return (
                      <div key={allergy.id ?? index} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{allergy.allergen ?? 'Allergy record'}</span>
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            {allergy.severity ?? 'unknown severity'}
                          </span>
                        </div>
                        {allergy.reaction && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{allergy.reaction}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">
                          {formatDateTime(allergy.created_at)} • {allergy.facility_name ?? 'Facility not specified'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalHistory;