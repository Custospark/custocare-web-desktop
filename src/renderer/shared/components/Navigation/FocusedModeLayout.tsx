// FocusedModeLayout.tsx
import React, { useCallback, useMemo } from 'react';
import { X, AlertCircle, User, Calendar, Clock, Activity, Shield, Droplet, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { formatText } from '../../../modules/medical-records/ui/revenue/stats/billing-revenue-stats-component/revenueDashboardUtils';

import type { RootState } from '../../../app/store/rootReducer';
import { cn } from '../../types/cn';
import DecorativeBackground from './DecorativeBackground';
import {
  type ThemeMode,
} from './layout-components/LayoutTypes';
import {
  selectActivePatient,
  selectActiveVisitInfo,
  selectActiveVisitPhase,
} from '../../../app/store/slices/visitSlice';
import LogoImage from '../../assets/LogoImage';
import { BrandName } from '../../utils/BrandName';

interface FocusedModeLayoutProps {
  title?: string;
  onClose?: string;
  children?: React.ReactNode;
}

export const FocusedModeLayout: React.FC<FocusedModeLayoutProps> = ({ 
  title = "Clinical Focus Mode",
  onClose,
  children 
}) => {
  const navigate = useNavigate();

  const { theme, patient, visitInfo, visitPhase } = useSelector((state: RootState) => ({
    theme: state.ui.theme as ThemeMode,
    patient: selectActivePatient(state),
    visitInfo: selectActiveVisitInfo(state),
    visitPhase: selectActiveVisitPhase(state),
  }));

  const handleClose = useCallback(() => {
    if (onClose) {
      navigate(onClose);
    } else {
      navigate(-1);
    }
  }, [onClose, navigate]);

  const isDark = theme === 'dark';

  // Hardcoded allergy data (will be replaced with actual patient allergies later)
  const allergies = useMemo(() => [
    { allergen: 'Penicillin', reaction: 'Rash, Hives', severity: 'high' },
    { allergen: 'Peanuts', reaction: 'Anaphylaxis', severity: 'high' },
    { allergen: 'Latex', reaction: 'Skin irritation', severity: 'medium' },
  ], []);

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high':
        return isDark 
          ? 'text-red-300 bg-red-900/30 border-red-800/50' 
          : 'text-red-800 bg-red-100 border-red-200';
      case 'medium':
        return isDark 
          ? 'text-yellow-300 bg-yellow-900/30 border-yellow-800/50' 
          : 'text-yellow-800 bg-yellow-100 border-yellow-200';
      default:
        return isDark 
          ? 'text-blue-300 bg-blue-900/30 border-blue-800/50' 
          : 'text-blue-800 bg-blue-100 border-blue-200';
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'N/A';
    }
  };

  const calculateWaitTime = (arrivedAt: string | null): string => {
    if (!arrivedAt) return 'N/A';
    try {
      const arrivalTime = new Date(arrivedAt).getTime();
      const now = Date.now();
      const diffMinutes = Math.floor((now - arrivalTime) / (1000 * 60));
      
      if (diffMinutes < 60) {
        return `${diffMinutes} min`;
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return `${hours}h ${minutes}m`;
      }
    } catch {
      return 'N/A';
    }
  };

  const getPhaseDisplayName = (phase: string): string => 
    phase?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Active Visit';

  const hasPatientData = patient && patient.name;
  const hasVisitData = visitInfo && visitInfo.uuid;

  // Helper for consistent text colors
  const text = {
    primary: isDark ? 'text-gray-100' : 'text-gray-900',
    secondary: isDark ? 'text-gray-300' : 'text-gray-600',
    muted: isDark ? 'text-gray-400' : 'text-gray-500',
    brand: isDark ? 'text-blue-400' : 'text-blue-600',
  };

  const bg = {
    card: isDark ? 'bg-gray-900/90' : 'bg-white',
    header: isDark ? 'bg-gray-800/70' : 'bg-gray-50',
    icon: isDark ? 'bg-gray-800' : 'bg-gray-100',
    iconAccent: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
  };

  const border = {
    card: isDark ? 'border-gray-700' : 'border-gray-200',
    subtle: isDark ? 'border-gray-800' : 'border-gray-100',
  };

  return (
    <div
      className={cn(
        'min-h-screen',
        'transition-colors duration-500 ease-in-out',
        isDark
          ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950'
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'
      )}
    >
      <div className="container mx-auto p-4 lg:p-6">
        {/* Header Section - Brand Left, Title Center, Close Right */}
        <div className="flex items-center justify-between mb-6">
          {/* Left: Custocare Branding */}
          <div className="flex items-center gap-2 shrink-0">
            <LogoImage />
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <BrandName />
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs font-bold rounded-full border',
                    isDark
                      ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30'
                      : 'bg-gradient-to-r from-blue-100 to-cyan-50 text-blue-700 border-blue-300'
                  )}
                >
                  Focus Mode
                </span>
              </div>
              <p className={cn('text-xs mt-0.5 font-semibold', text.brand)}>
                Clinical Documentation
              </p>
            </div>
          </div>

          {/* Center: Title */}
          <h1 className={cn(
            'text-xl lg:text-2xl font-bold tracking-tight absolute left-1/2 transform -translate-x-1/2',
            text.primary
          )}>
            {title}
          </h1>

          {/* Right: Close Button */}
          <button
            onClick={handleClose}
            className={cn(
              'flex cursor-pointer items-center justify-center rounded-lg p-2 transition-all duration-200 shrink-0',
              isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              'shadow-sm'
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column - Patient Info Card */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className={`rounded-xl overflow-hidden sticky top-6 border shadow-sm ${border.card} ${bg.card}`}>
              {/* Card Header */}
              <div className={`px-5 py-4 border-b ${border.subtle} ${bg.header}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${bg.iconAccent}`}>
                    <User className={`w-5 h-5 ${text.brand}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm uppercase tracking-wide ${text.muted}`}>
                      Current Patient
                    </h3>
                    <p className={`text-xs mt-0.5 ${text.secondary}`}>
                      {getPhaseDisplayName(visitPhase || '')}
                    </p>
                  </div>
                </div>
              </div>

              {!hasPatientData || !hasVisitData ? (
                <div className="p-6 text-center">
                  <div className={`p-4 rounded-lg inline-flex mb-4 ${bg.icon}`}>
                    <User className={`w-8 h-8 ${text.muted}`} />
                  </div>
                  <h3 className={`font-semibold text-base mb-2 ${text.primary}`}>No Active Patient</h3>
                  <p className={`text-sm ${text.muted}`}>
                    Please select a patient from the queue
                  </p>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {/* Patient Name with icon */}
                  <div className="flex items-start gap-2">
                    <User className={`w-4 h-4 mt-0.5 ${text.muted}`} />
                    <div className="flex-1">
                      <p className={`text-xs font-medium mb-1 uppercase tracking-wide ${text.muted}`}>
                        Patient Name
                      </p>
                      <p className={`text-xl font-bold ${text.primary}`}>{patient.name}</p>
                    </div>
                  </div>

                  {/* Patient Number */}
                  <div className="flex items-start gap-2">
                    <Activity className={`w-4 h-4 mt-0.5 ${text.muted}`} />
                    <div className="flex-1">
                      <p className={`text-xs font-medium mb-1 uppercase tracking-wide ${text.muted}`}>
                        Patient No.
                      </p>
                      <p className={`font-mono text-sm font-semibold ${text.primary}`}>
                        {patient.patient_number || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className={`border-t ${border.subtle}`} />

                  {/* Demographics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <Calendar className={`w-3.5 h-3.5 mt-0.5 ${text.muted}`} />
                      <div>
                        <p className={`text-xs ${text.muted}`}>DOB</p>
                        <p className={`text-sm font-medium ${text.primary}`}>{formatDate(patient.date_of_birth)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className={`w-3.5 h-3.5 mt-0.5 ${text.muted}`} />
                      <div>
                        <p className={`text-xs ${text.muted}`}>Sex</p>
                        <p className={`text-sm font-medium ${text.primary}`}>{formatText(patient.biological_sex || 'N/A')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Droplet className={`w-3.5 h-3.5 mt-0.5 ${text.muted}`} />
                      <div>
                        <p className={`text-xs ${text.muted}`}>Blood Type</p>
                        <p className={`text-sm font-medium ${text.primary}`}>{patient.blood_type || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className={`w-3.5 h-3.5 mt-0.5 ${text.muted}`} />
                      <div>
                        <p className={`text-xs ${text.muted}`}>Wait Time</p>
                        <p className={`text-sm font-semibold ${text.primary}`}>{calculateWaitTime(visitInfo.arrivedAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`border-t ${border.subtle}`} />

                  {/* Status Badges */}
                  {(patient.requires_isolation || visitInfo.acuity) && (
                    <div className="space-y-2">
                      {patient.requires_isolation && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${
                          isDark 
                            ? 'bg-yellow-900/20 text-yellow-300 border-yellow-800/50' 
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>
                          <Shield className="w-3.5 h-3.5" />
                          <span>Isolation Required</span>
                        </div>
                      )}
                      {visitInfo.acuity && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${
                          isDark 
                            ? 'bg-orange-900/20 text-orange-300 border-orange-800/50' 
                            : 'bg-orange-100 text-orange-800 border-orange-200'
                        }`}>
                          <Activity className="w-3.5 h-3.5" />
                          <span>Acuity: {visitInfo.acuity}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`border-t ${border.subtle}`} />

                  {/* Allergies Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className={`w-3.5 h-3.5 ${text.muted}`} />
                      <p className={`text-xs font-medium uppercase tracking-wide ${text.muted}`}>
                        Allergies
                      </p>
                    </div>
                    <div className="space-y-2">
                      {allergies.map((allergy, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-2 rounded-lg text-sm border ${getSeverityColor(allergy.severity)}`}
                        >
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <div>
                              <span className="font-medium">{allergy.allergen}</span>
                              {allergy.reaction && (
                                <span className={`text-xs ml-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                  ({allergy.reaction})
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`text-xs capitalize px-2 py-0.5 rounded ${getSeverityColor(allergy.severity)}`}>
                            {allergy.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Form Content */}
          <div className="lg:col-span-8 xl:col-span-9">
            <div className={`rounded-xl border shadow-sm overflow-hidden ${border.card} ${bg.card}`}>
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Background */}
      <DecorativeBackground theme={theme} sidebarPosition="left" />
    </div>
  );
};

export default FocusedModeLayout;