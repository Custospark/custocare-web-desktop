import React from 'react';
import { FaUser, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import { PatientName, PatientID } from '../Typography/SpecializedText';
import Badge from '../Badges/Badge';

interface PatientCardProps {
  patientName: string;
  patientId: string;
  age?: number;
  gender?: string;
  status?: 'active' | 'inactive' | 'critical';
  lastVisit?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Modern PatientCard Component
 * 
 * Usage:
 * <PatientCard 
 *   patientName="John Doe"
 *   patientId="UG-2025-AB12345"
 *   age={45}
 *   gender="Male"
 *   status="active"
 *   lastVisit="2025-12-15"
 *   onClick={handleViewPatient}
 * />
 */
const PatientCard: React.FC<PatientCardProps> = ({
  patientName,
  patientId,
  age,
  gender,
  status = 'active',
  lastVisit,
  onClick,
  className = ''
}) => {
  const statusConfig = {
    active: { variant: 'success' as const, label: 'Active', icon: FaCheckCircle },
    inactive: { variant: 'gray' as const, label: 'Inactive', icon: FaUser },
    critical: { variant: 'critical' as const, label: 'Critical', icon: FaExclamationCircle },
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <button
      onClick={onClick}
      className={`w-full bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 p-6 text-left flex items-start gap-4 ${className}`}
    >
      {/* Avatar with status ring */}
      <div className={`relative flex-shrink-0`}>
        <div className={`w-16 h-16 rounded-full bg-primary-light flex items-center justify-center border-4 ${
          status === 'active' ? 'border-green-500' :
          status === 'critical' ? 'border-red-500' :
          'border-gray-400'
        }`}>
          <FaUser className="w-8 h-8 text-primary" />
        </div>
        <div className="absolute -bottom-1 -right-1">
          <StatusIcon className={`w-5 h-5 ${status === 'active' ? 'text-green-500' : status === 'critical' ? 'text-red-500' : 'text-gray-500'}`} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <PatientName className="text-lg font-semibold truncate">
            {patientName}
          </PatientName>
          <Badge variant={statusConfig[status].variant} size="small">
            {statusConfig[status].label}
          </Badge>
        </div>
        <PatientID className="text-sm text-gray-500 truncate">{patientId}</PatientID>

        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
          {age && <span>{age} yrs</span>}
          {age && gender && <span>•</span>}
          {gender && <span>{gender}</span>}
        </div>

        {lastVisit && (
          <div className="mt-2 text-sm text-gray-400">
            Last visit: {lastVisit}
          </div>
        )}
      </div>
    </button>
  );
};

export default PatientCard;
