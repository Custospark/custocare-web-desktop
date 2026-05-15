# Ambulance Services Module — Frontend Implementation Strategy

## 1. Module Location & Naming Convention

```
src/renderer/modules/ambulance/               ← kebab-case module folder
├── api/
│   ├── ambulances/
│   │   ├── ambulanceTypes.ts                  ← PascalCase Types
│   │   └── useAmbulanceQueries.ts             ← usePascalCase Queries
│   ├── ambulance-trips/
│   │   ├── ambulanceTripTypes.ts
│   │   └── useAmbulanceTripQueries.ts
│   ├── ambulance-trip-logs/
│   │   ├── ambulanceTripLogTypes.ts
│   │   └── useAmbulanceTripLogQueries.ts
│   └── ambulance-crew/
│       ├── ambulanceCrewMemberTypes.ts
│       └── useAmbulanceCrewMemberQueries.ts
│
├── ui/
│   ├── AmbulanceModule.tsx                    ← Module shell (BaseModuleWorkspace)
│   ├── overview/
│   │   └── AmbulanceOverview.tsx
│   ├── vehicles/
│   │   ├── VehicleManagement.tsx              ← Operation page
│   │   ├── views/
│   │   │   ├── VehicleList.tsx
│   │   │   ├── VehicleCreate.tsx
│   │   │   ├── VehicleEdit.tsx
│   │   │   ├── VehicleDetail.tsx
│   │   │   └── VehicleServiceSchedule.tsx
│   │   └── components/
│   │       ├── VehicleStatusBadge.tsx
│   │       └── VehicleTypeIcon.tsx
│   ├── dispatch/
│   │   ├── DispatchCenter.tsx                 ← Operation page
│   │   ├── views/
│   │   │   ├── TripList.tsx
│   │   │   ├── TripCreate.tsx
│   │   │   ├── TripDetail.tsx
│   │   │   ├── TripTimeline.tsx
│   │   │   ├── ActiveTripsBoard.tsx
│   │   │   └── TripLogList.tsx
│   │   └── components/
│   │       ├── TripStatusStepper.tsx
│   │       ├── TripPriorityBadge.tsx
│   │       └── TripTypeIcon.tsx
│   ├── crew/
│   │   ├── CrewManagement.tsx                 ← Operation page
│   │   ├── views/
│   │   │   ├── CrewList.tsx
│   │   │   ├── CrewAssign.tsx
│   │   │   └── CrewSchedule.tsx
│   │   └── components/
│   │       └── CrewRoleBadge.tsx
│   └── analytics/
│       └── AmbulanceAnalytics.tsx
```

## 2. Operations (Sidebar / Module Tabs)

These appear as the top-level navigation items inside the ambulance module workspace (BaseModuleWorkspace).

| Operation ID | Label | Icon | Description |
|--------------|-------|------|-------------|
| `overview` | Fleet Intelligence | `LayoutDashboard` | Stats, active trips, vehicle availability, maintenance alerts |
| `vehicles` | Vehicle Fleet Management | `Truck` | CRUD vehicles, service scheduling, equipment tracking |
| `dispatch` | Dispatch & Trip Center | `Navigation` | Active board, trip creation, timeline tracking, trip logs |
| `crew` | Crew Management | `UsersRound` | Assign staff to vehicles, manage roles & certifications |
| `analytics` | Fleet Analytics | `BarChart3` | Trip volume, response times, mileage reports |

## 3. Horizontal Actions (Inside Dispatch & Trip Center)

The `DispatchCenter` (visit-scoped action workspace) uses `BaseActionWorkspace` with these horizontal tabs:

| Action Key | Label | Icon | Description |
|------------|-------|------|-------------|
| `active-board` | Active Trips Board | `Activity` | Live view of all in-progress trips (dispatched → en_route → on_scene → transporting → at_destination) |
| `new-trip` | New Trip Request | `PlusCircle` | Create a trip: select patient, set pickup/destination, choose type & priority |
| `trip-history` | Trip History | `Clock` | Search completed/cancelled trips with filters |
| `trip-timeline` | Trip Timeline | `Workflow` | View or update status transitions for a specific trip + add trip logs |

## 4. Horizontal Actions (Inside Vehicle Fleet Management)

