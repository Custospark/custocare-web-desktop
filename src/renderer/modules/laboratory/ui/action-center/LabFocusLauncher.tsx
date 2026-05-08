import React from 'react';
import { ChevronRight, FlaskConical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LabFormListItem {
  key: string;
  label: string;
  description: string;
  focusPath: string;
}

interface LabFocusLauncherProps {
  theme: 'light' | 'dark';
  title: string;
  description: string;
  forms?: LabFormListItem[];
  buttonLabel?: string;
  focusPath?: string;
}

const LabFocusLauncher: React.FC<LabFocusLauncherProps> = ({
  theme,
  title,
  description,
  forms = [],
  buttonLabel,
  focusPath,
}) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const normalizedForms: LabFormListItem[] =
    forms.length > 0
      ? forms
      : focusPath
        ? [
            {
              key: 'open-form',
              label: buttonLabel || 'Open Form',
              description: 'Open this form in focus mode.',
              focusPath,
            },
          ]
        : [];

  return (
    <div className={isDark ? 'min-h-screen bg-gray-900 p-6' : 'min-h-screen bg-gray-50 p-6'}>
      <div className="mx-auto max-w-2xl">
        <div
          className={`rounded-2xl border p-8 text-center ${
            isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white text-gray-900'
          }`}
        >
          <div
            className={`mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${
              isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-600'
            }`}
          >
            <FlaskConical className="h-7 w-7" />
          </div>

          <h2 className="text-2xl font-bold">{title}</h2>
          <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>

          <div className="mt-7 space-y-3 text-left">
            {normalizedForms.map((form) => (
              <button
                key={form.key}
                type="button"
                onClick={() => navigate(form.focusPath)}
                className={`group flex w-full cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                  isDark
                    ? 'border-gray-700 bg-gray-900/50 hover:bg-gray-700/40'
                    : 'border-gray-200 bg-gray-50 hover:bg-blue-50'
                }`}
              >
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{form.label}</p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{form.description}</p>
                </div>
                <ChevronRight
                  className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
                />
                <span
                  className={`ml-3 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                  }`}
                >
                  Open Form
                </span>
              </button>
            ))}
            {normalizedForms.length === 0 && (
              <div
                className={`rounded-xl border p-4 text-sm ${
                  isDark
                    ? 'border-gray-700 bg-gray-900/50 text-gray-400'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
              >
                No forms are configured for this workspace yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabFocusLauncher;
