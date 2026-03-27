import React, { useEffect, useCallback, useRef, useState } from 'react';
import { X, AlertTriangle, FileText, CreditCard, CheckCircle2, Info, LucideCreditCard, User, Minimize2, Maximize2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../app/routes/routeConstants';
import { clearActiveVisit, selectActiveVisitInfo } from '../../../../../app/store/slices/visitSlice';
import { selectTheme } from '../../../../../app/store/slices/uiSlice';
import { clearPendingForwarding } from '../../../../../app/store/slices/forwardPatientSlice';
import {
  closeTray,
  setStep,
  selectIsTrayOpen,
  selectCurrentStep,
  selectBillingStatus,
  selectIsDirty,
  saveDraft,
  clearAll,
} from './billingSlice';
import { ChargeEntryStep } from './ChargeEntryStep';
import { BillingSummaryStep } from './BillingSummaryStep';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import LogoImage from '../../../../../shared/assets/LogoImage';
import { BrandName } from '../../../../../shared/utils/BrandName';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BILLING TRAY COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * A full-featured billing tray with:
 * - Minimize/Maximize functionality (minimizes to bottom-right corner)
 * - Persistent state preservation when minimized
 * - Professional close handling with discard confirmation
 * - Multi-step workflow (Charges → Payment)
 * - Theme-aware styling
 * - Accessibility support
 * 
 * MINIMIZE BEHAVIOR:
 * - When minimized, tray collapses to a compact widget in bottom-right
 * - All unsaved changes are preserved (no discard on minimize)
 * - Clicking the minimized widget maximizes the tray
 * - Close button discards changes (with confirmation for unsaved changes)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const BillingTray: React.FC = () => {
  // Get theme from UI slice
  const theme = useSelector(selectTheme);
  const isDark = theme === 'dark';
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  // Get active visit info from visit slice
  const activeVisitInfo = useSelector(selectActiveVisitInfo);
  const patientName = activeVisitInfo?.patientName || 'Patient';
  const patientNumber = activeVisitInfo?.patientNumber || '';

  // Redux selectors for billing state
  const isTrayOpen = useSelector(selectIsTrayOpen);
  const currentStep = useSelector(selectCurrentStep);
  const isDirty = useSelector(selectIsDirty);
  const status = useSelector(selectBillingStatus);

  // Local state for minimize/maximize
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const minimizedRef = useRef<HTMLDivElement>(null);

  const QUEUE_ROUTE = MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE;

  // Refs for status message tracking
  const hasShownSettledRef = useRef(false);
  const hasShownReadyRef = useRef(false);

  // Reset minimized state when tray is closed
  useEffect(() => {
    if (!isTrayOpen) {
      setIsMinimized(false);
    }
  }, [isTrayOpen]);

  // Reset status message refs when tray is closed
  useEffect(() => {
    if (!isTrayOpen) {
      hasShownSettledRef.current = false;
      hasShownReadyRef.current = false;
    }
  }, [isTrayOpen]);

  // Show status banners based on billing status
  useEffect(() => {
    if (status === 'settled' && !hasShownSettledRef.current) {
      hasShownSettledRef.current = true;
    } else if (status === 'ready' && !hasShownReadyRef.current) {
      hasShownReadyRef.current = true;
    }
  }, [status]);

  // ---------------------------------------------------------------------------
  // Drag functionality for minimized widget
  // ---------------------------------------------------------------------------

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (!minimizedRef.current) return;
    
    setIsDragging(true);
    const rect = minimizedRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep widget within viewport bounds
    const maxX = window.innerWidth - (minimizedRef.current?.offsetWidth || 280);
    const maxY = window.innerHeight - (minimizedRef.current?.offsetHeight || 80);
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  }, [isDragging, dragOffset]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // ---------------------------------------------------------------------------
  // Theme-aware color tokens
  // ---------------------------------------------------------------------------

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      overlay: isDark ? 'bg-black/70' : 'bg-black/50',
      hover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100',
      minimized: isDark ? 'bg-gray-800' : 'bg-white',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
      secondary: isDark ? 'border-gray-700' : 'border-gray-100',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
    },
    accent: {
      primary: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-white',
    },
  };

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Handle minimize action - preserves all state
   */
  const handleMinimize = useCallback(() => {
    // Save draft before minimizing to preserve state
    if (isDirty) {
      dispatch(saveDraft());
    }
    setIsMinimized(true);
  }, [dispatch, isDirty]);

  /**
   * Handle maximize action - restores the full tray
   */
  const handleMaximize = useCallback(() => {
    setIsMinimized(false);
  }, []);

  /**
   * Handle close - discards changes with confirmation
   */
  const handleClose = useCallback(async () => {
    if (status === 'settled') {
      const confirmed = await confirm({
        title: 'Close billing window?',
        message: 'Payment has been successfully completed. All records are saved and the receipt has been generated.',
        confirmText: 'Close',
        cancelText: 'Stay',
        variant: 'info',
        theme,
      });

      if (confirmed) {
        dispatch(clearAll());
        dispatch(clearActiveVisit());
        dispatch(clearPendingForwarding());
        navigate(QUEUE_ROUTE);
      }
      return;
    }

    if (isDirty) {
      const confirmed = await confirm({
        title: 'Discard billing changes?',
        message: 'You have unsaved billing changes. Closing will discard them.',
        confirmText: 'Discard',
        cancelText: 'Stay',
        variant: 'warning',
        theme,
      });

      if (confirmed) {
        dispatch(clearAll());
        dispatch(clearPendingForwarding());
        dispatch(closeTray());
      }
      return;
    }

    // Close tray without changes - clear pending forwarding
    dispatch(closeTray());
    dispatch(clearPendingForwarding());
  }, [confirm, dispatch, isDirty, navigate, theme, status, QUEUE_ROUTE]);

  /**
   * Handle ESC key press
   */
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTrayOpen && !isMinimized) {
        void handleClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isTrayOpen, isMinimized, handleClose]);

  /**
   * Handle step navigation
   */
  const handleSetStep = (step: 'charge_entry' | 'billing_summary') => {
    dispatch(setStep(step));
    dispatch(saveDraft());
  };

  // ---------------------------------------------------------------------------
  // Status configuration
  // ---------------------------------------------------------------------------

  const getStatusConfig = (billingStatus: typeof status) => {
    switch (billingStatus) {
      case 'settled':
        return {
          bg: 'bg-green-600 text-white dark:bg-green-500 dark:text-white',
          icon: CheckCircle2,
          message: 'Payment settled - Records saved successfully',
        };
      case 'ready':
        return {
          bg: 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white',
          icon: CreditCard,
          message: 'Payment records saved - Ready to finalize',
        };
      default:
        return {
          bg: 'bg-gray-600 text-white dark:bg-gray-500 dark:text-white',
          icon: FileText,
          message: 'Draft - Unsaved changes',
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  const steps = [
    { key: 'charge_entry', label: 'Charges', icon: FileText },
    { key: 'billing_summary', label: 'Payment', icon: CreditCard },
  ] as const;

  // ---------------------------------------------------------------------------
  // Minimized View Component
  // ---------------------------------------------------------------------------

  const MinimizedView = () => {
    const itemsCount = 0; // This will come from selector, but simplified for now
    
    return (
      <div
        ref={minimizedRef}
        className={`fixed bottom-4 right-4 z-50 cursor-pointer select-none ${colors.bg.minimized} border ${colors.border.primary} rounded-xl shadow-2xl transition-all duration-200 hover:shadow-xl`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'all 0.2s ease',
        }}
      >
        {/* Drag Handle */}
        <div
          className="absolute top-0 left-0 right-0 h-8 cursor-grab active:cursor-grabbing"
          onMouseDown={handleDragStart}
          style={{ cursor: 'grab' }}
        />
        
        <div className="p-3">
          <div className="flex items-center gap-3">
            {/* Logo and Brand */}
            <div className="flex items-center gap-2">
              <LogoImage size="xs" />
              <div className="flex items-center gap-1">
                <span className={`text-xs font-medium ${colors.text.primary}`}>
                  <BrandName />
                </span>
                <CreditCard className="w-3 h-3 text-blue-500" />
              </div>
            </div>

            {/* Patient Info */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-300 dark:border-gray-700">
              <User className="w-3 h-3 text-gray-500" />
              <span className={`text-xs font-medium ${colors.text.primary} truncate max-w-[120px]`}>
                {patientName}
              </span>
            </div>

            {/* Status Badge */}
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg}`}>
              <div className="flex items-center gap-1">
                <StatusIcon className="w-2.5 h-2.5" />
                <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Dirty Indicator */}
              {isDirty && status !== 'settled' && (
                <div className="relative group">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block z-50">
                    <div className={`px-2 py-1 rounded text-xs ${colors.bg.secondary} border ${colors.border.primary} whitespace-nowrap`}>
                      Unsaved changes
                    </div>
                  </div>
                </div>
              )}
              
              {/* Maximize Button */}
              <button
                onClick={handleMaximize}
                className={`p-1 rounded-md ${colors.bg.hover} ${colors.text.secondary} transition-colors cursor-pointer`}
                aria-label="Maximize billing tray"
                title="Maximize"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              
              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void handleClose();
                }}
                className={`p-1 rounded-md ${colors.bg.hover} ${colors.text.secondary} transition-colors cursor-pointer`}
                aria-label="Close billing"
                title="Close (discard changes)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Summary */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className={`text-xs ${colors.text.secondary}`}>
              {currentStep === 'charge_entry' ? 'Entering charges' : 'Ready for payment'}
            </span>
            <span className={`text-xs font-medium ${colors.text.primary}`}>
              Click to resume
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Full Tray View
  // ---------------------------------------------------------------------------

  const FullTrayView = () => (
    <>
      {/* Overlay Backdrop */}
      <div
        className={`fixed inset-0 z-40 ${colors.bg.overlay} transition-opacity cursor-pointer`}
        onClick={() => void handleClose()}
      />

      {/* Tray */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 pointer-events-none">
        <div
          className={`w-full max-w-[95vw] xl:max-w-[90vw] 2xl:max-w-[85vw] min-h-[70vh] sm:min-h-[75vh] max-h-[94vh]
            rounded-lg shadow-2xl pointer-events-auto flex flex-col ${colors.bg.primary}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${colors.border.primary} gap-3`}>
            
            {/* Left: App Logo & Patient Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <LogoImage size="sm" />
              <div className="hidden sm:flex sm:items-center sm:gap-2">
                <BrandName/>
                <LucideCreditCard className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-500">
                  Billing
                </span>
              </div>
              {/* Patient Info */}
              <div className="ml-4 hidden md:flex items-center gap-2 pl-4 border-l border-gray-300 dark:border-gray-700">
                <User className="w-4 h-4 text-gray-500" />
                <div className="flex flex-col">
                  <span className={`text-sm font-medium ${colors.text.primary}`}>
                    {patientName}
                  </span>
                  {patientNumber && (
                    <span className={`text-xs ${colors.text.secondary}`}>
                      #{patientNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Center: Steps */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {steps.map((step, index) => {
                const isActive = currentStep === step.key;
                const isCompleted = 
                  (step.key === 'charge_entry' && currentStep === 'billing_summary') ||
                  (step.key === 'billing_summary' && currentStep === 'billing_summary');
                const StepIcon = step.icon;
                
                return (
                  <React.Fragment key={step.key}>
                    <button
                      onClick={() => handleSetStep(step.key)}
                      disabled={status === 'settled' && step.key === 'charge_entry'}
                      type="button"
                      className={`
                        flex items-center gap-1.5 px-2.5 py-1.5 rounded-md 
                        transition-colors cursor-pointer whitespace-nowrap
                        ${status === 'settled' && step.key === 'charge_entry' 
                          ? 'opacity-50 cursor-not-allowed' 
                          : ''
                        }
                        ${isActive 
                          ? `${colors.accent.primary} ${colors.accent.text}` 
                          : `bg-transparent ${colors.text.secondary} ${colors.bg.hover}`
                        }
                      `}
                    >
                      <StepIcon className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{step.label}</span>
                      <span className="text-xs opacity-80">({index + 1})</span>
                      {isCompleted && !isActive && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-500 ml-0.5" />
                      )}
                    </button>
                    
                    {index < steps.length - 1 && (
                      <div className="w-3 h-px bg-gray-300 dark:bg-gray-700 mx-0.5" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Right: Status, Minimize & Close */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Status Badge with Tooltip */}
              <div className="relative group">
                <div
                  className={`px-2 py-1 rounded-md text-xs font-medium select-none whitespace-nowrap flex items-center gap-1.5 ${statusConfig.bg}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                </div>
                
                {/* Tooltip with status message */}
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50">
                  <div className={`px-3 py-2 rounded-lg shadow-lg ${colors.bg.secondary} border ${colors.border.primary} max-w-xs`}>
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className={`text-xs ${colors.text.secondary}`}>{statusConfig.message}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Minimize Button */}
              <button
                onClick={handleMinimize}
                className={`p-1.5 rounded-md ${colors.bg.hover} ${colors.text.secondary} cursor-pointer flex-shrink-0 transition-colors`}
                aria-label="Minimize billing tray"
                title="Minimize (keeps your changes)"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              
              {/* Close Button */}
              <button
                onClick={() => void handleClose()}
                type="button"
                className={`p-1.5 rounded-md ${colors.bg.hover} ${colors.text.secondary} cursor-pointer flex-shrink-0`}
                aria-label="Close billing tray (discard changes)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {currentStep === 'charge_entry' ? (
              <ChargeEntryStep theme={theme} />
            ) : (
              <BillingSummaryStep theme={theme} />
            )}
          </div>

          {/* Dirty Warning - Only show if not settled */}
          {isDirty && status !== 'settled' && (
            <div className={`p-2 border-t ${colors.border.primary} ${colors.bg.secondary}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span className={`text-xs ${colors.text.secondary}`}>
                  Unsaved changes - closing will discard them
                </span>
              </div>
            </div>
          )}

          {/* Settled Status Footer */}
          {status === 'settled' && (
            <div className={`p-2 border-t ${colors.border.primary} ${colors.bg.secondary}`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span className={`text-xs ${colors.text.secondary}`}>
                  Payment finalized. You can print the receipt from the Payment step.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!isTrayOpen) return null;

  // Show minimized view
  if (isMinimized) {
    return <MinimizedView />;
  }

  // Show full tray
  return <FullTrayView />;
};

BillingTray.displayName = 'BillingTray';

export default BillingTray;