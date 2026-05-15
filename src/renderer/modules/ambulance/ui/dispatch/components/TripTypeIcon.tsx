interface TripTypeIconProps { type: string; isDark: boolean; }
const labels: Record<string, string> = { emergency: 'ER', non_emergency: 'NE', inter_facility_transfer: 'IFT', standby: 'SB', special_event: 'SE' };
const TripTypeIcon = ({ type, isDark }: TripTypeIconProps) => (
  <span className={`inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-bold uppercase ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
    {labels[type] ?? type}
  </span>
);
export default TripTypeIcon;
