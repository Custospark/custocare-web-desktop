// lab-results/labresult-form-components/LabResultPreviewFooter.tsx
import React from 'react';
import {
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const LabResultPreviewFooter: React.FC = () => {
  return (
    <div className="mt-6 border-t-2 border-gray-200 pt-4 text-center">
      <div className="mb-2 flex items-center justify-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Electronically Generated Report
        </span>
      </div>

      <p className="mx-auto max-w-3xl text-[11px] leading-5 text-gray-600">
        This laboratory result report is generated from the clinical laboratory workflow.
        Results must be interpreted in the full clinical context by an authorized healthcare professional.
      </p>

      <div className="mt-3 flex items-center justify-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-blue-500" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-600">
          Continuous Care • Clinical Excellence
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
};

export default LabResultPreviewFooter;
