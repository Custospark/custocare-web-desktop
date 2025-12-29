import React from 'react';
import PatientCard from '../components/Cards/PatientCard';
import AllergyTag from '../components/Badges/AllergyTag';
import ModuleBadge from '../components/Badges/Badges/ModuleBadge';

const PatientCardDemo: React.FC = () => {

  const handleViewPatient = (id: string) => {
    alert(`Viewing patient: ${id}`);
  };

  return (
    <div className="p-6 space-y-6 max-w-lg mx-auto">
      {/* Active Patient */}
      <PatientCard
        patientName="John Doe"
        patientId="UG-2025-AB12345"
        age={45}
        gender="Male"
        status="active"
        lastVisit="2025-12-15"
        onClick={() => handleViewPatient('UG-2025-AB12345')}
      />
      {/* // Default lab badge */}
<ModuleBadge module="lab" />

{/* // Large pharmacy badge with custom label */}
<ModuleBadge module="pharmacy" label="Pending" size="large" />

{/* // Triage badge without icon */}
<ModuleBadge module="triage" showIcon={false} size="medium" />


      {/* Inactive Patient */}
      <PatientCard
        patientName="Jane Smith"
        patientId="UG-2025-CD67890"
        age={30}
        gender="Female"
        status="inactive"
        lastVisit="2025-11-20"
        onClick={() => handleViewPatient('UG-2025-CD67890')}
      />
{/* // Small mild allergy */}
<AllergyTag allergen="Pollen" severity="mild" size="small" />

{/* // Medium moderate allergy */}
<AllergyTag allergen="Latex" severity="moderate" />

{/* // Large severe allergy */}
<AllergyTag allergen="Penicillin" severity="severe" size="large" />

      {/* Critical Patient */}
      <PatientCard
        patientName="Robert Brown"
        patientId="UG-2025-EF11223"
        age={65}
        gender="Male"
        status="critical"
        lastVisit="2025-12-10"
        onClick={() => handleViewPatient('UG-2025-EF11223')}
      />
    </div>
  );
};

export default PatientCardDemo;
