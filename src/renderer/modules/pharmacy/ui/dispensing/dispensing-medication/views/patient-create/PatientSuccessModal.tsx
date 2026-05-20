import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import {
  CheckCircle,
  ChevronRight,
  Copy,
  Fingerprint,
  Printer,
  Shield,
  User,
  UserCheck,
  X,
} from 'lucide-react';

import { useSelector } from 'react-redux';
import { cn } from '../../../../../../../shared/utils/classNameUtils';
import { useToast } from '../../../../../../../app/store/contexts/toast/useToast';
import { PatientRegistrationPrintout } from '../../../../../../../shared/components/Printout/PatientRegistrationPrintout';
import { selectActiveFacility } from '../../../../../../../app/store/slices/activeContextSlice';
import { selectUserDisplayName } from '../../../../../../../app/store/slices/authSlice';

export interface PatientSuccessModalProps {
  theme: 'light' | 'dark';
  patientNumber: string;
  patientName: string;
  onProceed?: () => void;
  onClose?: () => void;
  isNewPatient?: boolean;
}

const PatientSuccessModal: React.FC<PatientSuccessModalProps> = ({
  theme,
  patientNumber,
  patientName,
  onProceed,
  onClose,
  isNewPatient = true,
}) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);
  const printoutRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printoutRef,
    documentTitle: `Patient_${patientNumber}`,
  });

  const activeFacility = useSelector(selectActiveFacility);
  const staffName = useSelector(selectUserDisplayName);

  const facility = activeFacility && activeFacility.facility_name
    ? {
        name: activeFacility.facility_name,
        code: activeFacility.facility_code || 'N/A',
        address: [
          activeFacility.address_line1,
          activeFacility.address_line2,
          activeFacility.city,
          activeFacility.state_province,
        ].filter(Boolean).join(', ') || 'Address not available',
        phone: activeFacility.main_phone || null,
        email: activeFacility.email || null,
      }
    : null;

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      if (!patientNumber) {
        showToast('error', 'No patient number to copy', 3000);
        return;
      }

      await navigator.clipboard.writeText(patientNumber);
      setCopied(true);
      showToast('success', 'Patient number copied', 3000);

      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }

      copyTimerRef.current = window.setTimeout(() => setCopied(false), 3000);
    } catch {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = patientNumber;
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (success) {
          setCopied(true);
          showToast('success', 'Patient number copied', 3000);

          if (copyTimerRef.current !== null) {
            window.clearTimeout(copyTimerRef.current);
          }

          copyTimerRef.current = window.setTimeout(() => setCopied(false), 3000);
        } else {
          showToast('error', 'Could not copy patient number', 3000);
        }
      } catch {
        showToast('error', 'Could not copy patient number', 3000);
      }
    }
  }, [patientNumber, showToast]);

  const handlePrintDownload = useCallback(() => {
    if (!patientNumber) {
      showToast('error', 'No patient data to print', 3000);
      return;
    }
    handlePrint();
  }, [patientNumber, handlePrint, showToast]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose?.();
      }
    },
    [onClose]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 "
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-success-modal-title"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className={cn(
          'relative w-full max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border-2 shadow-2xl sm:max-w-lg',
          isDark
            ? 'border-blue-500/30 bg-gradient-to-br from-gray-800 to-gray-900'
            : 'border-blue-200 bg-gradient-to-br from-white to-blue-50/50'
        )}
      >
        <div
          className={cn(
            'absolute right-0 top-0 h-56 w-56 rounded-full blur-3xl opacity-30',
            isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'
          )}
        />

        {onClose && (
         <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={onClose}
          className={cn(
            'absolute right-4 top-4 z-10 rounded-full p-2 transition-colors cursor-pointer',
            isDark
              ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          )}
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </motion.button>
        )}

        <div className="relative p-5 sm:p-8">
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.08, type: 'spring' }}
              className={cn(
                'mb-4 flex h-18 w-18 items-center justify-center rounded-2xl border-2 sm:h-20 sm:w-20',
                isNewPatient
                  ? isDark
                    ? 'border-green-500/30 bg-gradient-to-br from-green-500/20 to-green-600/20'
                    : 'border-green-300 bg-gradient-to-br from-green-100 to-green-200'
                  : isDark
                    ? 'border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-blue-600/20'
                    : 'border-blue-300 bg-gradient-to-br from-blue-100 to-blue-200'
              )}
            >
              {isNewPatient ? (
                <CheckCircle className={cn('h-9 w-9 sm:h-10 sm:w-10', isDark ? 'text-green-400' : 'text-green-600')} />
              ) : (
                <UserCheck className={cn('h-9 w-9 sm:h-10 sm:w-10', isDark ? 'text-blue-400' : 'text-blue-600')} />
              )}
            </motion.div>

            <motion.h2
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.16 }}
              id="patient-success-modal-title"
              className={cn(
                'mb-2 text-center text-xl font-bold sm:text-2xl',
                isDark ? 'text-white' : 'text-gray-900'
              )}
            >
            {isNewPatient ? '🎉 Patient registered successfully!' : '✓ Existing patient record found'}
            </motion.h2>

            <motion.p
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                'mb-6 text-center text-sm sm:text-base',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}
            >
                        {isNewPatient
            ? 'Great! The patient record has been saved and is ready for care.'
            : 'Perfect! A matching patient record was found and selected.'}
            </motion.p>

            <motion.div
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.24 }}
              className={cn(
                'relative mb-6 w-full overflow-hidden rounded-xl border-2 p-4 sm:p-6',
                isDark
                  ? 'border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800'
                  : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white'
              )}
            >
              <div
                className={cn(
                  'absolute right-0 top-0 h-20 w-20 rounded-full blur-2xl opacity-20',
                  isDark ? 'bg-blue-500' : 'bg-blue-400'
                )}
              />

              <div className="relative">
                <div className="mb-4 text-center">
                  <div
                    className={cn(
                      'mb-1 flex items-center justify-center gap-1 text-sm font-medium',
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    )}
                  >
                    <User className="h-4 w-4" />
                    Patient Name
                  </div>
                  <div
                    className={cn(
                      'break-words text-base font-semibold sm:text-lg',
                      isDark ? 'text-white' : 'text-gray-900'
                    )}
                    title={patientName}
                  >
                    {patientName}
                  </div>
                </div>

                <div className="text-center">
                  <div
                    className={cn(
                      'mb-2 flex items-center justify-center gap-1 text-sm font-medium',
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    )}
                  >
                    <Fingerprint className="h-4 w-4" />
                    Patient Number
                  </div>

                  <div
                    className={cn(
                      'cursor-text select-text break-all rounded-lg border-2 p-4 font-mono text-xs transition-all sm:text-sm',
                      isDark
                        ? 'border-blue-500/30 bg-gray-800 text-blue-300 hover:border-blue-500/50'
                        : 'border-blue-200 bg-white text-blue-600 hover:border-blue-300'
                    )}
                  >
                    {patientNumber}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.28 }}
              className="w-full space-y-3"
            >
             <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={handleCopy}
            disabled={!patientNumber}
            style={{ cursor: patientNumber ? 'pointer' : 'not-allowed' }}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50',
              copied
                ? isDark
                  ? 'border-green-500/30 bg-gradient-to-br from-green-600/20 to-green-700/20 text-green-300'
                  : 'border-green-300 bg-gradient-to-br from-green-50 to-green-100 text-green-700'
                : isDark
                  ? 'border-gray-600 bg-gradient-to-br from-gray-700 to-gray-800 text-gray-200 hover:border-gray-500 hover:cursor-pointer'
                  : 'border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:border-gray-400 hover:cursor-pointer'
            )}
          >
            {copied ? (
              <>
                <CheckCircle className="h-5 w-5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-5 w-5" />
                Copy
              </>
            )}
          </motion.button>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={handlePrintDownload}
              disabled={!patientNumber}
              style={{ cursor: patientNumber ? 'pointer' : 'not-allowed' }}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50',
                isDark
                  ? 'border-gray-600 bg-gradient-to-br from-gray-700 to-gray-800 text-gray-200 hover:border-gray-500 hover:cursor-pointer'
                  : 'border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:border-gray-400 hover:cursor-pointer'
              )}
            >
              <Printer className="h-5 w-5" />
              Print / Download
            </motion.button>
          </div>

              {onProceed && (
                <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={onProceed}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl border-2 py-3 font-medium transition-all cursor-pointer',
                  isDark
                    ? 'border-blue-500/50 bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/20'
                    : 'border-blue-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/20'
                )}
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </motion.button>
              )}
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.34 }}
              className={cn(
                'mt-4 flex items-center gap-1 text-center text-xs text-bold',
                isDark ? 'text-gray-500' : 'text-gray-500'
              )}
            >
              <Shield className="h-3 w-3" />
              Please share the patient number with the patient for future visits.
            </motion.p>
          </div>
        </div>

        <div className="hidden">
          <PatientRegistrationPrintout
            ref={printoutRef}
            patientName={patientName}
            patientNumber={patientNumber}
            facility={facility}
            registeredByName={staffName || undefined}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

PatientSuccessModal.displayName = 'PatientSuccessModal';

export default PatientSuccessModal;
