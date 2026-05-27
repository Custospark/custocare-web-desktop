import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  AlertTriangle,
  FileText,
  CreditCard,
  CheckCircle2,
  Info,
  LucideCreditCard,
  User,
  Minimize2,
  Grid,
  Expand,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AMBULANCE_ROUTES,
  BILLING_ROUTES,
  CLINICAL_ROUTES,
  LABORATORY_ROUTES,
  MEDICAL_RECORDS_ROUTES,
  PHARMACY_ROUTES,
} from '../../../../../app/routes/routeConstants';
import {
  clearActiveVisit,
  selectActiveVisitInfo,
} from '../../../../../app/store/slices/visitSlice';
import { VisitCompletedGuard } from '../../../../../shared/components/VisitCompletedGuard';
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
  selectBillingViewMode,
  minimizeTray,
  maximizeTray,
} from './billingSlice';
import { ChargeEntryStep } from './ChargeEntryStep';
import { BillingSummaryStep } from './BillingSummaryStep';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import LogoImage from '../../../../../shared/assets/LogoImage';
import { BrandName } from '../../../../../shared/utils/BrandName';

type MinimizedDockPosition = 'bottom-center' | 'bottom-right' | 'bottom-left';
type BillingStep = 'charge_entry' | 'billing_summary';

interface BillingTrayProps {
  minimizedDockPosition?: MinimizedDockPosition;
}

const DEFAULT_MINIMIZED_DOCK_POSITION: MinimizedDockPosition = 'bottom-right';

