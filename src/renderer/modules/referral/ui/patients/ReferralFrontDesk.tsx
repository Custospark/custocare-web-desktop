import { Search, UserPlus, ListOrdered, Share2 } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { REFERRAL_ROUTES } from '../../../../app/routes/routeConstants';

interface ReferralFrontDeskProps {
  theme: 'light' | 'dark';
}

const ReferralFrontDesk = ({ theme }: ReferralFrontDeskProps) => (
  <BaseActionWorkspace
    title="Referral queue & intake"
    icon={<Share2 className="h-6 w-6" />}
    theme={theme}
    defaultActionTo={REFERRAL_ROUTES.PATIENT_QUEUE}
    actions={[
      {
        key: 'patient_queue',
        label: 'Referral queue',
        icon: <ListOrdered className="h-4 w-4" />,
        to: REFERRAL_ROUTES.PATIENT_QUEUE,
        description: 'Visits ready for referral coordination and outbound requests',
      },
      {
        key: 'patient_search',
        label: 'Search patient',
        icon: <Search className="h-4 w-4" />,
        to: REFERRAL_ROUTES.PATIENTS_SEARCH,
      },
      {
        key: 'patient_create',
        label: 'Register patient',
        icon: <UserPlus className="h-4 w-4" />,
        to: REFERRAL_ROUTES.PATIENTS_REGISTER,
      },
      {
        key: 'walk_in_patient',
        label: 'Walk-in visit',
        icon: <Share2 className="h-4 w-4" />,
        to: REFERRAL_ROUTES.WALKIN_PATIENT,
      },
    ]}
  />
);

export default ReferralFrontDesk;
