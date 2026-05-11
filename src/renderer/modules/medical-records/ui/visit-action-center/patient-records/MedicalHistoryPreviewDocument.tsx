import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Activity,
  AlertTriangle,
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  FlaskConical,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  Pill,
  Stethoscope,
  User,
  Clock,
} from 'lucide-react';
import type { RootState } from '../../../../../app/store/rootReducer';
import { useGetFacilityIdentity } from '../../../api/facility/FacilityQueries';
import type {
  FacilitySnapshot,
  PatientMedicalHistoryPayload,
} from '../../../api/patient-medical-history/patientMedicalHistoryTypes';
import { formatDate, formatDateTime } from '../clinical-forms/allergies-form-components/allergiesForm.utils';
const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0 print:py-1.5">
    <span className="flex items-center gap-2 text-xs font-medium text-gray-500 print:text-[10px]">
      <span className="print:hidden">{icon}</span>
      {label}
    </span>
    <span className="text-right text-xs font-semibold text-gray-800 print:text-[10px]">{value}</span>
  </div>
);

function FacilityCell({ facility }: { facility: FacilitySnapshot | null | undefined }) {
  if (!facility?.name) {
    return <span className="text-slate-500">—</span>;
  }
  return (
    <div className="text-xs">
      <span className="font-semibold text-slate-800">{facility.name}</span>
      {facility.code ? (
        <span className="ml-1 text-slate-600">({facility.code})</span>
      ) : null}
      {facility.address?.formatted ? (
        <p className="mt-0.5 text-[10px] leading-snug text-slate-600">{facility.address.formatted}</p>
      ) : null}
    </div>
  );
}

function vitalSummary(v: PatientMedicalHistoryPayload['vitals'][0]): string {
  const parts: string[] = [];
  if (v.temperature != null) parts.push(`${v.temperature}${v.temperature_unit ? ` ${v.temperature_unit}` : ''}`);
  if (v.systolic_bp != null && v.diastolic_bp != null) parts.push(`BP ${v.systolic_bp}/${v.diastolic_bp}`);
  else if (v.systolic_bp != null) parts.push(`SBP ${v.systolic_bp}`);
  if (v.heart_rate != null) parts.push(`HR ${v.heart_rate}`);
  if (v.respiratory_rate != null) parts.push(`RR ${v.respiratory_rate}`);
  if (v.oxygen_saturation != null) parts.push(`SpO₂ ${v.oxygen_saturation}%`);
  if (v.weight != null) parts.push(`Wt ${v.weight}${v.height != null ? ` · Ht ${v.height}` : ''}`);
  if (v.bmi != null) parts.push(`BMI ${v.bmi}`);
  if (v.pain_score != null) parts.push(`Pain ${v.pain_score}`);
  return parts.length ? parts.join(' · ') : 'Vitals recorded';
}

const formatText = (text?: string | null): string =>
  (text ?? '')
    .replace(/[,-]/g, ' ')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

const renderClinician = (name?: string | null): string => {
  if (!name) return 'Dr. Not specified';
  return name;
};

export interface MedicalHistoryPreviewDocumentProps {
  history: PatientMedicalHistoryPayload;
}