export const BillingTray: React.FC<BillingTrayProps> = ({
  minimizedDockPosition = DEFAULT_MINIMIZED_DOCK_POSITION,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm } = useConfirm();

  const theme = useSelector(selectTheme);
  const isDark = theme === 'dark';

  const activeVisitInfo = useSelector(selectActiveVisitInfo);
  const isTrayOpen = useSelector(selectIsTrayOpen);
  const currentStep = useSelector(selectCurrentStep);
  const isDirty = useSelector(selectIsDirty);
  const status = useSelector(selectBillingStatus);
  const viewMode = useSelector(selectBillingViewMode);

  const isMinimized = viewMode === 'minimized';
  const isExpanded = viewMode === 'expanded';

  const patientName = activeVisitInfo?.patientName || 'Patient';
  const patientNumber = activeVisitInfo?.patientNumber || '';

  const [isDragging, setIsDragging] = useState(false);
  const [hasCustomPosition, setHasCustomPosition] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const minimizedRef = useRef<HTMLDivElement>(null);
  const didDragRef = useRef(false);

  /**
   * Prevents duplicate close flows while the confirm dialog is active
   * or while close cleanup is being processed.
   */
  const closeFlowInProgressRef = useRef(false);

  const QUEUE_ROUTE = React.useMemo(() => {
    const pathname = location.pathname;
    if (pathname.startsWith('/billing')) return BILLING_ROUTES.PATIENT_QUEUE;
    if (pathname.startsWith('/pharmacy')) return PHARMACY_ROUTES.PATIENT_QUEUE;
    if (pathname.startsWith('/laboratory')) return LABORATORY_ROUTES.PATIENT_QUEUE;
    if (pathname.startsWith('/ambulance')) return AMBULANCE_ROUTES.PATIENT_QUEUE;
    if (pathname.startsWith('/clinical')) return CLINICAL_ROUTES.PATIENT_QUEUE;
    return MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE;
  }, [location.pathname]);

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
    },
    accent: {
      primary: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-white',
    },
  };

  const steps: Array<{
    key: BillingStep;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { key: 'charge_entry', label: 'Charges', icon: FileText },
    { key: 'billing_summary', label: 'Payment', icon: CreditCard },
  ];

  const getDockedPosition = useCallback((dockPosition: MinimizedDockPosition) => {
    const width = minimizedRef.current?.offsetWidth || 380;
    const height = minimizedRef.current?.offsetHeight || 88;
    const margin = 16;

    switch (dockPosition) {
      case 'bottom-left':
        return {
          x: margin,
          y: window.innerHeight - height - margin,
        };
      case 'bottom-center':
        return {
          x: Math.max(margin, Math.round((window.innerWidth - width) / 2)),
          y: window.innerHeight - height - margin,
        };
      case 'bottom-right':
      default:
        return {
          x: window.innerWidth - width - margin,
          y: window.innerHeight - height - margin,
        };
    }
  }, []);

  const clampToViewport = useCallback((x: number, y: number) => {
    const width = minimizedRef.current?.offsetWidth || 380;
    const height = minimizedRef.current?.offsetHeight || 88;
    const margin = 8;

    return {
      x: Math.max(margin, Math.min(x, window.innerWidth - width - margin)),
      y: Math.max(margin, Math.min(y, window.innerHeight - height - margin)),
    };
  }, []);

  useEffect(() => {
    setIsDragging(false);
    setTouchStart(null);
    didDragRef.current = false;
  }, [viewMode]);

  useEffect(() => {
    if (!isTrayOpen) {
      setIsDragging(false);
      setHasCustomPosition(false);
      setDragOffset({ x: 0, y: 0 });
      setPosition({ x: 0, y: 0 });
      setTouchStart(null);
      didDragRef.current = false;
      closeFlowInProgressRef.current = false;
    }
  }, [isTrayOpen]);

  useEffect(() => {
    if (isMinimized && !hasCustomPosition) {
      const frame = requestAnimationFrame(() => {
        setPosition(getDockedPosition(minimizedDockPosition));
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [isMinimized, hasCustomPosition, minimizedDockPosition, getDockedPosition]);

  useEffect(() => {
    const handleResize = () => {
      if (!isMinimized) return;

      if (hasCustomPosition) {
        setPosition((prev) => clampToViewport(prev.x, prev.y));
        return;
      }

      setPosition(getDockedPosition(minimizedDockPosition));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMinimized, hasCustomPosition, minimizedDockPosition, clampToViewport, getDockedPosition]);

  useEffect(() => {
    if (!isDragging) return;

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      const next = clampToViewport(e.clientX - dragOffset.x, e.clientY - dragOffset.y);

      didDragRef.current = true;
      setPosition(next);
      setHasCustomPosition(true);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.setTimeout(() => {
        didDragRef.current = false;
      }, 0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, clampToViewport]);

  useEffect(() => {
    if (!isDragging || !touchStart) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      const touch = e.touches[0];
      const next = clampToViewport(touch.clientX - dragOffset.x, touch.clientY - dragOffset.y);

      didDragRef.current = true;
      setPosition(next);
      setHasCustomPosition(true);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      setTouchStart(null);

      window.setTimeout(() => {
        didDragRef.current = false;
      }, 0);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, touchStart, dragOffset, clampToViewport]);

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!minimizedRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
      setTouchStart({ x: clientX, y: clientY });
    } else {
      if (e.button !== 0) return;
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = minimizedRef.current.getBoundingClientRect();

    didDragRef.current = false;
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
    setIsDragging(true);
  }, []);

  const handleMinimize = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement>) => {
      e?.stopPropagation();

      if (isDirty) {
        queueMicrotask(() => {
          dispatch(saveDraft());
        });
      }

      dispatch(minimizeTray());
    },
    [dispatch, isDirty]
  );

  const handleMaximize = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement>) => {
      e?.stopPropagation();
      dispatch(maximizeTray());
    },
    [dispatch]
  );

  /**
   * Immediate local close.
   * Use this for non-settled tray closure and as the first step of settled closure.
   */
  const closeTrayImmediately = useCallback(() => {
    dispatch(closeTray());
    dispatch(clearPendingForwarding());
  }, [dispatch]);

  /**
   * Full settled-payment close flow.
   * IMPORTANT:
   * - closeTray() happens first so the UI closes immediately
   * - then we reset billing state and clear external context
   */
  const closeSettledTrayImmediately = useCallback(() => {
    dispatch(closeTray());
    dispatch(clearAll());
    dispatch(clearActiveVisit());
    dispatch(clearPendingForwarding());
    navigate(QUEUE_ROUTE);
  }, [dispatch, navigate, QUEUE_ROUTE]);

  const handleClose = useCallback(
    async (e?: React.MouseEvent | React.KeyboardEvent) => {
      e?.stopPropagation?.();

      if (closeFlowInProgressRef.current) return;
      closeFlowInProgressRef.current = true;

      try {
        if (status === 'settled') {
          const confirmed = await confirm({
            title: 'Close billing window?',
            message:
              'Payment has been successfully completed. All records are saved and the receipt has been generated.',
            confirmText: 'Close',
            cancelText: 'Stay',
            variant: 'info',
            theme,
          });

          if (confirmed) {
            closeSettledTrayImmediately();
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
            closeTrayImmediately();
          }

          return;
        }

        closeTrayImmediately();
      } finally {
        closeFlowInProgressRef.current = false;
      }
    },
    [status, confirm, theme, isDirty, closeTrayImmediately, closeSettledTrayImmediately]
  );

