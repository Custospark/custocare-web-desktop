import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, MapPin, Phone, Shield, User2, Users, X } from 'lucide-react';
import type { Facility } from '../../statistics/api/platform-control/PlatformControlTypes';
import {
  cn,
  formatAddress,
  formatAmount,
  formatDate,
  formatDateTime,
  formatStatusLabel,
  getFacilityStatusStyles,
  getInitials,
  getOperationalStatusStyles,
  safeText,
} from './facilityGovernance.utils';

interface FacilityGovernanceFacilityDrawerProps {
  isDark: boolean;
  facility: Facility | null;
  open: boolean;
  onClose: () => void;
  onOpenStatus: (facility: Facility) => void;
}

const SectionBlock: React.FC<{
  title: string;
  isDark: boolean;
  children: React.ReactNode;
}> = ({ title, isDark, children }) => (
  <div
    className={cn(
      'rounded-3xl border p-4',
      isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white'
    )}
  >
    <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
      {title}
    </h3>
    <div className="mt-4">{children}</div>
  </div>
);

const KeyValue: React.FC<{
  label: string;
  value: React.ReactNode;
  isDark: boolean;
}> = ({ label, value, isDark }) => (
  <div>
    <p className={cn('text-[11px] font-semibold uppercase tracking-[0.14em]', isDark ? 'text-slate-500' : 'text-slate-500')}>
      {label}
    </p>
    <div className={cn('mt-1 text-sm', isDark ? 'text-slate-300' : 'text-slate-700')}>{value}</div>
  </div>
);

const FacilityGovernanceFacilityDrawer: React.FC<FacilityGovernanceFacilityDrawerProps> = ({
  isDark,
  facility,
  open,
  onClose,
  onOpenStatus,
}) => {
  return (
    <AnimatePresence>
      {open && facility && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.28 }}
            className={cn(
              'fixed right-0 top-0 z-50 h-screen w-full max-w-3xl overflow-y-auto border-l p-6 md:p-8',
              isDark
                ? 'border-white/10 bg-slate-950 text-white'
                : 'border-slate-200 bg-slate-50 text-slate-900'
            )}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <div
                  className={cn(
                    'flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl',
                    isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-100 text-blue-700'
                  )}
                >
                  <span className="text-lg font-bold">{getInitials(facility.name)}</span>
                </div>

                <div className="min-w-0">
                  <h2 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                    {facility.name}
                  </h2>
                  <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                    Facility code: {safeText(facility.facility_code)}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={cn(
                        'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                        getFacilityStatusStyles(facility.status, isDark)
                      )}
                    >
                      {formatStatusLabel(facility.status)}
                    </span>

                    <span
                      className={cn(
                        'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                        getOperationalStatusStyles(facility.operational_status, isDark)
                      )}
                    >
                      {formatStatusLabel(facility.operational_status)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'inline-flex h-11 w-11 items-center justify-center rounded-2xl transition-all',
                  isDark ? 'bg-white/5 text-slate-200 hover:bg-white/10' : 'bg-white text-slate-700 hover:bg-slate-100'
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onOpenStatus(facility)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all',
                  isDark ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-900 text-white hover:bg-slate-800'
                )}
              >
                <Shield className="h-4 w-4" />
                Update Facility Status
              </button>
            </div>

            <div className="space-y-5">
              <SectionBlock title="Identity & Governance" isDark={isDark}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <KeyValue label="Facility UUID" value={safeText(facility.facility_uuid)} isDark={isDark} />
                  <KeyValue label="Facility Code" value={safeText(facility.facility_code)} isDark={isDark} />
                  <KeyValue label="Status Reason" value={safeText(facility.status_reason)} isDark={isDark} />
                  <KeyValue label="Status Set At" value={formatDateTime(facility.status_set_at)} isDark={isDark} />
                  <KeyValue label="Created At" value={formatDate(facility.created_at)} isDark={isDark} />
                  <KeyValue label="Operational Status" value={formatStatusLabel(facility.operational_status)} isDark={isDark} />
                </div>
              </SectionBlock>

              <SectionBlock title="Facility Contact & Location" isDark={isDark}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <KeyValue
                    label="Phone"
                    value={
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {safeText(facility.phone)}
                      </div>
                    }
                    isDark={isDark}
                  />
                  <KeyValue
                    label="Email"
                    value={
                      <div className="flex items-center gap-2 break-all">
                        <Mail className="h-4 w-4" />
                        {safeText(facility.email)}
                      </div>
                    }
                    isDark={isDark}
                  />
                  <div className="sm:col-span-2">
                    <KeyValue
                      label="Address"
                      value={
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{formatAddress(facility.location)}</span>
                        </div>
                      }
                      isDark={isDark}
                    />
                  </div>
                </div>
              </SectionBlock>

              <SectionBlock title="Owner Details" isDark={isDark}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <KeyValue
                    label="Owner Name"
                    value={
                      <div className="flex items-center gap-2">
                        <User2 className="h-4 w-4" />
                        {safeText(facility.owner?.name)}
                      </div>
                    }
                    isDark={isDark}
                  />
                  <KeyValue label="Owner Email" value={safeText(facility.owner?.email)} isDark={isDark} />
                  <KeyValue label="Owner Phone" value={safeText(facility.owner?.phone)} isDark={isDark} />
                </div>
              </SectionBlock>

              <SectionBlock title="Billing Overview" isDark={isDark}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <KeyValue
                    label="Total Paid"
                    value={<span className="font-semibold">{formatAmount(facility.billing?.total_paid)}</span>}
                    isDark={isDark}
                  />
                  <KeyValue
                    label="Outstanding Balance"
                    value={<span className="font-semibold">{formatAmount(facility.billing?.balance)}</span>}
                    isDark={isDark}
                  />
                </div>
              </SectionBlock>

              <SectionBlock title={`Staff Members (${facility.staff_count})`} isDark={isDark}>
                {facility.staff?.length ? (
                  <div className="space-y-3">
                    {facility.staff.map((member, index) => (
                      <div
                        key={`${member.name}-${index}`}
                        className={cn(
                          'rounded-2xl border p-4',
                          isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'
                        )}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                              {member.name}
                            </p>
                            <p className={cn('mt-1 text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                              Role: {safeText(member.role)}
                            </p>
                          </div>

                          <div className="space-y-1 text-sm">
                            <p className={cn('break-all', isDark ? 'text-slate-300' : 'text-slate-700')}>
                              {safeText(member.email)}
                            </p>
                            <p className={cn(isDark ? 'text-slate-400' : 'text-slate-600')}>
                              {safeText(member.phone)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={cn(
                      'rounded-2xl border border-dashed p-6 text-center',
                      isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50/70'
                    )}
                  >
                    <Users className={cn('mx-auto mb-3 h-6 w-6', isDark ? 'text-slate-400' : 'text-slate-500')} />
                    <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                      No staff members listed for this facility.
                    </p>
                  </div>
                )}
              </SectionBlock>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default FacilityGovernanceFacilityDrawer;
