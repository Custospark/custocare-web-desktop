import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import {
  Save,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
import { WizardStepProps } from '../types/onboarding';

const WizardStepper: React.FC<WizardStepProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onSaveDraft,
  onSubmit
}) => {
  const theme = useSelector((state: RootState) => state.ui.theme);
  
  return (
    <div className={cn(
      'sticky top-0 z-40 py-3 px-4 md:px-6 border-b backdrop-blur-xl transition-all duration-300',
      'shadow-sm',
      theme === 'dark' 
        ? 'bg-gray-900/95 border-gray-800/60 shadow-gray-900/20' 
        : 'bg-white/95 border-gray-200/70 shadow-gray-200/30'
    )}>
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-0 max-w-full">
        {/* Progress Section - Left */}
        <div className="flex items-center justify-between md:justify-start gap-4 md:gap-6 md:w-1/2">
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-3 h-3 md:w-10 md:h-1.5 rounded-full transition-all duration-500',
                    'transform hover:scale-110',
                    index < currentStep 
                      ? theme === 'dark' 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-cyan-500/20' 
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-500/20'
                      : index === currentStep
                      ? theme === 'dark'
                        ? 'bg-cyan-400 shadow-lg shadow-cyan-400/30 ring-2 ring-cyan-400/30'
                        : 'bg-blue-400 shadow-lg shadow-blue-400/30 ring-2 ring-blue-400/30'
                      : theme === 'dark'
                      ? 'bg-gray-700/50 hover:bg-gray-600/50'
                      : 'bg-gray-300/50 hover:bg-gray-400/50'
                  )}
                />
              ))}
            </div>
            
            {/* Mobile Progress Dots */}
            <div className="flex sm:hidden items-center gap-1">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-300',
                    index === currentStep
                      ? theme === 'dark' ? 'bg-cyan-400 w-4' : 'bg-blue-400 w-4'
                      : index < currentStep
                      ? theme === 'dark' ? 'bg-cyan-600' : 'bg-blue-600'
                      : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                  )}
                />
              ))}
            </div>
            
            {/* Step Counter */}
            <div className="flex flex-col">
              <span className={cn(
                'text-xs md:text-sm font-semibold',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}>
                Step {currentStep + 1} of {totalSteps}
              </span>
              <span className={cn(
                'text-xs hidden md:block',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}>
                {currentStep === totalSteps - 1 ? 'Final step' : `${totalSteps - currentStep - 1} steps remaining`}
              </span>
            </div>
          </div>
          
          {/* Mobile Save Button */}
          <button
            type="button"
            onClick={onSaveDraft}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            aria-label="Save draft"
          >
            <Save className={cn(
              'w-3.5 h-3.5',
              theme === 'dark' ? 'text-cyan-400' : 'text-blue-500'
            )} />
            <span className="text-xs">Save</span>
          </button>
        </div>
        
        {/* Actions Section - Right with proper margin */}
        <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3 md:w-1/2 md:pr-10">
          {/* Save Draft Button - Desktop */}
          <button
            type="button"
            onClick={onSaveDraft}
            className={cn(
              'hidden md:flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
              'hover:scale-[1.02] active:scale-[0.98]',
              theme === 'dark'
                ? 'text-gray-300 hover:text-white bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 hover:border-cyan-500/30'
                : 'text-gray-700 hover:text-gray-900 bg-gray-100/80 hover:bg-gray-200 border border-gray-300/50 hover:border-blue-500/30'
            )}
          >
            <Save className="w-4 h-4" />
            <span className="text-sm">Save Draft</span>
          </button>
          
          {/* Navigation Buttons Container */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Back Button */}
            {currentStep > 0 && (
              <button
                type="button"
                onClick={onBack}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
                  'hover:scale-[1.02] active:scale-[0.98]',
                  theme === 'dark'
                    ? 'text-gray-300 hover:text-white bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600'
                    : 'text-gray-700 hover:text-gray-900 bg-gray-100/80 hover:bg-gray-200 border border-gray-300/50 hover:border-gray-400'
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            
            {/* Next/Complete Button */}
            {currentStep < totalSteps - 1 ? (
              <button
                type="button"
                onClick={onNext}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300',
                  'hover:scale-[1.02] active:scale-[0.98] shadow-sm',
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/20'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 shadow-blue-500/20'
                )}
              >
                <span className="text-sm">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300',
                  'hover:scale-[1.02] active:scale-[0.98] shadow-sm',
                  'bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-500 text-white',
                  'hover:from-emerald-500 hover:via-green-400 hover:to-emerald-400',
                  'shadow-emerald-500/20'
                )}
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">Complete</span>
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress Bar - Shows on mobile */}
      <div className="mt-3 md:hidden">
        <div className={cn(
          'h-1.5 rounded-full overflow-hidden',
          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
        )}>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              theme === 'dark' 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-500'
            )}
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Step Titles for Mobile */}
      <div className="mt-2 md:hidden">
        <div className="flex items-center justify-between">
          <span className={cn(
            'text-xs font-medium truncate',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            {currentStep === 0 ? 'Facility Details' :
             currentStep === 1 ? 'Location & Contact' :
             currentStep === 2 ? 'License Verification' :
             'Review & Confirm'}
          </span>
          <span className={cn(
            'text-xs font-semibold',
            theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
          )}>
            {Math.round(((currentStep + 1) / totalSteps) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default WizardStepper;