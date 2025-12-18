import React, { useState } from 'react';
import AlertCard from '../components/Cards/AlertCard';
import Badge from '../components/Badges/Badge';

const AlertDemo: React.FC = () => {
  const [showDismissible, setShowDismissible] = useState(true);

  return (
    <div className="p-6 space-y-6 bg-neutral-gray-bg min-h-screen">

      {/* Success Alert */}
      <AlertCard variant="success" title="Operation Successful">
        Patient record saved successfully.
      </AlertCard>

      {/* Warning Alert */}
      <AlertCard variant="warning" title="Attention Required">
        Patient's blood pressure is slightly elevated.
      </AlertCard>

      {/* Error Alert */}
      <AlertCard variant="error" title="Critical Alert">
        Patient has severe penicillin allergy.
      </AlertCard>

      {/* Info Alert */}
      <AlertCard variant="info" title="Informational">
        New lab results are available for review.
      </AlertCard>

      {/* Dismissible Alert */}
      {showDismissible && (
        <AlertCard
          variant="warning"
          title="Reminder"
          onClose={() => setShowDismissible(false)}
        >
          Please verify the patient's insurance details.
        </AlertCard>
      )}
<div className="flex gap-2">
  <Badge variant="critical">Urgent</Badge>
  <Badge variant="warning">Pending Review</Badge>
  <Badge variant="success">Completed</Badge>
  <Badge variant="info">Info</Badge>
  <Badge variant="gray">Disabled</Badge>

  <Badge variant="success" size="large">Big Success</Badge>
  <Badge variant="critical" size="small">Small Urgent</Badge>
</div>

    </div>
  );
};

export default AlertDemo;
