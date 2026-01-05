# Patient Management Module

A production-grade, modular patient management system built with React, TypeScript, and Redux. This module demonstrates enterprise-level architecture with clean separation of concerns, reusable components, and best practices.

## 📁 Module Structure

```
patient-module/
├── index.ts                 # Central exports
├── types.ts                 # Shared types and constants
├── PatientModule.tsx        # Main integration component
├── PatientOverview.tsx      # Overview & statistics
├── PatientSearch.tsx        # Search & filter functionality
├── PatientRegister.tsx      # Registration form
└── PatientDischarge.tsx     # Discharge processing
```

## 🎯 Features

### 1. **Patient Overview** (`PatientOverview.tsx`)
- Real-time patient statistics
- Status breakdown (Active, Critical, Discharged)
- Recent activity feed
- Responsive gradient cards with animations

### 2. **Patient Search** (`PatientSearch.tsx`)
- Advanced search with multiple filters
- Real-time filtering by name, ID, email, phone
- Status, gender, and age range filters
- Sortable results table
- Export functionality
- Quick action buttons

### 3. **Patient Registration** (`PatientRegister.tsx`)
- Multi-section form with validation
- Personal information
- Contact details
- Emergency contacts
- Medical information
- Blood type and insurance tracking

### 4. **Patient Discharge** (`PatientDischarge.tsx`)
- Patient selection (Active/Critical only)
- Patient details display
- Discharge summary form
- Instructions and medications
- Follow-up appointment scheduling

## 🚀 Usage

### Basic Usage

```tsx
import { PatientModule } from './patient-module';

function App() {
  return <PatientModule />;
}
```

### With React Router

```tsx
import { Routes, Route } from 'react-router-dom';
import { PatientModule } from './patient-module';

function App() {
  return (
    <Routes>
      <Route path="/patients" element={<PatientModule />} />
    </Routes>
  );
}
```

### Using Individual Components

```tsx
import { PatientSearch } from './patient-module';

function CustomPatientPage() {
  const [filters, setFilters] = useState(/* ... */);
  
  return (
    <PatientSearch
      theme="dark"
      searchFilters={filters}
      onFilterChange={handleFilterChange}
    />
  );
}
```

## 📦 Component API

### PatientModule (Main Component)

```tsx
<PatientModule />
```

**Props:** None (uses Redux for theme)

**State Management:**
- `activeOperation`: Current view (overview, search, register, discharge)
- `searchFilters`: Search criteria
- `registrationForm`: New patient data
- `selectedPatientForDischarge`: Patient ID for discharge

---

### PatientOverview

```tsx
<PatientOverview theme={theme} />
```

**Props:**
- `theme`: `'light' | 'dark'` - UI theme

---

### PatientSearch

```tsx
<PatientSearch
  theme={theme}
  searchFilters={filters}
  onFilterChange={handleChange}
/>
```

**Props:**
- `theme`: `'light' | 'dark'` - UI theme
- `searchFilters`: Search filter state
- `onFilterChange`: Callback for filter changes

---

### PatientRegister

```tsx
<PatientRegister
  theme={theme}
  formData={form}
  onChange={handleChange}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

**Props:**
- `theme`: `'light' | 'dark'` - UI theme
- `formData`: Registration form state
- `onChange`: Callback for field changes
- `onSubmit`: Form submission handler
- `onCancel`: Cancel handler

---

### PatientDischarge

```tsx
<PatientDischarge
  theme={theme}
  selectedPatientId={patientId}
  onPatientSelect={handleSelect}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

**Props:**
- `theme`: `'light' | 'dark'` - UI theme
- `selectedPatientId`: Currently selected patient
- `onPatientSelect`: Patient selection handler
- `onSubmit`: Form submission handler
- `onCancel`: Cancel handler

## 🔧 Type Definitions

### PatientRecord

```typescript
interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  phone: string;
  email: string;
  address: string;
  bloodType: string;
  status: 'Active' | 'Discharged' | 'Critical';
  lastVisit: string;
  nextAppointment?: string;
  assignedDoctor: string;
  conditions: string[];
}
```

### SearchFilters

```typescript
interface SearchFilters {
  query: string;
  status: string;
  ageRange: string;
  gender: string;
  sortBy: string;
}
```

### RegistrationForm

```typescript
interface RegistrationForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodType: string;
  allergies: string;
  medications: string;
  insurance: string;
}
```

## 🎨 Styling

