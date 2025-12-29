import React, { useEffect } from 'react';
import { FaExclamationCircle } from 'react-icons/fa';
import Button from '../Buttons/Button';

interface CriticalAlertModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

/**
 * CriticalAlertModal Component
 * 
 * Full-screen critical alert for severe warnings (allergies, critical actions)
 * Cannot be dismissed by clicking backdrop
 * 
 * Usage:
 * <CriticalAlertModal 
 *   isOpen={showAllergyAlert}
 *   title="CRITICAL ALLERGY WARNING"
 *   message="Patient has severe penicillin allergy. Prescribing this medication may cause anaphylaxis."
 *   confirmText="I Understand - Override"
 *   cancelText="Cancel Prescription"
 *   onConfirm={handleOverride}
 *   onCancel={handleCancel}
 * />
 */
const CriticalAlertModal: React.FC<CriticalAlertModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'I Understand',
  cancelText = 'Go Back',
  showCancel = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-24 bg-gradient-to-br from-critical-light to-red-100 animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="critical-alert-title"
      aria-describedby="critical-alert-message"
    >
      <div className="bg-neutral-white rounded-xl shadow-modal max-w-2xl w-full p-48 text-center">
        {/* Critical Icon */}
        <div className="flex justify-center mb-24">
          <div className="w-96 h-96 rounded-full bg-critical-light flex items-center justify-center">
            <FaExclamationCircle className="w-64 h-64 text-critical animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h2 
          id="critical-alert-title"
          className="text-h2 font-bold text-critical mb-16 uppercase tracking-wide"
        >
          {title}
        </h2>

        {/* Message */}
        <div 
          id="critical-alert-message"
          className="text-body-lg text-neutral-black mb-32 leading-relaxed"
        >
          {message}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-16">
          {showCancel && onCancel && (
            <Button 
              variant="secondary" 
              size="large"
              onClick={onCancel}
              className="min-w-[160px]"
            >
              {cancelText}
            </Button>
          )}
          <Button 
            variant="danger" 
            size="large"
            onClick={onConfirm}
            className="min-w-[160px]"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CriticalAlertModal;