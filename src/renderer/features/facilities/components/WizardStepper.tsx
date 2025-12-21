// import React from 'react';
// import { useSelector } from 'react-redux';
// import type { RootState } from '../../../store/index';
// import {
//   Save,
//   CheckCircle,
//   ChevronRight
// } from 'lucide-react';
// import { cn } from '../../../utils/classNameUtils';
// import { WizardStepProps } from '../types/onboarding';

// const WizardStepper: React.FC<WizardStepProps> = ({
//   currentStep,
//   totalSteps,
//   onNext,
//   onBack,
//   onSaveDraft,
//   onSubmit
// }) => {
//   const theme = useSelector((state: RootState) => state.ui.theme);
  
//   return (
//     <div className={cn(
//       'sticky top-0 z-10 py-4 px-6 border-b backdrop-blur-lg',
//       theme === 'dark' 
//         ? 'bg-gray-900/80 border-gray-800/40' 
//         : 'bg-white/80 border-gray-200/50'
//     )}>
//       <div className="flex items-center justify-between">
//         {/* Progress */}
//         <div className="flex items-center gap-4">
//           <div className="flex items-center gap-2">
//             {Array.from({ length: totalSteps }).map((_, index) => (
//               <div
//                 key={index}
//                 className={cn(
//                   'w-8 h-1.5 rounded-full transition-all duration-300',
//                   index < currentStep 
//                     ? theme === 'dark' ? 'bg-cyan-500' : 'bg-blue-500'
//                     : index === currentStep
//                     ? theme === 'dark' ? 'bg-cyan-400' : 'bg-blue-400'
//                     : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
//                 )}
//               />
//             ))}
//           </div>
//           <span className={cn(
//             'text-sm font-medium',
//             theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
//           )}>
//             Step {currentStep + 1} of {totalSteps}
//           </span>
//         </div>
        
//         {/* Actions */}
//         <div className="flex items-center gap-3">
//           <button
//             type="button"
//             onClick={onSaveDraft}
//             className={cn(
//               'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
//               'flex items-center gap-2',
//               theme === 'dark'
//                 ? 'text-gray-300 hover:text-white hover:bg-gray-800'
//                 : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
//             )}
//           >
//             <Save className="w-4 h-4" />
//             Save Draft
//           </button>
          
//           {currentStep > 0 && (
//             <button
//               type="button"
//               onClick={onBack}
//               className={cn(
//                 'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
//                 theme === 'dark'
//                   ? 'text-gray-300 hover:text-white hover:bg-gray-800'
//                   : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
//               )}
//             >
//               Back
//             </button>
//           )}
          
//           {currentStep < totalSteps - 1 ? (
//             <button
//               type="button"
//               onClick={onNext}
//               className={cn(
//                 'px-6 py-2 rounded-lg text-sm font-medium transition-all',
//                 'flex items-center gap-2',
//                 theme === 'dark'
//                   ? 'bg-cyan-600 text-white hover:bg-cyan-500'
//                   : 'bg-blue-600 text-white hover:bg-blue-500'
//               )}
//             >
//               Next
//               <ChevronRight className="w-4 h-4" />
//             </button>
//           ) : (
//             <button
//               type="button"
//               onClick={onSubmit}
//               className={cn(
//                 'px-6 py-2 rounded-lg text-sm font-medium transition-all',
//                 'flex items-center gap-2',
//                 theme === 'dark'
//                   ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500'
//                   : 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500'
//               )}
//             >
//               <CheckCircle className="w-4 h-4" />
//               Complete Setup
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default WizardStepper;