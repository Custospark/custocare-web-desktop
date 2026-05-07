import React from 'react';
import { PlaceholderPanel, type ThemeProp } from '../../../../app/routes/modules/shared/routeUtils';

interface NursingPlaceholderViewProps extends ThemeProp {
  title: string;
}

const NursingPlaceholderView: React.FC<NursingPlaceholderViewProps> = ({ title }) => (
  <PlaceholderPanel title={title} />
);

export default NursingPlaceholderView;

