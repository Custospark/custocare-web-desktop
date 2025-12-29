import React from 'react';
import { cn } from '../../utils/classNameUtils';
import { Building2, MapPin, Phone, Mail, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface FacilityCardProps {
  facility: {
    id: string;
    name: string;
    type: string;
    status: 'Active' | 'Inactive' | 'Pending';
    address: string;
    contact: {
      phone: string;
      email: string;
    };
    staffCount: number;
    departmentCount: number;
    lastUpdated: string;
  };
  onSelect: (id: string) => void;
  theme: 'dark' | 'light';
}

export const FacilityCard: React.FC<FacilityCardProps> = ({ facility, onSelect, theme }) => {
  const statusConfig = {
    Active: {
      icon: CheckCircle,
      classes: theme === 'dark' 
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
        : 'bg-emerald-100 text-emerald-700 border-emerald-300',
    },
    Pending: {
      icon: Clock,
      classes: theme === 'dark' 
        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' 
        : 'bg-yellow-100 text-yellow-700 border-yellow-300',
    },
    Inactive: {
      icon: AlertCircle,
      classes: theme === 'dark' 
        ? 'bg-gray-500/20 text-gray-300 border-gray-500/30' 
        : 'bg-gray-100 text-gray-700 border-gray-300',
    },
  };

  const StatusIcon = statusConfig[facility.status].icon;

  return (
    <div
      onClick={() => onSelect(facility.id)}
      className={cn(
        'p-5 rounded-2xl border cursor-pointer transition-all',
        'hover:scale-[1.02] hover:shadow-lg',
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-gray-800/50 hover:border-cyan-500/50'
          : 'bg-gradient-to-br from-white/50 to-gray-50/50 border-gray-200/60 hover:border-blue-500/50'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2.5 rounded-xl',
            theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'
          )}>
            <Building2 className={cn(
              'w-5 h-5',
              theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
            )} />
          </div>
          <div>
            <h3 className={cn(
              'font-bold',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {facility.name}
            </h3>
            <p className={cn(
              'text-sm',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              {facility.type}
            </p>
          </div>
        </div>
        
        <div className={cn(
          'px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5',
          statusConfig[facility.status].classes
        )}>
          <StatusIcon className="w-3 h-3" />
          {facility.status}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className={cn(
            'w-4 h-4 flex-shrink-0',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )} />
          <p className={cn(
            'text-sm truncate',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            {facility.address}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <Phone className={cn(
              'w-3.5 h-3.5 flex-shrink-0',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )} />
            <p className={cn(
              'text-xs truncate',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              {facility.contact.phone}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Mail className={cn(
              'w-3.5 h-3.5 flex-shrink-0',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )} />
            <p className={cn(
              'text-xs truncate',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              {facility.contact.email}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Users className={cn(
                'w-3.5 h-3.5',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )} />
              <span className={cn(
                'text-xs font-medium',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}>
                {facility.staffCount} staff
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className={cn(
                'w-3.5 h-3.5',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )} />
              <span className={cn(
                'text-xs font-medium',
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              )}>
                {facility.departmentCount} depts
              </span>
            </div>
          </div>
          
          <p className={cn(
            'text-xs',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
          )}>
            Updated {facility.lastUpdated}
          </p>
        </div>
      </div>
    </div>
  );
};