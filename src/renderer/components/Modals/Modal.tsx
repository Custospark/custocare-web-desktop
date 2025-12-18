import React, { useEffect, useState, useCallback, useRef } from 'react';
import { IoClose } from 'react-icons/io5';
import { createPortal } from 'react-dom';

export type ModalSize = 'xs' | 'small' | 'medium' | 'large' | 'xl' | 'full';
export type ModalVariant = 'default' | 'critical' | 'success' | 'warning' | 'info';
export type ModalFocusLevel = 'high' | 'medium' | 'low';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  variant?: ModalVariant;
  showCloseIcon?: boolean;
  closeOnBackdropClick?: boolean;
  className?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  focusLevel?: ModalFocusLevel;
  disableEscape?: boolean;
  disableScrollLock?: boolean;
  autoFocus?: boolean;
  onAfterOpen?: () => void;
  onAfterClose?: () => void;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'medium',
  variant = 'default',
  showCloseIcon = true,
  closeOnBackdropClick = true,
  className = '',
  icon,
  isLoading = false,
  focusLevel = 'high',
  disableEscape = false,
  disableScrollLock = false,
  autoFocus = true,
  onAfterOpen,
  onAfterClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const openTimeRef = useRef<number>(0);

  // Track all focusable elements in the modal
  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return [];
    return Array.from(
      modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];
  }, []);

  // Focus trap logic
  const handleFocusTrap = useCallback((e: KeyboardEvent) => {
    if (!modalRef.current || !isVisible) return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [isVisible, getFocusableElements]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (!disableScrollLock) {
      document.body.style.overflow = 'unset';
    }
    
    // Restore previous focus if enough time has passed
    if (previousActiveElement.current && Date.now() - openTimeRef.current > 100) {
      previousActiveElement.current.focus();
    }
    previousActiveElement.current = null;
    
    onAfterClose?.();
  }, [disableScrollLock, onAfterClose]);

  // Handle ESC key press
  useEffect(() => {
    if (disableEscape) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape, true);
    return () => window.removeEventListener('keydown', handleEscape, true);
  }, [isOpen, onClose, disableEscape]);

  // Handle focus trap
  useEffect(() => {
    if (isVisible) {
      document.addEventListener('keydown', handleFocusTrap);
      return () => document.removeEventListener('keydown', handleFocusTrap);
    }
  }, [isVisible, handleFocusTrap]);

  // Handle open/close transitions
  useEffect(() => {
    if (isOpen) {
      // Store current active element
      previousActiveElement.current = document.activeElement as HTMLElement;
      openTimeRef.current = Date.now();
      
      // Prevent body scrolling
      if (!disableScrollLock) {
        document.body.style.overflow = 'hidden';
      }

      // Block pointer events on body content
      document.body.style.pointerEvents = 'none';

      // Schedule visibility update
      animationFrameRef.current = requestAnimationFrame(() => {
        setIsVisible(true);
        
        // Schedule animation start
        timeoutRef.current = setTimeout(() => {
          setIsAnimating(true);
          
          // Focus first focusable element after animation
          if (autoFocus) {
            timeoutRef.current = setTimeout(() => {
              const focusableElements = getFocusableElements();
              if (focusableElements.length > 0) {
                focusableElements[0].focus();
              }
            }, 50);
          }
          
          onAfterOpen?.();
        }, 16);
      });
    } else {
      // Restore pointer events
      document.body.style.pointerEvents = 'auto';

      // Start closing animation
    //   setIsAnimating(false);
      
      // Wait for animation to complete before hiding
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        cleanup();
      }, 300);
    }

    return cleanup;
  }, [isOpen, cleanup, disableScrollLock, autoFocus, getFocusableElements, onAfterOpen]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  }, [closeOnBackdropClick, onClose]);

  // Don't render anything if not visible
  if (!isVisible) return null;

  const sizeClasses = {
    xs: 'max-w-xs w-full',
    small: 'max-w-sm w-full',
    medium: 'max-w-md w-full',
    large: 'max-w-lg w-full',
    xl: 'max-w-2xl w-full',
    full: 'w-full max-w-screen-md',
  };

  const variantClasses = {
    default: {
      bg: 'bg-neutral-white',
      border: 'border-neutral-gray-light',
      text: 'text-neutral-black',
      iconBg: 'bg-primary-light/20',
      iconColor: 'text-primary-DEFAULT',
    },
    critical: {
      bg: 'bg-critical-light',
      border: 'border-critical-light',
      text: 'text-critical-DEFAULT',
      iconBg: 'bg-critical-light/30',
      iconColor: 'text-critical-DEFAULT',
    },
    success: {
      bg: 'bg-success-light',
      border: 'border-success-light',
      text: 'text-success-DEFAULT',
      iconBg: 'bg-success-light/30',
      iconColor: 'text-success-DEFAULT',
    },
    warning: {
      bg: 'bg-warning-light',
      border: 'border-warning-light',
      text: 'text-warning-DEFAULT',
      iconBg: 'bg-warning-light/30',
      iconColor: 'text-warning-DEFAULT',
    },
    info: {
      bg: 'bg-primary-light',
      border: 'border-primary-light',
      text: 'text-primary-DEFAULT',
      iconBg: 'bg-primary-light/30',
      iconColor: 'text-primary-DEFAULT',
    },
  };

  const focusLevelClasses = {
    high: 'bg-neutral-black/85 backdrop-blur-md',
    medium: 'bg-neutral-black/75 backdrop-blur-sm',
    low: 'bg-neutral-black/65',
  };

  const modalContent = (
    <>
      {/* High-contrast backdrop that blocks everything */}
      <div
        className={`fixed inset-0 z-[9999] transition-opacity duration-300 ${focusLevelClasses[focusLevel]} ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
        aria-hidden="true"
        style={{
          pointerEvents: 'auto', // Ensure backdrop captures clicks
        }}
      />

      {/* Modal Container - Forces focus */}
      <div
        className={`fixed inset-0 z-[10000] flex items-center justify-center p-4`}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={subtitle ? 'modal-description' : undefined}
        style={{
          pointerEvents: 'auto', // Ensure modal captures clicks
        }}
      >
        {/* Modal Content */}
        <div
          ref={modalRef}
          className={`
            rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)]
            transition-all duration-300 ease-out
            ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
            ${sizeClasses[size]}
            ${variantClasses[variant].bg}
            border ${variantClasses[variant].border}
            ${className}
            relative
            max-h-[90vh] // Prevent modal from being too tall
          `}
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: 'auto', // Ensure content captures clicks
          }}
        >
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-primary-light/30 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary-DEFAULT rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-body text-primary-DEFAULT font-medium">Processing...</p>
              </div>
            </div>
          )}

          {/* Header - Sticky */}
          {(title || icon || showCloseIcon) && (
            <div className={`
              sticky top-0 z-20 p-6 border-b ${variantClasses[variant].border}
              ${variantClasses[variant].bg}
              rounded-t-xl
            `}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {icon && (
                    <div className={`p-2 rounded-lg ${variantClasses[variant].iconBg}`}>
                      <div className={variantClasses[variant].iconColor}>
                        {icon}
                      </div>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {title && (
                      <h3
                        id="modal-title"
                        className={`text-h3 font-bold truncate ${variantClasses[variant].text}`}
                      >
                        {title}
                      </h3>
                    )}
                    {subtitle && (
                      <p
                        id="modal-description"
                        className="text-body text-neutral-gray-medium mt-1 truncate"
                      >
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
                {showCloseIcon && (
                  <button
                    onClick={onClose}
                    className={`
                      ml-4 flex-shrink-0 p-2 rounded-lg
                      text-neutral-gray-medium hover:text-critical-DEFAULT
                      hover:bg-critical-light/20
                      active:scale-95
                      transition-all duration-150
                      focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT
                      focus:ring-offset-2
                    `}
                    aria-label="Close modal"
                    tabIndex={0}
                  >
                    <IoClose className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Body - Scrollable but contained */}
          <div className={`
            p-6 overflow-y-auto
            ${!title && !icon && !showCloseIcon ? 'pt-8' : ''}
            ${footer ? 'pb-4' : 'pb-8'}
            max-h-[calc(90vh-140px)] // Ensure body doesn't overflow viewport
          `}>
            <div className="space-y-4">
              {children}
            </div>
          </div>

          {/* Footer - Sticky */}
          {footer && (
            <div className={`
              sticky bottom-0 z-10 p-6 border-t ${variantClasses[variant].border}
              ${variantClasses[variant].bg}
              rounded-b-xl
            `}>
              <div className="flex justify-end space-x-3">
                {footer}
              </div>
            </div>
          )}

          {/* Focus indicator for keyboard users */}
          <div className="sr-only" aria-live="polite">
            {isOpen ? 'Modal opened. Use Tab to navigate, Escape to close.' : 'Modal closed.'}
          </div>
        </div>
      </div>
    </>
  );

  // Use portal to render at root level to ensure proper blocking
  return createPortal(modalContent, document.body);
};

export default Modal;