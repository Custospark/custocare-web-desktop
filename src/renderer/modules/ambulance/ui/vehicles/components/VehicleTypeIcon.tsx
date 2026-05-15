interface VehicleTypeIconProps {
  type: string;
  isDark: boolean;
}

const typeLabels: Record<string, string> = {
  bls: 'BLS',
  als: 'ALS',
  critical_care: 'CC',
  patient_transport: 'PT',
  type_i: 'Type I',
  type_ii: 'Type II',
  type_iii: 'Type III',
  medium_duty: 'MD',
  specialty: 'Spec',
  other: 'Other',
};

const VehicleTypeIcon = ({ type, isDark }: VehicleTypeIconProps) => (
  <span className={`inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-bold uppercase ${
    isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
  }`}>
    {typeLabels[type] ?? type}
  </span>
);

export default VehicleTypeIcon;
