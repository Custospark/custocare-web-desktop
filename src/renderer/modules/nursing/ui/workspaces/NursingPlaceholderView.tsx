import React from 'react';
import { PlaceholderPanel } from '../../../../app/routes/modules/shared/routeUtils';

interface NursingPlaceholderViewProps {
  title: string;
}

const NursingPlaceholderView: React.FC<NursingPlaceholderViewProps> = ({ title }) => (
  <PlaceholderPanel title={title} />
);

export default NursingPlaceholderView;