The module uses:
- **Tailwind CSS** for utility-first styling
- **Theme-aware components** (light/dark mode)
- **Responsive design** (mobile-first approach)
- **Gradient backgrounds** with backdrop blur effects
- **Smooth transitions** and hover effects
- **Accessible color schemes** for status indicators

## 🏗️ Architecture Principles

### 1. **Separation of Concerns**
Each component has a single, well-defined responsibility:
- `types.ts`: Shared data structures
- `PatientOverview.tsx`: Display statistics
- `PatientSearch.tsx`: Search functionality
- `PatientRegister.tsx`: Registration logic
- `PatientDischarge.tsx`: Discharge process
- `PatientModule.tsx`: Orchestration and integration

### 2. **Reusability**
Components are designed to be:
- Standalone and testable
- Props-based (no internal data fetching)
- Theme-agnostic
- Easily integrated into other systems

### 3. **Performance**
- `useMemo` for expensive computations
- `useCallback` for event handlers
- Memoized filtering and sorting
- Minimal re-renders

### 4. **Maintainability**
- TypeScript for type safety
- Comprehensive JSDoc comments
- Consistent naming conventions
- Modular file structure

### 5. **Accessibility**
- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation support
- High-contrast color schemes

## 🔄 State Flow

```
PatientModule (Main Orchestrator)
    ↓
    ├── activeOperation → determines which component to render
    ├── searchFilters → passed to PatientSearch
    ├── registrationForm → passed to PatientRegister
    └── selectedPatientForDischarge → passed to PatientDischarge
```

### Event Flow

```
User Interaction
    ↓
Component Event Handler (onChange, onSubmit, etc.)
    ↓
PatientModule Callback Handler
    ↓
State Update
    ↓
Component Re-render with New Props
```

## 🧪 Testing Recommendations

### Unit Tests

```tsx
// Test PatientSearch filtering
describe('PatientSearch', () => {
  it('filters patients by name', () => {
    const filters = { query: 'John', /* ... */ };
    render(<PatientSearch theme="light" searchFilters={filters} />);
    // Assert results
  });
});
```

### Integration Tests

```tsx
// Test PatientModule operation switching
describe('PatientModule', () => {
  it('switches between operations', () => {
    render(<PatientModule />);
    // Click search button
    // Assert search component is rendered
  });
});
```

## 🚧 Future Enhancements

### API Integration
Replace `MOCK_PATIENTS` with real API calls:

```typescript
// In PatientModule.tsx
const { data: patients, loading, error } = usePatients();

// In PatientSearch.tsx
const { mutate: searchPatients } = usePatientSearch();
```

### Advanced Features
- [ ] Real-time notifications
- [ ] PDF export for discharge summaries
- [ ] Appointment scheduling integration
- [ ] Medical records attachment
- [ ] Patient photo upload
- [ ] Advanced analytics dashboard
- [ ] Role-based access control

### Performance Optimizations
- [ ] Virtual scrolling for large patient lists
- [ ] Debounced search input
- [ ] Pagination for search results
- [ ] Service worker for offline support

## 📝 Best Practices

### 1. **Component Updates**
When modifying components, ensure:
- Props interface remains backward compatible
- Types are updated in `types.ts`
- JSDoc comments are updated
- Display names are set for debugging

### 2. **Adding New Operations**
To add a new operation:

```typescript
// 1. Create new component
export const PatientAnalytics: React.FC<Props> = ({ theme }) => {
  // Implementation
};

// 2. Add to PATIENT_OPERATIONS in PatientModule.tsx
const PATIENT_OPERATIONS: Operation[] = [
  // ...existing operations
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <ChartIcon />,
    description: 'Patient analytics and insights',
  },
];

// 3. Add case in renderWorkspaceContent()
case 'analytics':
  return <PatientAnalytics theme={theme} />;
```

### 3. **State Management**
- Keep local state for UI-specific concerns
- Use Redux for global app state (theme, user, etc.)
- Consider React Query for server state
- Use Context API for deeply nested prop drilling

## 🤝 Contributing

When contributing to this module:

1. **Follow the file structure**: One component per file
2. **Maintain type safety**: Update `types.ts` for shared types
3. **Document changes**: Update JSDoc and README
4. **Test thoroughly**: Add unit and integration tests
5. **Keep it modular**: Components should be independent

## 📄 License

This module is part of a larger healthcare management system. Refer to the root project license.

## 🙋 Support

For questions or issues with this module:
- Check component JSDoc comments
- Review type definitions in `types.ts`
- Examine the main `PatientModule.tsx` orchestration logic
- Refer to individual component files for implementation details

---

**Built with ❤️ for enterprise healthcare management**