import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, FileText } from 'lucide-react';
import type { FacilitySnapshot, MedicalHistoryVisit } from '../../../medical-records/api/patient-medical-history/patientMedicalHistoryTypes';
import { formatDate } from './patientPortalClinicalPreview.utils';

export interface PatientPortalClinicalPreviewShellProps {
  theme: 'light' | 'dark';
  title: string;
  subtitle: string;
  sectionLabel: string;
  icon: React.ReactNode;
  headerVisit: MedicalHistoryVisit | null;
  headerFacility: FacilitySnapshot | null;
  fullHistoryHref: string;
  fullHistoryLinkLabel: string;
  children: React.ReactNode;
  banner?: React.ReactNode;
}

function visitDateLine(v: MedicalHistoryVisit | null): string | null {
  if (!v) return null;
  const raw = v.occurred_at ?? v.arrived_at ?? v.discharged_at;
  if (!raw) return null;
  const t = new Date(raw).getTime();
  if (!Number.isFinite(t)) return null;
  return formatDate(raw);
}

export function PatientPortalClinicalPreviewShell({
  theme,
  title,
  subtitle,
  sectionLabel,
  icon,
  headerVisit,
  headerFacility,
  fullHistoryHref,
  fullHistoryLinkLabel,
  children,
  banner,
}: PatientPortalClinicalPreviewShellProps) {
  const isDark = theme === 'dark';
  const shell = isDark ? 'border-gray-700 bg-gray-950' : 'border-slate-200 bg-white';
  const meta = isDark ? 'text-gray-400' : 'text-slate-600';
  const heading = isDark ? 'text-gray-100' : 'text-slate-900';

  return (
    <div className={`min-h-full p-4 sm:p-5 lg:p-6 ${isDark ? 'bg-gray-900' : 'bg-slate-50'}`}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:hidden">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400">{icon}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-400">{sectionLabel}</p>
              <h1 className={`mt-0.5 text-xl font-bold ${heading}`}>{title}</h1>
              <p className={`mt-1 max-w-2xl text-sm ${meta}`}>{subtitle}</p>
            </div>
          </div>
          <Link
            to={fullHistoryHref}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              isDark
                ? 'border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700'
                : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
            }`}
          >
            <FileText className="h-4 w-4" />
            {fullHistoryLinkLabel}
          </Link>
        </div>

        {banner}

        <div
          className={`rounded-xl border shadow-sm print:shadow-none ${shell} print:border-slate-300`}
        >
          <div
            className={`flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
              isDark ? 'border-gray-800 bg-gray-900/80' : 'border-slate-100 bg-slate-50/80'
            }`}
          >
            <div className="flex items-start gap-2">
              <Building2 className={`mt-0.5 h-4 w-4 shrink-0 ${isDark ? 'text-gray-500' : 'text-slate-500'}`} />
              <div>
                <p className={`text-sm font-semibold ${heading}`}>
                  {headerFacility?.name ?? 'Hospital visit'}
                  {headerFacility?.code ? (
                    <span className={`font-normal ${meta}`}> ({headerFacility.code})</span>
                  ) : null}
                </p>
                {visitDateLine(headerVisit) ? (
                  <p className={`text-xs ${meta}`}>{visitDateLine(headerVisit)}</p>
                ) : null}
              
              </div>
            </div>
          </div>

          <div className="p-5 md:p-8 print:p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
