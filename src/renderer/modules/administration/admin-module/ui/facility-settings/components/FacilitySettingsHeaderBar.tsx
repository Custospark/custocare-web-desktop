import React from 'react';
import { Edit3, Save, X, Building2 } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
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

export const FacilitySettingsHeaderBar: React.FC<FacilitySettingsHeaderBarProps> = ({
  isDark,
  activeFacilityName,
  editMode,
  setEditMode,
  onCancel,
  onSave,
  isSaving,
  isUploadingLogo,
}) => {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className={isDark ? 'text-cyan-400' : 'text-blue-600'} />
          Facility Settings
        </h1>
        <p className={cn(
          "text-sm mt-1",
          isDark ? 'text-gray-400' : 'text-gray-500'
        )}>
          {activeFacilityName ? (
            <>
              Managing settings for: <span className="font-semibold">{activeFacilityName}</span>
            </>
          ) : (
            'Manage facility configuration, branding, and operational settings.'
          )}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {editMode ? (
          <>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving || isUploadingLogo}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors",
                (isSaving || isUploadingLogo) 
                  ? 'cursor-not-allowed opacity-50' 
                  : 'cursor-pointer hover:bg-opacity-80',
                isDark 
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800' 
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              )}
            >
              <X className="w-4 h-4" />
              Cancel
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={isSaving || isUploadingLogo}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors",
                (isSaving || isUploadingLogo) 
                  ? 'cursor-not-allowed opacity-60' 
                  : 'cursor-pointer hover:bg-blue-700',
                'bg-blue-600'
              )}
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
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer hover:bg-blue-700",
              isDark ? 'bg-blue-500' : 'bg-blue-600'
            )}
          >
            <Edit3 className="w-4 h-4" />
            Edit Settings
          </button>
        )}
      </div>
    </div>
  );
};