// ReceiptFooter.tsx
import React from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { lightThemeLogo } from '../../../../../../../../shared/assets/logoConstants';
import { useGetFacilityIdentity } from '../../../../../../api/facility/FacilityQueries';

export const PrintableReceiptFooter: React.FC = () => {
  const { data } = useGetFacilityIdentity();
  const facilityName = data?.data?.facility?.name;
  const logo = lightThemeLogo;

  return (
    <div className="text-center mt-5 pt-4 border-t-2 border-gray-300 relative space-y-2">
      <p className="text-[10px] text-gray-500 mt-2">
        Thank you for choosing{' '}
        <span className="font-semibold text-gray-700">
          {facilityName || 'Custocare'}
        </span>
      </p>
      
      <div className="flex items-center justify-center gap-2 group mt-1">
        <Sparkles className="w-3 h-3 text-amber-300 opacity-0 group-hover:opacity-100 transition-all duration-300 -mr-1" />
        
        <span className="font-bold text-[7px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded-sm bg-gray-100 text-blue-400 group-hover:bg-gray-200 transition-colors duration-300">
          Powered by
        </span>
        
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-r from-amber-200 to-blue-200 rounded-full blur-sm opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
          
          <img
            src={logo}
            alt="Custocare"
            className="h-4 w-auto relative z-10 filter drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300"
          />
        </div>
        
        <div className="relative">
          <span className="text-[9px] font-black bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent relative z-10">
            CUSTOCARE 
          </span>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-400 to-emerald-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
        </div>
        
        <Zap className="w-3 h-3 text-blue-300 opacity-0 group-hover:opacity-100 transition-all duration-300 -ml-1" />
      </div>

      <div className="flex flex-col items-center gap-1 mt-2">
        <p className="text-[8px] font-semibold text-blue-600">
          Continuous Care. Operational Excellence.
        </p>
      </div>
      
      <div className="mt-2 pt-1">
        <p className="text-[7px] font-mono">
          <span className="text-gray-500 uppercase tracking-wider mr-1 font-bold">PRINT TIME:</span>
          <span className="font-bold text-black">
            {new Date().toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            }).replace(/,/g, '')}
          </span>
        </p>
      </div>
    </div>
  );
};
