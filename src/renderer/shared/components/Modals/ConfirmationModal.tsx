import React from 'react';
import {  FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import Modal from './Modal';
import Button from '../Buttons/Button';

type ConfirmationType = 'info' | 'warning' | 'danger';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  type?: ConfirmationType;
  confirmText?: string;
  cancelText?: string;
  confirmLoading?: boolean;
}

/**
 * ConfirmationModal Component
 * 
 * Standard confirmation dialog for user actions
 * 
 * Usage:
 * <ConfirmationModal 
 *   isOpen={showConfirm}
 *   type="danger"
 *   title="Delete Patient Record"
 *   message="Are you sure you want to delete this patient record? This action cannot be undone."
 *   confirmText="Yes, Delete"
 *   cancelText="Cancel"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowConfirm(false)}
 * />
 */
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmLoading = false,
}) => {
  const typeConfig = {
    info: {
      icon: FaInfoCircle,
      iconColor: 'text-primary',
      iconBg: 'bg-primary-light',
      buttonVariant: 'primary' as const,
    },
    warning: {
      icon: FaExclamationTriangle,
      iconColor: 'text-warning',
      iconBg: 'bg-warning-light',
      buttonVariant: 'warning' as const,
    },
    danger: {
      icon: FaExclamationTriangle,
      iconColor: 'text-critical',
      iconBg: 'bg-critical-light',
      buttonVariant: 'danger' as const,
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="small"
      closeOnBackdropClick={false}
    //   showCloseButton={false}
    >
      <div className="text-center">
        {/* Icon */}
        <div className="flex justify-center mb-24">
          <div className={`w-64 h-64 rounded-full ${config.iconBg} flex items-center justify-center`}>
            <Icon className={`w-32 h-32 ${config.iconColor}`} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-h3 font-semibold text-neutral-black mb-12">
          {title}
        </h3>

        {/* Message */}
        <p className="text-body text-neutral-gray-dark mb-32 leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-12">
          <Button 
            variant="secondary" 
            onClick={onCancel}
            disabled={confirmLoading}
          >
            {cancelText}
          </Button>
          <Button 
            variant={config.buttonVariant}
            onClick={onConfirm}
            loading={confirmLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;