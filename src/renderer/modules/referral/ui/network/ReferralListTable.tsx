import { useState } from 'react';
import { Check, X, Flag } from 'lucide-react';
import type { Referral } from '../../api/referrals/referralTypes';
import {
  useAcceptReferral,
  useRejectReferral,
  useCompleteReferral,
  useCancelReferral,
} from '../../api/referrals/useReferralQueries';
import { ReferralPriorityBadge, ReferralStatusBadge } from '../components/ReferralStatusBadge';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import FacilityStaffPicker from '../../../ambulance/ui/fleet/FacilityStaffPicker';
import type { ForwardingStaff } from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';

interface ReferralListTableProps {
  theme: 'light' | 'dark';
  referrals: Referral[];
  showAccept?: boolean;
}

const patientName = (r: Referral) => {
  const p = r.patient;
  if (!p) return `Patient #${r.patient_id}`;
  return [p.first_name, p.last_name].filter(Boolean).join(' ') || `Patient #${r.patient_id}`;
};

const ReferralListTable = ({ theme, referrals, showAccept = false }: ReferralListTableProps) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const acceptMut = useAcceptReferral();
  const rejectMut = useRejectReferral();
  const completeMut = useCompleteReferral();
  const cancelMut = useCancelReferral();

  const [acceptingUuid, setAcceptingUuid] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);

  const handleAccept = async (uuid: string) => {
    if (selectedStaffId == null) {
      showToast('error', 'Select receiving staff before accepting');
      return;
    }
    try {
      await acceptMut.mutateAsync({ uuid, receiving_staff_id: selectedStaffId });
      showToast('success', 'Referral accepted');
      setAcceptingUuid(null);
      setSelectedStaffId(null);
    } catch {
      showToast('error', 'Failed to accept referral');
    }
  };

  const handleReject = async (uuid: string) => {
    const reason = window.prompt('Rejection reason (optional)') ?? undefined;
    try {
      await rejectMut.mutateAsync({ uuid, reason });
      showToast('success', 'Referral rejected');
    } catch {
      showToast('error', 'Failed to reject referral');
    }
  };

  if (referrals.length === 0) {
    return (
      <div className={`rounded-xl border p-12 text-center ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No referrals in this view.</p>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
      <table className="w-full">
        <thead>
          <tr className={`border-b text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'border-gray-800 bg-gray-800/50 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
            <th className="px-4 py-3">Patient</th>
            <th className="px-4 py-3">Route</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((r) => (
            <tr key={r.referral_uuid} className={isDark ? 'border-gray-800 border-t' : 'border-gray-100 border-t'}>
              <td className="px-4 py-3 text-sm font-medium">{patientName(r)}</td>
              <td className="max-w-xs truncate px-4 py-3 text-sm">
                {r.referring_facility?.facility_name ?? '—'}
                {' → '}
                {r.receiving_facility?.facility_name ?? 'Same facility'}
              </td>
              <td className="px-4 py-3 text-sm capitalize">{r.referral_type}</td>
              <td className="px-4 py-3">
                <ReferralPriorityBadge priority={r.priority} isDark={isDark} />
              </td>
              <td className="px-4 py-3">
                <ReferralStatusBadge status={r.status} isDark={isDark} />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex flex-wrap justify-end gap-1">
                  {showAccept && r.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setAcceptingUuid(r.referral_uuid);
                          setSelectedStaffId(null);
                        }}
                        className="cursor-pointer rounded-lg p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        title="Accept"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(r.referral_uuid)}
                        className="cursor-pointer rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Reject"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {r.status === 'accepted' && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await completeMut.mutateAsync(r.referral_uuid);
                          showToast('success', 'Referral completed');
                        } catch {
                          showToast('error', 'Failed to complete');
                        }
                      }}
                      className="cursor-pointer rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      title="Complete"
                    >
                      <Flag className="h-4 w-4" />
                    </button>
                  )}
                  {(r.status === 'pending' || r.status === 'accepted') && (
                    <button
                      type="button"
                      onClick={async () => {
                        const reason = window.prompt('Cancellation reason (optional)') ?? undefined;
                        try {
                          await cancelMut.mutateAsync({ uuid: r.referral_uuid, reason });
                          showToast('success', 'Referral cancelled');
                        } catch {
                          showToast('error', 'Failed to cancel');
                        }
                      }}
                      className={`cursor-pointer rounded-lg p-1.5 ${isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {acceptingUuid && (
        <div className={`border-t p-4 ${isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'}`}>
          <p className={`mb-3 text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            Assign receiving staff to accept this referral
          </p>
          <FacilityStaffPicker
            theme={theme}
            selectedStaffId={selectedStaffId}
            onSelect={(staffId, _staff: ForwardingStaff) => setSelectedStaffId(staffId)}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAcceptingUuid(null)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={acceptMut.isPending}
              onClick={() => handleAccept(acceptingUuid)}
              className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Confirm accept
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralListTable;