| Action Key | Label | Icon | Description |
|------------|-------|------|-------------|
| `all-vehicles` | All Vehicles | `List` | Table of all vehicles with status, type, mileage, service due |
| `add-vehicle` | Add Vehicle | `PlusCircle` | Register a new ambulance |
| `service-schedule` | Service Schedule | `CalendarClock` | Upcoming and overdue maintenance |
| `vehicle-detail` | Vehicle Detail | `FileText` | Single vehicle view with crew assignments |

## 5. Horizontal Actions (Inside Crew Management)

| Action Key | Label | Icon | Description |
|------------|-------|------|-------------|
| `by-vehicle` | By Vehicle | `Truck` | See which staff are assigned to each vehicle |
| `by-staff` | By Staff | `Users` | See which vehicle each staff member is on |
| `assign` | Assign Crew | `UserPlus` | Assign staff to a vehicle with role |

## 6. API Layer (React Query)

Each entity follows the same pattern:

### Types File (`ambulanceTypes.ts`)
```typescript
// Enums matching backend
export enum AmbulanceStatus { ... }
export enum VehicleType { ... }

// API response shape (matches AmbulanceResource backend)
export interface Ambulance { ... }
export interface AmbulanceCollection { ... }

// Request payloads (matches Store/Update requests)
export interface CreateAmbulanceRequest { ... }
export interface UpdateAmbulanceRequest { ... }
```

### Queries File (`useAmbulanceQueries.ts`)
```typescript
// Hooks wrapping axios + react-query
export const useAmbulances = (filters?, perPage?) => useQuery(...)
export const useAmbulance = (uuid) => useQuery(...)
export const useAvailableAmbulances = (filters?) => useQuery(...)
export const useAmbulancesByFacility = (facilityId, filters?) => useQuery(...)

// Mutations
export const useCreateAmbulance = () => useMutation(...)
export const useUpdateAmbulance = (uuid) => useMutation(...)
export const useDeleteAmbulance = () => useMutation(...)

// Same pattern for trips, logs, crew:
export const useTrips = (filters?, perPage?) => ...
export const useTrip = (uuid) => ...
export const useActiveTrips = (filters?) => ...
export const useTripByPatient = (patientId) => ...
export const useDispatchTrip = () => useMutation(...)
export const useMarkEnRoute = () => useMutation(...)
export const useMarkOnScene = () => useMutation(...)
export const useMarkPatientContact = () => useMutation(...)
export const useMarkDepartScene = () => useMutation(...)
export const useMarkAtDestination = () => useMutation(...)
export const useCompleteTrip = () => useMutation(...)
export const useCancelTrip = () => useMutation(...)

export const useTripLogs = (tripUuid) => ...
export const useCreateTripLog = (tripUuid) => ...

export const useCrewByAmbulance = (ambulanceId) => ...
export const useCrewByStaff = (staffId) => ...
export const useCreateCrewMember = () => useMutation(...)
export const useUpdateCrewMember = () => useMutation(...)
export const useDeleteCrewMember = () => useMutation(...)
```

## 7. Integration Points to Register

### File-by-file checklist:

| # | File | Action |
|---|------|--------|
| 1 | `src/renderer/app/routes/constants/shared.paths.ts` | Add `AMBULANCE: '/ambulance'` route constant |
| 2 | `src/renderer/app/routes/constants/ambulance.paths.ts` | **NEW** — Define `AMBULANCE_ROUTES` with all paths |
| 3 | `src/renderer/app/routes/routeConstants.ts` | Export `AMBULANCE_ROUTES` |
| 4 | `src/renderer/app/routes/modules/ambulance.tsx` | **NEW** — Define route tree for all ambulance pages |
| 5 | `src/renderer/app/routes/ProtectedRoutes.tsx` | Add lazy-loaded `<Route path={ROUTES.AMBULANCE}>` with the module |
| 6 | `src/renderer/shared/navigation/moduleWorkspaceOperations.tsx` | Add `AMBULANCE_MODULE_OPERATIONS` + sidebar nested routes |
| 7 | `src/renderer/shared/components/workspace/BaseModuleWorkspace.tsx` | No changes needed (already generic) |
| 8 | Sidebar config (likely `menuConfig.ts` or similar) | Add ambulance module entry with icon |
| 9 | `src/renderer/app/store/slices/moduleSlice.ts` (if exists) | Register module code if module-access middleware used |

