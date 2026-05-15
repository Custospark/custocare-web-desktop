interface TripStatusStepperProps { status: string; isDark: boolean; }
const steps = ['requested', 'dispatched', 'en_route', 'on_scene', 'transporting', 'at_destination', 'completed'];
const TripStatusStepper = ({ status, isDark }: TripStatusStepperProps) => {
  const idx = steps.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s} className={`flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}`}>
          <div className={`h-2.5 w-2.5 rounded-full ${i <= idx ? 'bg-blue-500' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          {i < steps.length - 1 && <div className={`h-0.5 flex-1 ${i < idx ? 'bg-blue-500' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );
};
export default TripStatusStepper;
