import { Building2, Clock, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { BaseActionWorkspace } from '../../../../shared/components/workspace/BaseActionWorkspace';
import { REFERRAL_ROUTES } from '../../../../app/routes/routeConstants';

interface ReferralNetworkWorkspaceProps {
  theme: 'light' | 'dark';
}

const ReferralNetworkWorkspace = ({ theme }: ReferralNetworkWorkspaceProps) => (
  <BaseActionWorkspace
    title="Referral network"
    icon={<Building2 className="h-6 w-6" />}
    theme={theme}
    defaultActionTo={REFERRAL_ROUTES.NETWORK_PENDING}
    additionalWorkflowPathPrefixes={[REFERRAL_ROUTES.NETWORK]}
    actions={[
      {
        key: 'pending',
        label: 'Pending referrals',
        icon: <Clock className="h-4 w-4" />,
        to: REFERRAL_ROUTES.NETWORK_PENDING,
        description: 'Facility-wide referrals awaiting response',
      },
      {
        key: 'incoming',
        label: 'Incoming',
        icon: <ArrowDownLeft className="h-4 w-4" />,
        to: REFERRAL_ROUTES.NETWORK_INCOMING,
        description: 'Referrals directed to this facility',
      },
      {
        key: 'outgoing',
        label: 'Outgoing',
        icon: <ArrowUpRight className="h-4 w-4" />,
        to: REFERRAL_ROUTES.NETWORK_OUTGOING,
        description: 'Referrals sent from this facility',
      },
    ]}
  />
);

export default ReferralNetworkWorkspace;