## 8. Backend API Reference

All endpoints are under `auth:sanctum` middleware:

| Method | Endpoint | Frontend Hook |
|--------|----------|--------------|
| GET | `/api/ambulances` | `useAmbulances(filters)` |
| POST | `/api/ambulances` | `useCreateAmbulance()` |
| GET | `/api/ambulances/{uuid}` | `useAmbulance(uuid)` |
| PUT | `/api/ambulances/{uuid}` | `useUpdateAmbulance(uuid)` |
| DELETE | `/api/ambulances/{uuid}` | `useDeleteAmbulance()` |
| GET | `/api/ambulances/available` | `useAvailableAmbulances()` |
| GET | `/api/ambulances/facility/{id}` | `useAmbulancesByFacility(id)` |
| GET | `/api/ambulance-trips` | `useTrips(filters)` |
| POST | `/api/ambulance-trips` | `useCreateTrip()` |
| GET | `/api/ambulance-trips/{uuid}` | `useTrip(uuid)` |
| POST | `/api/ambulance-trips/{uuid}/dispatch` | `useDispatchTrip()` |
| POST | `/api/ambulance-trips/{uuid}/en-route` | `useMarkEnRoute()` |
| POST | `/api/ambulance-trips/{uuid}/on-scene` | `useMarkOnScene()` |
| POST | `/api/ambulance-trips/{uuid}/patient-contact` | `useMarkPatientContact()` |
| POST | `/api/ambulance-trips/{uuid}/depart-scene` | `useMarkDepartScene()` |
| POST | `/api/ambulance-trips/{uuid}/at-destination` | `useMarkAtDestination()` |
| POST | `/api/ambulance-trips/{uuid}/complete` | `useCompleteTrip()` |
| POST | `/api/ambulance-trips/{uuid}/cancel` | `useCancelTrip()` |
| GET | `/api/ambulance-trips/active` | `useActiveTrips()` |
| GET | `/api/ambulance-trips/patient/{id}` | `useTripsByPatient(id)` |
| GET | `/api/ambulance-trips/from-facility/{id}` | `useTripsFromFacility(id)` |
| GET | `/api/ambulance-trips/to-facility/{id}` | `useTripsToFacility(id)` |
| GET | `/api/ambulance-trips/{uuid}/logs` | `useTripLogs(uuid)` |
| POST | `/api/ambulance-trips/{uuid}/logs` | `useCreateTripLog(uuid)` |
| POST | `/api/ambulance-crew` | `useCreateCrewMember()` |
| GET | `/api/ambulance-crew/ambulance/{id}` | `useCrewByAmbulance(id)` |
| GET | `/api/ambulance-crew/staff/{id}` | `useCrewByStaff(id)` |
| PUT | `/api/ambulance-crew/{id}` | `useUpdateCrewMember()` |
| DELETE | `/api/ambulance-crew/{id}` | `useDeleteCrewMember()` |

## 9. Implementation Order (Phases)

### Phase 1 — Module Shell & Routing
- Register route constant in `shared.paths.ts`
- Create `ambulance.paths.ts` with all route constants
- Create `ambulance.tsx` route table
- Create `AmbulanceModule.tsx` with BaseModuleWorkspace
- Register in `ProtectedRoutes.tsx`
- Register in `moduleWorkspaceOperations.tsx`

### Phase 2 — API Layer (all 4 entities)
- Types files (ambulances, trips, tripLogs, crewMembers)
- Query hooks files

### Phase 3 — Fleet Overview Dashboard
- `AmbulanceOverview.tsx` with stats cards, active trips, vehicle availability

### Phase 4 — Vehicle Fleet Management
- `VehicleManagement.tsx` with CRUD table
- Create/Edit/Detail views
- Service schedule view

### Phase 5 — Dispatch & Trip Center
- `DispatchCenter.tsx` with BaseActionWorkspace
- Active trips board
- Trip create form
- Trip detail with timeline stepper
- Trip log management

### Phase 6 — Crew Management
- `CrewManagement.tsx`
- Assign, list by vehicle/staff views

### Phase 7 — Fleet Analytics
- Charts for trip volume, response times, mileage

---

*Created: 2026-05-14 — Follows existing Medical Records / Pharmacy / Laboratory module patterns.*
