// import React from 'react';
// import DataTable, { Column } from '../components/Tables/DataTable';
// import Badge from '../components/Badges/Badge';

// interface Patient {
//   id: string;
//   name: string;
//   age: number;
//   status: 'active' | 'inactive' | 'critical';
// }

// const patients: Patient[] = [
//   { id: '1', name: 'John Doe', age: 45, status: 'active' },
//   { id: '2', name: 'Jane Smith', age: 32, status: 'critical' },
//   { id: '3', name: 'Alice Johnson', age: 29, status: 'inactive' },
// ];

// const columns: Column<Patient>[] = [
//   { key: 'name', header: 'Patient Name', sortable: true },
//   { key: 'age', header: 'Age', sortable: true, align: 'center' },
//   {
//     key: 'status',
//     header: 'Status',
//     render: (patient) => (
//       <Badge variant={patient.status === 'active' ? 'success' : patient.status === 'inactive' ? 'gray' : 'critical'}>
//         {patient.status.toUpperCase()}
//       </Badge>
//     ),
//     align: 'center',
//   },
// ];

// const PatientsTableDemo: React.FC = () => {
//   const handleRowClick = (patient: Patient) => {
//     alert(`Clicked on ${patient.name}`);
//   };

//   return (
//     <DataTable
//       columns={columns}
//       data={patients}
//       keyExtractor={(patient) => patient.id}
//       onRowClick={handleRowClick}
//       striped
//       className="mt-24"
//     />
//   );
// };

// export default PatientsTableDemo;
