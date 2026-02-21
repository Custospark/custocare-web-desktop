// AttendingStaffDisplay.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Stethoscope } from 'lucide-react';
import type { RootState } from '../../../../../../../../app/store/rootReducer';
import { 
  getUserFullName, 
  getActiveRoleCode,
  isInStaffMode
} from '../../../../../../../../app/store/utils/contextSelectors';
import type { ReceiptTransactionShape } from './ReceiptTypes';

interface AttendingStaffDisplayProps {
  selectedTransaction: ReceiptTransactionShape;
}

const AttendingStaffDisplay: React.FC<AttendingStaffDisplayProps> = ({ selectedTransaction }) => {
  const backendDisplay = selectedTransaction?.attending_staff_display;
  const backendName = selectedTransaction?.attending_staff_name;
  const backendRole = selectedTransaction?.attending_staff_role;
  
  const isStaff = useSelector((state: RootState) => isInStaffMode(state));
  const contextStaffName = useSelector((state: RootState) => getUserFullName(state));
  const contextRoleCode = useSelector((state: RootState) => getActiveRoleCode(state));
  
  const formatRole = (role: string): string => {
    if (!role) return '';
    return role
      .replace(/[_\-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const renderNameWithRole = (name: string, role: string | null | undefined) => {
    const formattedRole = role ? formatRole(role) : '';
    return (
      <span className="font-bold text-gray-800">
        {name} {formattedRole && <span className="text-blue-500 font-semibold">({formattedRole})</span>}
      </span>
    );
  };

  if (backendDisplay) {
    const openParen = backendDisplay.lastIndexOf('(');
    const closeParen = backendDisplay.lastIndexOf(')');
    
    if (openParen > 0 && closeParen > openParen) {
      const namePart = backendDisplay.substring(0, openParen).trim();
      const rolePart = backendDisplay.substring(openParen + 1, closeParen).trim();
      
      return (
        <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-gray-200">
          <span className="text-gray-600 font-semibold flex items-center gap-1">
            <Stethoscope className="w-3 h-3" /> Attending Staff:
          </span>
          {renderNameWithRole(namePart, rolePart)}
        </div>
      );
    }
    
    return (
      <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-gray-200">
        <span className="text-gray-600 font-semibold flex items-center gap-1">
          <Stethoscope className="w-3 h-3" /> Attending Staff:
        </span>
        <span className="font-bold text-gray-800">{backendDisplay}</span>
      </div>
    );
  }

  if (backendName) {
    return (
      <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-gray-200">
        <span className="text-gray-600 font-semibold flex items-center gap-1">
          <Stethoscope className="w-3 h-3" /> Attending Staff:
        </span>
        {renderNameWithRole(backendName, backendRole)}
      </div>
    );
  }

  if (isStaff && contextStaffName && contextStaffName !== 'Guest') {
    return (
      <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-gray-200">
        <span className="text-gray-600 font-semibold flex items-center gap-1">
          <Stethoscope className="w-3 h-3" /> Attending Staff:
        </span>
        {renderNameWithRole(contextStaffName, contextRoleCode)}
      </div>
    );
  }

  return null;
};

export default AttendingStaffDisplay;