export const MedicalHistoryPreviewDocument: React.FC<MedicalHistoryPreviewDocumentProps> = ({ history }) => {
  const activeFacilityId = useSelector((state: RootState) => state.activeContext.activeFacilityId);
  const activeFacility = useSelector((state: RootState) => {
    const staffCapability = state.activeContext.capabilities.staff;
    if (!staffCapability || !activeFacilityId) return null;
    return staffCapability.facilities.find((f) => f.facility_id === activeFacilityId);
  });

  const shouldFetch = !activeFacility || !activeFacility.facility_name;
  const { data: identityResponse, isLoading } = useGetFacilityIdentity({
    enabled: shouldFetch && !!activeFacilityId,
  });

  const viewerFacility = useMemo(() => {
    if (activeFacility?.facility_name) {
      return {
        name: activeFacility.facility_name,
        code: activeFacility.facility_code || 'N/A',
        email: activeFacility.email,
        phone: activeFacility.main_phone,
        address:
          [
            activeFacility.address_line1,
            activeFacility.address_line2,
            activeFacility.city,
            activeFacility.state_province,
          ]
            .filter(Boolean)
            .join(', ') || 'Address not available',
      };
    }
    const fromApi = identityResponse?.data?.facility;
    if (fromApi) {
      return {
        name: fromApi.name,
        code: fromApi.code || 'N/A',
        email: fromApi.email,
        phone: fromApi.phone,
        address:
          typeof fromApi.address === 'string'
            ? fromApi.address
            : fromApi.address?.formatted || 'Address not available',
      };
    }
    return {
      name: 'MEDICAL FACILITY',
      code: 'N/A',
      email: null as string | null,
      phone: null as string | null,
      address: 'Address not available',
    };
  }, [activeFacility, identityResponse]);

  const patient = history.patient;
  const patientLabel = patient.full_name?.trim() || 'Patient';
  const reportDate = history.generated_at || new Date().toISOString();

  const counts = useMemo(
    () => ({
      visits: history.visits.length,
      allergies: history.allergies.length,
      prescriptions: history.prescriptions.length,
      notes: history.clinical_notes.length,
      vitals: history.vitals.length,
      diagnoses: history.diagnoses.length,
      consultations: history.consultations.length,
      labs: history.lab_requests.length,
      labResults: history.lab_results.length,
    }),
    [history]
  );

  if (isLoading && shouldFetch && !!activeFacilityId) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0">
        <div className="mb-6 border-b-2 border-blue-600 pb-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
            <Building2 className="h-7 w-7 text-blue-600" />
          </div>
          <p className="text-center text-sm text-slate-700">Loading document…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <div className="mb-6 border-b-2 border-blue-600 pb-5 text-center print:mb-4 print:pb-4">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 print:hidden">
          <Building2 className="h-7 w-7 text-blue-600" />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-slate-900 print:text-xl">
          {viewerFacility.name.toUpperCase()}
        </h1>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 print:mt-1">
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700 print:bg-transparent print:p-0 print:text-gray-600">
            Continuity of Care
          </span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 print:bg-transparent print:p-0 print:text-gray-600">
            Aggregated Medical History
          </span>
        </div>

        <div className="mt-3 space-y-1 text-xs text-gray-600 print:mt-2">
          <p className="inline-flex items-center gap-1 print:gap-1.5">
            <MapPin className="h-3.5 w-3.5 print:hidden" />
            {viewerFacility.address}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 print:gap-3">
            {viewerFacility.phone ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 print:hidden" />
                {viewerFacility.phone}
              </span>
            ) : null}
            {viewerFacility.email ? (
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 print:hidden" />
                {viewerFacility.email}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-3 print:mt-2">
          <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 print:bg-transparent print:p-0 print:text-gray-400">
            Facility Number:{' '}
            <span className="text-gray-700 print:text-gray-900">{viewerFacility.code}</span>
          </span>
        </div>

        <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 px-4 py-3 print:mt-3 print:rounded-none print:border-y print:border-gray-200 print:bg-transparent print:py-2">
          <p className="text-lg font-black tracking-wide text-blue-700 print:text-base print:text-slate-900">
            MEDICAL HISTORY SUMMARY
          </p>
          <p className="mt-1 text-xs font-medium text-gray-700 print:text-[10px]">
            Documented records across facilities for longitudinal care coordination.
          </p>
        </div>
      </div>

      <div className="my-6 space-y-2 rounded-lg bg-gray-50 p-4 print:my-4 print:rounded-lg print:border print:border-gray-200 print:bg-transparent print:p-3">
        <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Report generated" value={formatDateTime(reportDate)} />
        <InfoRow icon={<User className="h-3.5 w-3.5" />} label="Patient" value={patientLabel} />
        <InfoRow icon={<ClipboardList className="h-3.5 w-3.5" />} label="Patient UUID" value={patient.patient_uuid} />
        <InfoRow
          icon={<Activity className="h-3.5 w-3.5" />}
          label="Record counts"
          value={
            <span className="text-right text-slate-800">
              Visits {counts.visits} · Allergies {counts.allergies} · Rx {counts.prescriptions} · Notes {counts.notes} ·
              Vitals {counts.vitals} · Dx {counts.diagnoses} · Consults {counts.consultations} · Lab Requests {counts.labs} · Lab Results {counts.labResults}
            </span>
          }
        />
      </div>

      {/* Visits */}
      <section className="mt-8 print:mt-6 print:break-inside-avoid">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
          <Calendar className="h-4 w-4 text-blue-600" />
          Encounters (all facilities)
        </h3>
        {history.visits.length === 0 ? (
          <p className="text-sm text-slate-600">No visits on file.</p>
        ) : (
          <table className="w-full border-collapse border border-slate-200 text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">When</th>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">Facility</th>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">Type / status</th>
              </tr>
            </thead>
            <tbody>
              {history.visits.map((v) => (
                <tr key={v.id} className="align-top">
                  <td className="border border-slate-200 px-2 py-2 text-xs text-slate-700">
                    {formatDateTime(v.arrived_at ?? v.occurred_at)}
                  </td>
                  <td className="border border-slate-200 px-2 py-2">
                    <FacilityCell facility={v.facility} />
                  </td>
                  <td className="border border-slate-200 px-2 py-2 text-xs text-slate-800">
                    <div className="font-medium">{v.visit_type ?? 'Visit'}</div>
                    <div className="text-slate-600">
                      {v.status ?? '—'} {v.current_phase ? `· ${v.current_phase}` : ''}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Allergies */}
      <section className="mt-8 print:mt-6 print:break-inside-avoid">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          Allergies
        </h3>
        {history.allergies.length === 0 ? (
          <p className="text-sm text-slate-600">No allergy records.</p>
        ) : (
          <table className="w-full border-collapse border border-slate-200 text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">Allergen</th>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">Severity</th>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">Facility</th>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">Recorded</th>
              </tr>
            </thead>
            <tbody>
              {history.allergies.map((a) => (
                <tr key={a.id} className="align-top">
                  <td className="border border-slate-200 px-2 py-2 text-xs font-medium text-slate-900">
                    {a.allergen}
                    {a.reaction ? <div className="mt-1 font-normal text-slate-700">{a.reaction}</div> : null}
                  </td>
                  <td className="border border-slate-200 px-2 py-2 text-xs text-slate-700">{a.severity ?? '—'}</td>
                  <td className="border border-slate-200 px-2 py-2">
                    <FacilityCell facility={a.facility} />
                  </td>
                  <td className="border border-slate-200 px-2 py-2 text-xs text-slate-700">
                    {formatDateTime(a.occurred_at ?? a.diagnosed_at ?? a.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Prescriptions */}
      <section className="mt-8 print:mt-6 print:break-inside-avoid">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
          <Pill className="h-4 w-4 text-emerald-700" />
          Medications (prescriptions)
        </h3>
        {history.prescriptions.length === 0 ? (
          <p className="text-sm text-slate-600">No prescriptions documented.</p>
        ) : (
          <div className="space-y-4">
            {history.prescriptions.map((rx) => (
              <div key={rx.id} className="rounded-xl border border-slate-200 p-3 print:break-inside-avoid">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{rx.prescription_number}</p>
                    <p className="text-xs text-slate-700">
                      {formatDate(rx.prescription_date ?? rx.occurred_at ?? rx.created_at)} · {formatText(rx.status) || '—'} ·{' '}
                      {formatText(rx.prescription_type) || '—'}
                    </p>
                    <p className="text-xs text-slate-700">
                      {renderClinician(rx.clinician?.name)} · {formatDateTime(rx.occurred_at ?? rx.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <FacilityCell facility={rx.facility} />
                  </div>
                </div>
                {rx.diagnosis ? <p className="mt-2 text-xs text-slate-700">Dx context: {rx.diagnosis}</p> : null}
                {rx.items.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-600">No line items.</p>
                ) : (
                  <table className="mt-3 w-full border-collapse border border-slate-200 text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="border border-slate-200 px-2 py-1 text-left text-slate-800 font-medium">Medication</th>
                        <th className="border border-slate-200 px-2 py-1 text-left text-slate-800 font-medium">Sig</th>
                        <th className="border border-slate-200 px-2 py-1 text-left text-slate-800 font-medium">Route</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rx.items.map((it) => (
                        <tr key={it.id}>
                          <td className="border border-slate-200 px-2 py-1 font-medium text-slate-900">
                            {it.medication_name}
                            {it.strength ? ` · ${it.strength}` : ''} {it.dosage_form ? `(${it.dosage_form})` : ''}
                           </td>
                          <td className="border border-slate-200 px-2 py-1 text-slate-700">
                            {[it.frequency, it.duration_value != null ? `${it.duration_value} ${it.duration_unit ?? ''}` : null]
                              .filter(Boolean)
                              .map((value) => formatText(String(value)))
                              .join(' · ') || '—'}
                           </td>
                          <td className="border border-slate-200 px-2 py-1 text-slate-700">{formatText(it.route) || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Clinical notes */}
      <section className="mt-8 print:mt-6 print:break-inside-avoid">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
          <FileText className="h-4 w-4 text-blue-600" />
          Clinical notes
        </h3>
        {history.clinical_notes.length === 0 ? (
          <p className="text-sm text-slate-600">No clinical notes.</p>
        ) : (
          <div className="space-y-3">
            {history.clinical_notes.map((n) => (
              <div key={n.id} className="rounded-xl border border-slate-200 p-3 print:break-inside-avoid">
                <div className="flex flex-wrap justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 capitalize">{n.note_type ?? 'Note'} · {n.note_status ?? '—'}</p>
                    <p className="text-xs text-slate-700">
                      {formatDateTime(n.occurred_at ?? n.noted_at ?? n.created_at)}
                    </p>
                    <p className="text-xs text-slate-700">{renderClinician(n.clinician?.name)}</p>
                  </div>
                  <FacilityCell facility={n.facility} />
                </div>
                {n.assessment ? <p className="mt-2 text-xs text-slate-800">{n.assessment}</p> : null}
                {n.plan ? <p className="mt-1 text-xs text-slate-700">Plan: {n.plan}</p> : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Vitals */}
      <section className="mt-8 print:mt-6 print:break-inside-avoid">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
          <HeartPulse className="h-4 w-4 text-rose-700" />
          Vital signs
        </h3>
        {history.vitals.length === 0 ? (
          <p className="text-sm text-slate-600">No vitals.</p>
        ) : (
          <table className="w-full border-collapse border border-slate-200 text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">Time</th>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">Facility</th>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">Measurements</th>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">Clinician</th>
              </tr>
            </thead>
            <tbody>
              {history.vitals.map((v) => (
                <tr key={v.id} className="align-top">
                  <td className="border border-slate-200 px-2 py-2 text-xs text-slate-700">
                    {formatDateTime(v.occurred_at ?? v.measured_at ?? v.created_at)}
                   </td>
                  <td className="border border-slate-200 px-2 py-2">
                    <FacilityCell facility={v.facility} />
                   </td>
                  <td className="border border-slate-200 px-2 py-2 text-xs text-slate-800">{vitalSummary(v)}</td>
                  <td className="border border-slate-200 px-2 py-2 text-xs text-slate-700">{renderClinician(v.clinician?.name)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Diagnoses */}
      <section className="mt-8 print:mt-6 print:break-inside-avoid">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
          <Stethoscope className="h-4 w-4 text-violet-700" />
          Diagnoses
        </h3>
        {history.diagnoses.length === 0 ? (
          <p className="text-sm text-slate-600">No diagnoses recorded.</p>
        ) : (
          <table className="w-full border-collapse border border-slate-200 text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">Diagnosis</th>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">Code</th>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">Facility</th>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">Recorded</th>
              </tr>
            </thead>
            <tbody>
              {history.diagnoses.map((d) => (
                <tr key={d.id} className="align-top">
                  <td className="border border-slate-200 px-2 py-2 text-xs font-medium text-slate-900">
                    {d.diagnosis_description ?? '—'}
                    <div className="font-normal text-slate-700">{d.clinical_status ?? ''}</div>
                    <div className="font-normal text-slate-700">{renderClinician(d.clinician?.name)}</div>
                   </td>
                  <td className="border border-slate-200 px-2 py-2 text-xs text-slate-700">{d.diagnosis_code ?? '—'}</td>
                  <td className="border border-slate-200 px-2 py-2">
                    <FacilityCell facility={d.facility} />
                   </td>
                  <td className="border border-slate-200 px-2 py-2 text-xs text-slate-700">
                    {formatDateTime(d.occurred_at ?? d.created_at)}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Consultations */}
      <section className="mt-8 print:mt-6 print:break-inside-avoid">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
          <User className="h-4 w-4 text-indigo-700" />
          Consultations
        </h3>
        {history.consultations.length === 0 ? (
          <p className="text-sm text-slate-600">No consultations.</p>
        ) : (
          <div className="space-y-3">
            {history.consultations.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 p-3 print:break-inside-avoid">
                <div className="flex flex-wrap justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{c.clinical_question ?? 'Consultation'}</p>
                    <p className="text-xs text-slate-700">
                      {formatDateTime(c.occurred_at ?? c.requested_at)} · {formatText(c.request_status) || '—'} ·{' '}
                      {formatText(c.priority) || '—'}
                    </p>
                    <p className="text-xs text-slate-700">
                      Requested by {renderClinician(c.requesting_staff?.name)} · Consultant {renderClinician(c.consultant_staff?.name)}
                    </p>
                  </div>
                  <FacilityCell facility={c.facility} />
                </div>
                {c.findings ? <p className="mt-2 text-xs text-slate-800">{c.findings}</p> : null}
                {c.recommendations ? <p className="mt-1 text-xs text-slate-700">{c.recommendations}</p> : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Labs */}
      <section className="mt-8 print:mt-6 print:break-inside-avoid">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
          <FlaskConical className="h-4 w-4 text-cyan-700" />
          Laboratory orders
        </h3>
        {history.lab_requests.length === 0 ? (
          <p className="text-sm text-slate-600">No laboratory requests.</p>
        ) : (
          <div className="space-y-4">
            {history.lab_requests.map((lab) => (
              <div key={lab.id} className="rounded-xl border border-slate-200 p-3 print:break-inside-avoid">
                <div className="flex flex-wrap justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Request {lab.request_uuid.slice(0, 8)}…</p>
                    <p className="text-xs text-slate-700">
                      {formatDateTime(lab.occurred_at ?? lab.requested_at)} · {formatText(lab.status) || '—'} ·{' '}
                      {formatText(lab.priority) || '—'}
                    </p>
                    <p className="text-xs text-slate-700">{renderClinician(lab.clinician?.name)}</p>
                  </div>
                  <FacilityCell facility={lab.facility} />
                </div>
                {lab.items.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-600">No line items.</p>
                ) : (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-800">
                    {lab.items.map((it) => (
                      <li key={it.id}>
                        {it.test_name ?? 'Test'} {it.status ? `(${it.status})` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lab results */}
      <section className="mt-8 print:mt-6 print:break-inside-avoid">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
          <FlaskConical className="h-4 w-4 text-cyan-800" />
          Laboratory results
        </h3>
        {history.lab_results.length === 0 ? (
          <p className="text-sm text-slate-600">No laboratory results.</p>
        ) : (
          <table className="w-full border-collapse border border-slate-200 text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">Test</th>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">Result</th>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">Flag</th>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">Facility</th>
                <th className="border border-slate-200 px-2 py-2 text-left text-xs font-semibold text-slate-800">Clinician / time</th>
              </tr>
            </thead>
            <tbody>
              {history.lab_results.map((res) => (
                <tr key={res.id} className="align-top">
                  <td className="border border-slate-200 px-2 py-2 text-xs font-medium text-slate-900">
                    {res.test_name ?? 'Lab Test'}
                    {res.field_name ? <div className="font-normal text-slate-700">{res.field_name}</div> : null}
                   </td>
                  <td className="border border-slate-200 px-2 py-2 text-xs text-slate-800">
                    {res.value ?? '—'} {res.unit ?? ''}
                    {res.reference_min || res.reference_max ? (
                      <div className="text-slate-600">
                        Ref: {res.reference_min ?? '—'} - {res.reference_max ?? '—'}
                      </div>
                    ) : null}
                   </td>
                  <td className="border border-slate-200 px-2 py-2 text-xs text-slate-700">{formatText(res.flag) || '—'}</td>
                  <td className="border border-slate-200 px-2 py-2">
                    <FacilityCell facility={res.facility} />
                   </td>
                  <td className="border border-slate-200 px-2 py-2 text-xs text-slate-700">
                    {renderClinician(res.clinician?.name)}
                    <div>{formatDateTime(res.occurred_at ?? res.recorded_at)}</div>
                    {res.verified_by?.name ? (
                      <div className="text-slate-600">Verified: {renderClinician(res.verified_by?.name)}</div>
                    ) : null}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="mt-10 border-t border-slate-200 pt-4 text-center text-[10px] text-slate-500 print:mt-8">
        <p className="flex items-center justify-center gap-1">
          <Clock className="h-3 w-3" />
          Generated {formatDateTime(reportDate)} · Source facilities shown per clinical row for continuity of care.
        </p>
      </div>
    </div>
  );
};