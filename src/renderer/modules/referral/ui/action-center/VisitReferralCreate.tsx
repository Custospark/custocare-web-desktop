import { type FormEvent, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Save } from 'lucide-react';
import { useCreateReferral } from '../../api/referrals/useReferralQueries';
import { REFERRAL_ROUTES } from '../../../../app/routes/routeConstants';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import type { RootState } from '../../../../app/store/rootReducer';
import { getActiveFacilityId, getStaffId } from '../../../../app/store/utils/contextSelectors';
import {
  selectActivePatient,
  selectActiveVisitPatientId,
} from '../../../../app/store/slices/visitSlice';
import FacilityStaffPicker from '../../../ambulance/ui/fleet/FacilityStaffPicker';
import type { ForwardingStaff } from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';

interface VisitReferralCreateProps {
  theme: 'light' | 'dark';
}

const VisitReferralCreate = ({ theme }: VisitReferralCreateProps) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const createMut = useCreateReferral();
  const facilityId = useSelector((s: RootState) => getActiveFacilityId(s));
  const staffId = useSelector((s: RootState) => getStaffId(s));
  const patient = useSelector((s: RootState) => selectActivePatient(s));
  const patientId = useSelector((s: RootState) => selectActiveVisitPatientId(s));

  const [form, setForm] = useState({
    referral_type: 'internal' as 'internal' | 'external',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    receiving_facility_id: '',
    referral_reason: '',
    clinical_notes: '',
    external_referral_id: '',
    expiry_date: '',
  });
  const [receivingStaffId, setReceivingStaffId] = useState<number | null>(null);
  const [receivingStaffLabel, setReceivingStaffLabel] = useState('');

  const set = useCallback(
    (f: string) => (e: FormEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((p) => ({ ...p, [f]: (e.target as HTMLInputElement).value }));
    },
    [],
  );

  const inputCls = `w-full rounded-lg border px-3 py-2 text-sm outline-none ${
    isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 text-gray-900'
  }`;
  const labelCls = `mb-1 block text-xs font-semibold uppercase tracking-wider ${
    isDark ? 'text-gray-400' : 'text-gray-500'
  }`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientId || !facilityId) {
      showToast('error', 'Patient and facility context required');
      return;
    }
    try {
      await createMut.mutateAsync({
        patient_id: patientId,
        facility_id: facilityId,
        referring_staff_id: staffId ?? undefined,
        receiving_staff_id: receivingStaffId ?? undefined,
        receiving_facility_id: form.receiving_facility_id
          ? parseInt(form.receiving_facility_id, 10)
          : null,
        referral_type: form.referral_type,
        referral_reason: form.referral_reason || null,
        clinical_notes: form.clinical_notes || null,
        external_referral_id: form.external_referral_id || null,
        priority: form.priority,
        expiry_date: form.expiry_date || null,
      });
      showToast('success', 'Referral created');
      navigate(REFERRAL_ROUTES.ACTION_CENTER_REFERRAL_STATUS);
    } catch {
      showToast('error', 'Failed to create referral');
    }
  };

  return (
    <div className={`mx-auto max-w-2xl p-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      <h2 className="mb-2 text-xl font-bold">Create referral</h2>
      <p className={`mb-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {patient?.name ? `For ${patient.name}` : 'Link a referral to the active visit patient.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Type</label>
            <select className={inputCls} value={form.referral_type} onChange={set('referral_type')}>
              <option value="internal">Internal</option>
              <option value="external">External</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select className={inputCls} value={form.priority} onChange={set('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Receiving facility ID (optional)</label>
          <input
            type="number"
            className={inputCls}
            placeholder="Destination facility ID for cross-facility"
            value={form.receiving_facility_id}
            onChange={set('receiving_facility_id')}
          />
        </div>

        <div>
          <label className={labelCls}>Receiving staff (optional)</label>
          {receivingStaffLabel && (
            <p className={`mb-2 text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              Selected: {receivingStaffLabel}
            </p>
          )}
          <FacilityStaffPicker
            theme={theme}
            selectedStaffId={receivingStaffId}
            onSelect={(id, staff: ForwardingStaff) => {
              setReceivingStaffId(id);
              setReceivingStaffLabel(staff.full_name);
            }}
          />
        </div>

        <div>
          <label className={labelCls}>Reason</label>
          <input className={inputCls} value={form.referral_reason} onChange={set('referral_reason')} />
        </div>

        <div>
          <label className={labelCls}>Clinical notes</label>
          <textarea
            className={`${inputCls} min-h-24`}
            value={form.clinical_notes}
            onChange={set('clinical_notes')}
          />
        </div>

        <div>
          <label className={labelCls}>External referral ID</label>
          <input className={inputCls} value={form.external_referral_id} onChange={set('external_referral_id')} />
        </div>

        <div>
          <label className={labelCls}>Expiry date</label>
          <input type="date" className={inputCls} value={form.expiry_date} onChange={set('expiry_date')} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(REFERRAL_ROUTES.ACTION_CENTER_REFERRAL_STATUS)}
            className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium ${
              isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMut.isPending}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {createMut.isPending ? 'Submitting…' : 'Submit referral'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VisitReferralCreate;
