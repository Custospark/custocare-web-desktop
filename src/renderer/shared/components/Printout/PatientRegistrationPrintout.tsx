import React from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  Fingerprint,
} from 'lucide-react';
import { BRAND_NAME_UCASE } from '../../utils/BrandName';

export interface FacilityInfo {
  name: string;
  code: string;
  address: string;
  phone: string | null;
  email: string | null;
}

export interface PatientRegistrationPrintoutProps {
  patientName: string;
  patientNumber: string;
  registrationDate?: string;
  facility?: FacilityInfo | null;
  registeredByName?: string;
}

const RegistrationFooter: React.FC<{ label: string; description: string }> = ({
  label,
  description,
}) => (
  <div className="mt-6 border-t-2 border-gray-200 pt-4 text-center">
    <div className="mb-2 flex items-center justify-center gap-2">
      <ShieldCheck className="h-4 w-4 text-emerald-600" />
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
        Electronically Generated {label}
      </span>
    </div>

    <p className="mx-auto max-w-3xl text-[11px] leading-5 text-gray-600">
      {description}
    </p>

    <div className="mt-3 flex items-center justify-center gap-2">
      <Sparkles className="h-3.5 w-3.5 text-blue-500" />
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-600">
        Connected Care • One Identifier Across All Facilities
      </p>
    </div>

    <p className="mt-3 text-[10px] font-mono text-gray-500">
      PRINT TIME:{' '}
      <span className="font-bold text-gray-900">
        {new Date()
          .toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })
          .replace(/,/g, '')}
      </span>
    </p>
  </div>
);

export const PatientRegistrationPrintout = React.forwardRef<HTMLDivElement, PatientRegistrationPrintoutProps>(({
  patientName,
  patientNumber,
  registrationDate,
  facility,
  registeredByName,
}, ref) => {
  const date = registrationDate || new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isStaffRegistration = !!facility;

  return (
    <>
      <style>{`
        .patient-registration-printout * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @media print {
          .patient-registration-printout { page-break-inside: avoid; }
        }
      `}</style>
      <div ref={ref} className="patient-registration-printout bg-white text-black">
        <div className="mx-auto max-w-4xl p-8 print:max-w-none print:p-6 print:shadow-none">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">

            {isStaffRegistration ? (
              <div className="mb-6 border-b-2 border-blue-600 pb-5 text-center print:mb-4 print:pb-4 print:border-blue-800">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 print:hidden">
                  <Building2 className="h-7 w-7 text-blue-600" />
                </div>

                <h1 className="text-2xl font-black tracking-tight text-slate-900 print:text-xl">
                  {facility!.name.toUpperCase()}
                </h1>

                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 print:mt-1">
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700 print:bg-transparent print:p-0 print:text-gray-600">
                    Patient Registration Confirmation
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-gray-600 print:mt-2">
                  <p className="inline-flex items-center gap-1 print:gap-1.5">
                    <MapPin className="h-3.5 w-3.5 print:hidden" />
                    {facility!.address}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-4 print:gap-3">
                    {facility!.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 print:hidden" />
                        {facility!.phone}
                      </span>
                    )}
                    {facility!.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 print:hidden" />
                        {facility!.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 print:mt-2">
                  <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 print:bg-transparent print:p-0 print:text-gray-400">
                    Facility Number: <span className="text-gray-700 print:text-gray-900">{facility!.code}</span>
                  </span>
                </div>

                <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 px-4 py-3 print:mt-3 print:rounded-none print:bg-transparent print:border-y print:border-gray-200 print:py-2">
                  <p className="text-lg font-black tracking-wide text-blue-700 print:text-base print:text-slate-900">
                    PATIENT REGISTRATION CONFIRMATION
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-6 border-b-2 border-emerald-600 pb-5 text-center print:mb-4 print:pb-4">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 print:hidden">
                  <User className="h-7 w-7 text-emerald-600" />
                </div>

                <h1 className="text-2xl font-black tracking-tight text-slate-900 print:text-xl">
                  {BRAND_NAME_UCASE}
                </h1>

                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 print:mt-1">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 print:bg-transparent print:p-0 print:text-gray-600">
                    Patient Registration Confirmation
                  </span>
                </div>

                <p className="mt-3 text-xs font-semibold text-emerald-600 print:text-gray-600">
                  Continuous Care. Clinical Excellence.
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  Self-Registration via Patient Portal
                </p>
              </div>
            )}

            <div className="my-6 rounded-lg bg-gray-50 p-4 space-y-2 print:my-4 print:bg-transparent print:p-0 print:border print:border-gray-200 print:rounded-lg print:p-3">

              <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 print:py-1.5">
                <span className="flex items-center gap-2 text-xs font-medium text-gray-500 print:text-[10px]">
                  <span className="print:hidden"><User className="h-3.5 w-3.5" /></span>
                  Patient Name
                </span>
                <span className="text-xs font-semibold text-gray-800 text-right print:text-[10px]">
                  {patientName}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 print:py-1.5">
                <span className="flex items-center gap-2 text-xs font-medium text-gray-500 print:text-[10px]">
                  <span className="print:hidden"><Fingerprint className="h-3.5 w-3.5" /></span>
                  Patient Number
                </span>
                <span className="text-xs font-mono font-bold text-blue-700 text-right print:text-[10px]">
                  {patientNumber}
                </span>
              </div>

              {isStaffRegistration && registeredByName && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 print:py-1.5">
                  <span className="flex items-center gap-2 text-xs font-medium text-gray-500 print:text-[10px]">
                    <span className="print:hidden"><User className="h-3.5 w-3.5" /></span>
                    Registered By
                  </span>
                  <span className="text-xs font-semibold text-gray-800 text-right print:text-[10px]">
                    {registeredByName}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 print:py-1.5">
                <span className="flex items-center gap-2 text-xs font-medium text-gray-500 print:text-[10px]">
                  <span className="print:hidden"><MapPin className="h-3.5 w-3.5" /></span>
                  Registration Date
                </span>
                <span className="text-xs font-semibold text-gray-800 text-right print:text-[10px]">
                  {date}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center print:border-blue-300">
              <p className="text-xs leading-relaxed text-blue-800">
                This patient number is unique and valid across all Custocare facilities.
                Present this number at any facility during your next visit —
                no need to register again.
              </p>
            </div>

            <RegistrationFooter
              label="Registration Confirmation"
              description="This patient registration confirmation is part of the patient's medical record and serves as proof of registration across all Custocare facilities."
            />

          </div>
        </div>
      </div>
    </>
  );
});

PatientRegistrationPrintout.displayName = 'PatientRegistrationPrintout';
