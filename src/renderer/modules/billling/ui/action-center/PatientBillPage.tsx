import React from 'react';
import { useSelector } from 'react-redux';
import { selectTheme } from '../../../../app/store/slices/uiSlice';
import { selectActiveVisitId } from '../../../../app/store/slices/visitSlice';
import { PatientBill } from '../../../../shared/components/PatientBill';

export const PatientBillPage: React.FC = () => {
  const theme = useSelector(selectTheme);
  const visitId = useSelector(selectActiveVisitId);

  if (!visitId) {
    return (
      <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        <p className="text-sm">No active visit selected.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <PatientBill visitId={visitId} theme={theme} />
    </div>
  );
};

export default PatientBillPage;
