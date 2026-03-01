import React from 'react';
import { Building2, Edit3, Save, X } from 'lucide-react';

interface FacilitySettingsHeaderBarProps {
  isDark: boolean;
  activeFacilityName: string | null;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  isUploadingLogo: boolean;
}

const FacilitySettingsHeaderBar: React.FC<FacilitySettingsHeaderBarProps> = ({
  isDark, activeFacilityName, editMode, setEditMode,
  onCancel, onSave, isSaving, isUploadingLogo,
}) => {
  const busy = isSaving || isUploadingLogo;

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      {/* Left: title */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className={isDark ? 'text-cyan-400' : 'text-blue-600'} />
          Facility Identity
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {activeFacilityName ? (
            <>Managing: <span className="font-semibold">{activeFacilityName}</span></>
          ) : (
            'Manage facility configuration, branding, and operational settings.'
          )}
        </p>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        {editMode ? (
          <>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                busy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } ${isDark
                ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
            >
              <X className="w-4 h-4" />
              Cancel
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={busy}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                busy ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-700'
              } bg-blue-600`}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer hover:bg-blue-700 ${
              isDark ? 'bg-blue-500' : 'bg-blue-600'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Edit Identity
          </button>
        )}
      </div>
    </div>
  );
};

export default FacilitySettingsHeaderBar;