useEffect(() => {
  const handleEsc = (e: globalThis.KeyboardEvent) => {
    if (e.key === 'Escape' && isTrayOpen && isExpanded) {
      void handleClose(e as any);
    }
  };

  window.addEventListener('keydown', handleEsc);
  return () => window.removeEventListener('keydown', handleEsc);
}, [isTrayOpen, isExpanded, handleClose]);

  const handleSetStep = useCallback(
    (step: BillingStep) => {
      dispatch(setStep(step));
      dispatch(saveDraft());
    },
    [dispatch]
  );

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

  if (!isTrayOpen) return null;

  if (isMinimized) {
    return (
      <div
        ref={minimizedRef}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className={`fixed z-50 cursor-pointer select-none ${colors.bg.minimized} border ${colors.border.primary} rounded-xl shadow-2xl transition-shadow duration-200 hover:shadow-xl`}
        style={{
          left: position.x,
          top: position.y,
          width: 'min(420px, calc(100vw - 16px))',
        }}
        onClick={() => {
          if (didDragRef.current) return;
          dispatch(maximizeTray());
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-10 md:h-8 cursor-grab active:cursor-grabbing touch-manipulation"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onDragStart={(e) => e.preventDefault()}
        />

        <div className="p-3" onDragStart={(e) => e.preventDefault()}>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Grid className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>

              <div className="hidden sm:flex items-center gap-1">
                <span className={`text-xs font-medium ${colors.text.primary}`}>
                  <BrandName />
                </span>
                <CreditCard className="w-3 h-3 text-blue-500" />
              </div>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-gray-300 dark:border-gray-700 flex-shrink-0">
              <User className="w-3 h-3 text-gray-500 flex-shrink-0" />
              <span
                className={`text-xs font-medium ${colors.text.primary} truncate max-w-[100px] md:max-w-[120px]`}
              >
                {patientName}
              </span>
            </div>

            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} flex-shrink-0`}>
              <div className="flex items-center gap-1">
                <StatusIcon className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
                <span className="sm:hidden">{status.charAt(0).toUpperCase()}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 ml-auto flex-shrink-0">
              {isDirty && status !== 'settled' && (
                <div className="relative group">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block z-50">
                    <div
                      className={`px-2 py-1 rounded text-xs ${colors.bg.secondary} border ${colors.border.primary} whitespace-nowrap`}
                    >
                      Unsaved changes
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleMaximize}
                className={`p-1.5 md:p-1 rounded-md ${colors.bg.hover} ${colors.text.secondary} transition-colors cursor-pointer touch-manipulation`}
                aria-label="Expand billing tray"
                title="Expand"
              >
                <Expand className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </button>

              <button
                type="button"
                onClick={(e) => void handleClose(e)}
                className={`p-1.5 md:p-1 rounded-md ${colors.bg.hover} ${colors.text.secondary} transition-colors cursor-pointer touch-manipulation`}
                aria-label="Close billing"
                title="Close billing"
              >
                <X className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className={`text-xs ${colors.text.secondary}`}>
              {currentStep === 'charge_entry' ? 'Entering charges' : 'Ready for payment'}
            </span>
            <span className={`text-xs font-medium ${colors.text.primary}`}>
              Tap to expand
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 ${colors.bg.overlay} transition-opacity cursor-pointer`}
        onClick={(e) => void handleClose(e)}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          className={`w-full h-full rounded-lg shadow-2xl pointer-events-auto flex flex-col ${colors.bg.primary}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-3 border-b ${colors.border.primary} gap-2 sm:gap-3`}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-2 flex-shrink-0">
                <LogoImage size="sm" />
                <div className="flex items-center gap-1">
                  <BrandName />
                  <LucideCreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                </div>
              </div>

              <div className="flex items-center gap-2 sm:hidden">
                <div className="relative group">
                  <div
                    className={`px-2 py-1 rounded-md text-xs font-medium select-none whitespace-nowrap flex items-center gap-1 ${statusConfig.bg}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleMinimize}
                  className={`p-1.5 rounded-md ${colors.bg.hover} ${colors.text.secondary} cursor-pointer touch-manipulation`}
                  aria-label="Minimize billing tray"
                  title="Minimize"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={(e) => void handleClose(e)}
                  className={`p-1.5 rounded-md ${colors.bg.hover} ${colors.text.secondary} cursor-pointer touch-manipulation`}
                  aria-label="Close billing tray"
                  title="Close billing"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-gray-300 dark:border-gray-700">
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

            <div className="flex items-center gap-2 flex-shrink-0 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
              {steps.map((step, index) => {
                const isActive = currentStep === step.key;
                const isCompleted =
                  (step.key === 'charge_entry' && currentStep === 'billing_summary') ||
                  (step.key === 'billing_summary' && currentStep === 'billing_summary');
                const StepIcon = step.icon;

                return (
                  <React.Fragment key={step.key}>
                    <button
                      type="button"
                      onClick={() => handleSetStep(step.key)}
                      disabled={status === 'settled' && step.key === 'charge_entry'}
                      className={`
                        flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-md
                        transition-colors whitespace-nowrap touch-manipulation
                        ${
                          status === 'settled' && step.key === 'charge_entry'
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        }
                        ${
                          isActive
                            ? `${colors.accent.primary} ${colors.accent.text}`
                            : `bg-transparent ${colors.text.secondary} ${colors.bg.hover}`
                        }
                      `}
                    >
                      <StepIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="text-xs font-medium hidden sm:inline">{step.label}</span>
                      <span className="text-xs font-medium sm:hidden">{step.label.charAt(0)}</span>
                      <span className="text-xs opacity-80 hidden sm:inline">({index + 1})</span>
                      {isCompleted && !isActive && (
                        <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600 dark:text-green-500 ml-0.5" />
                      )}
                    </button>

                    {index < steps.length - 1 && (
                      <div className="w-2 h-px bg-gray-300 dark:bg-gray-700 mx-0.5" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <div className="relative group">
                <div
                  className={`px-2 py-1 rounded-md text-xs font-medium select-none whitespace-nowrap flex items-center gap-1.5 ${statusConfig.bg}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                </div>

                <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50">
                  <div
                    className={`px-3 py-2 rounded-lg shadow-lg ${colors.bg.secondary} border ${colors.border.primary} max-w-xs`}
                  >
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className={`text-xs ${colors.text.secondary}`}>
                        {statusConfig.message}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleMinimize}
                className={`p-1.5 rounded-md ${colors.bg.hover} ${colors.text.secondary} cursor-pointer flex-shrink-0 transition-colors touch-manipulation`}
                aria-label="Minimize billing tray"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={(e) => void handleClose(e)}
                className={`p-1.5 rounded-md ${colors.bg.hover} ${colors.text.secondary} cursor-pointer flex-shrink-0 touch-manipulation`}
                aria-label="Close billing tray"
                title="Close billing"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <VisitCompletedGuard theme={theme}>
              {currentStep === 'charge_entry' ? (
                <ChargeEntryStep theme={theme} />
              ) : (
                <BillingSummaryStep theme={theme} />
              )}
            </VisitCompletedGuard>
          </div>

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
};

BillingTray.displayName = 'BillingTray';
export default BillingTray;
