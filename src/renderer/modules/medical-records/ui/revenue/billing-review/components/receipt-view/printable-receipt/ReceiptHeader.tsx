// ReceiptHeader.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import { MapPin, Phone, Mail } from 'lucide-react';
import { useGetFacilityIdentity } from '../../../../../../api/facility/FacilityQueries';
import { 
  getOperationalStatusColor, 
  getFacilityTypeDisplayName,
  OperationalStatus,
  FacilityType,
} from '../../../../../../api/facility/FacilityTypes';
import LoadingSkeleton from '../../../../../../../../shared/components/Loading/LoadingSkeletons';
import { cx } from './ReceiptTypes';
import type { RootState } from  '../../../../../../../../app/store/rootReducer';
import { formatText } from '../../../../stats/billing-revenue-stats-component/revenueDashboardUtils';

export const ReceiptHeader: React.FC = () => {
  // First, try to get facility data from Redux slice
  const activeFacilityId = useSelector((state: RootState) => state.activeContext.activeFacilityId);
  const activeFacility = useSelector((state: RootState) => {
    const staffCapability = state.activeContext.capabilities.staff;
    if (!staffCapability || !activeFacilityId) return null;
    return staffCapability.facilities.find(f => f.facility_id === activeFacilityId);
  });

  // Only fetch if Redux slice doesn't have the facility data
  const shouldFetch = !activeFacility || !activeFacility.facility_name;
  const { data, isLoading, error } = useGetFacilityIdentity({ 
    enabled: shouldFetch 
  });

  // If we have data in Redux, use it
  if (activeFacility && activeFacility.facility_name) {
    const statusColors = getOperationalStatusColor(activeFacility.operational_status || OperationalStatus.FULLY_OPERATIONAL);
    
    const getAddressString = (): string => {
      const parts = [
        activeFacility.state_province,
        activeFacility.city,
        activeFacility.address_line1,
        activeFacility.address_line2,
      ].filter(Boolean);
      
      return parts.length > 0 ? parts.join(', ') : 'Address not available';
    };

    return (
      <div className="text-center mb-5 relative">
        <h2 className="text-2xl font-black bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
          {activeFacility.facility_name.toUpperCase()}
        </h2>
        
     
        
        <div className="flex items-center justify-center gap-2 mt-1.5">
          <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium">
            {getFacilityTypeDisplayName(activeFacility.facility_type || FacilityType.HOSPITAL)}
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full font-medium capitalize">
            {activeFacility.facility_tier || 'primary'}
          </span>
          <span className={cx(
            'text-[10px] px-2 py-0.5 rounded-full font-medium',
            statusColors.bg,
            statusColors.text
          )}>
            {formatText(activeFacility.operational_status || 'fully_operational')}
          </span>
        </div>
        
        <p className="text-xs text-gray-600 mt-2 flex items-center justify-center gap-1">
          <MapPin className="w-3 h-3 inline shrink-0" />
          {getAddressString()}
        </p>
        
        <div className="flex items-center justify-center gap-3 mt-1 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {activeFacility.main_phone || 'N/A'}
          </span>
          {activeFacility.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {activeFacility.email}
            </span>
          )}
        </div>

        <p className="text-[9px] text-gray-400 mt-2">
          Facility Number:   {activeFacility.facility_code || "N/A"}
        </p>
      </div>
    );
  }

  // Fallback to fetching if Redux slice is empty
  if (isLoading) {
    return (
      <div className="text-center mb-5 relative">
        <LoadingSkeleton variant="minimal" message="Loading facility info..." />
      </div>
    );
  }

  if (error || !data?.data?.facility) {
    return (
      <div className="text-center mb-5 relative">
        <h2 className="text-2xl font-black bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
          MEDICAL FACILITY
        </h2>
      </div>
    );
  }

  const facility = data.data.facility;
  const statusColors = getOperationalStatusColor(facility.status);
  
  const getAddressString = (): string => {
    if (!facility.address) return 'Address not available';
    
    if (typeof facility.address === 'string') return facility.address;
    
    if (typeof facility.address === 'object' && facility.address !== null) {
      if ('formatted' in facility.address && facility.address.formatted) {
        return facility.address.formatted;
      }
      
      const addr = facility.address as any;
      const parts = [
        addr.street,
        addr.city,
        addr.state,
        addr.country
      ].filter(Boolean);
      
      if (parts.length > 0) return parts.join(', ');
    }
    
    return 'Address not available';
  };

  return (
    <div className="text-center mb-5 relative">
      <h2 className="text-2xl font-black bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
        {facility.name.toUpperCase()}
      </h2>
      
      {facility.legal_name !== facility.name && (
        <p className="text-[10px] text-gray-500 mt-0.5">
          {facility.legal_name}
        </p>
      )}
      
      <div className="flex items-center justify-center gap-2 mt-1.5">
        <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium">
          {getFacilityTypeDisplayName(facility.type)}
        </span>
        <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full font-medium capitalize">
          {facility.tier}
        </span>
        <span className={cx(
          'text-[10px] px-2 py-0.5 rounded-full font-medium',
          statusColors.bg,
          statusColors.text
        )}>
          {facility.status.replace(/_/g, ' ')}
        </span>
      </div>
      
      <p className="text-xs text-gray-600 mt-2 flex items-center justify-center gap-1">
        <MapPin className="w-3 h-3 inline shrink-0" />
        {getAddressString()}
      </p>
      
      <div className="flex items-center justify-center gap-3 mt-1 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <Phone className="w-3 h-3" />
          {facility.phone || 'N/A'}
        </span>
        {facility.email && (
          <span className="flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {facility.email}
          </span>
        )}
      </div>

      <p className="text-[9px] text-gray-400 mt-2">
        Facility Number: {facility.code || 'N/A'}
      </p>
    </div>
  );
};