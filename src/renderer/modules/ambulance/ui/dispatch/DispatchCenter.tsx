import { ForwardThemeOutlet } from '../../../../app/routes/modules/shared/routeUtils';

interface DispatchCenterProps { theme: 'light' | 'dark'; }

const DispatchCenter = ({ theme }: DispatchCenterProps) => {
  return (
    <div className={theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}>
      <ForwardThemeOutlet />
    </div>
  );
};

export default DispatchCenter;
