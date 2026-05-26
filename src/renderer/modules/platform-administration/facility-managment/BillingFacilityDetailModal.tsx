import React from 'react';
import { Building2, Mail, MapPin, Phone, User2, X } from 'lucide-react';
import { cn } from '../../../shared/types/cn';
import type { BillingFacilitySummary } from '../../administration/admin-module/api/subscriptions/SubscriptionTypes';

interface BillingFacilityDetailModalProps {
  facility: BillingFacilitySummary | null;
  isDark: boolean;
  onClose: () => void;
}

const Row: React.FC<{ label: string; value: React.ReactNode; isDark: boolean }> = ({
  label,
  value,
  isDark,
}) => (
  <div>
    <p className={cn('text-[11px] font-semibold uppercase tracking-wide', isDark ? 'text-gray-500' : 'text-gray-500')}>
      {label}
    </p>
    <p className={cn('mt-1 text-sm', isDark ? 'text-gray-200' : 'text-gray-800')}>{value || '—'}</p>
  </div>
);

export const BillingFacilityDetailModal: React.FC<BillingFacilityDetailModalProps> = ({
  facility,
  isDark,
  onClose,
}) => {
  if (!facility) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={cn(
          'relative w-full max-w-md rounded-2xl border-2 p-6 shadow-2xl',
          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200',
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="billing-facility-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'absolute top-4 right-4 p-1.5 rounded-lg',
            isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500',
          )}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3 mb-5 pr-8">
          <div className={cn('p-2.5 rounded-xl', isDark ? 'bg-blue-500/20' : 'bg-blue-100')}>
            <Building2 className={cn('w-6 h-6', isDark ? 'text-blue-400' : 'text-blue-600')} />
          </div>
          <div className="min-w-0">
            <h3
              id="billing-facility-modal-title"
              className={cn('text-lg font-bold truncate', isDark ? 'text-white' : 'text-gray-900')}
            >
              {facility.facility_name || 'Facility'}
            </h3>
            {facility.facility_code && (
              <p className={cn('text-xs font-mono', isDark ? 'text-gray-500' : 'text-gray-500')}>
                {facility.facility_code}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Row
            label="Location"
            value={
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0 opacity-70" />
                {facility.location_label || '—'}
              </span>
            }
            isDark={isDark}
          />
          <Row
            label="Facility phone"
            value={
              facility.phone ? (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  {facility.phone}
                </span>
              ) : '—'
            }
            isDark={isDark}
          />
          <Row
            label="Facility email"
            value={
              facility.email ? (
                <span className="inline-flex items-center gap-1.5 break-all">
                  <Mail className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  {facility.email}
                </span>
              ) : '—'
            }
            isDark={isDark}
          />

          <div className={cn('rounded-xl border p-4 space-y-3', isDark ? 'border-gray-800 bg-gray-800/40' : 'border-gray-200 bg-gray-50')}>
            <p className={cn('text-xs font-bold uppercase tracking-wide flex items-center gap-1.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
              <User2 className="w-3.5 h-3.5" />
              Facility owner
            </p>
            <Row label="Name" value={facility.owner?.name} isDark={isDark} />
            <Row label="Phone" value={facility.owner?.phone} isDark={isDark} />
            <Row label="Email" value={facility.owner?.email} isDark={isDark} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingFacilityDetailModal;
