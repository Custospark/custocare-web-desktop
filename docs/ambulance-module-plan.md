# Ambulance Services — Frontend Module Plan
**Date:** 2026-05-14

## 1. Overview

Build the frontend module for the Ambulance Services feature. The **backend is fully implemented** (4 entities, 51 files, 33 API routes). This document covers only the frontend, following the three-layer architecture used by Pharmacy and Laboratory.

### Decisions from Architecture Review
| Question | Decision |
|----------|----------|
| Trip vs Dispatch naming | Use **Trip** |
| Crew assignment model | **Full entity** with own endpoints |
| Billing integration | **Defer** to existing billing module |
| Trip logs | **Include** |
| Vehicle type standards | Support **both** US and local standards |
| GPS tracking | **Manual** status updates only |

---

## 2. Three-Layer Architecture

Every module follows this hierarchy:

```
Layer 1: Module Shell (BaseModuleWorkspace)
  └─ renders operation tabs in the Quick Actions sidebar
      │  e.g. "Ambulance Intelligence" | "Fleet & Assets" | "Dispatch Center" | "Crew"
      │
      └─ Layer 2: Operation Workspace (BaseActionWorkspace)
           └─ renders horizontal action buttons (collapsible task bar)
               │  e.g. "Fleet overview" | "Add vehicle" | "Maintenance schedule"
               │
               └─ Layer 3: Child Route Pages via <Outlet/>
```

---

## 3. Backend API Summary (Already Live)

### Entity: Ambulance (Vehicle)
| Endpoint | Method | Used By |
|----------|--------|---------|
| `/api/v1/ambulances` | GET (list), POST (create) | Fleet list, Add vehicle |
| `/api/v1/ambulances/{uuid}` | GET, PUT, DELETE | Vehicle detail, Edit, Delete |
| `/api/v1/ambulances/facility/{facilityId}` | GET | Fleet by facility |
| `/api/v1/ambulances/available` | GET | Dispatch assignment |

### Entity: Ambulance Trip
| Endpoint | Method | Used By |
|----------|--------|---------|
| `/api/v1/ambulance-trips` | GET (list), POST (create) | Trip list, Request trip |
| `/api/v1/ambulance-trips/{uuid}` | GET, PUT, DELETE | Trip detail, Edit, Delete |
| `/api/v1/ambulance-trips/{uuid}/dispatch` | POST | Status transition |
| `/api/v1/ambulance-trips/{uuid}/en-route` | POST | Status transition |
| `/api/v1/ambulance-trips/{uuid}/on-scene` | POST | Status transition |
| `/api/v1/ambulance-trips/{uuid}/patient-contact` | POST | Status transition |
| `/api/v1/ambulance-trips/{uuid}/depart-scene` | POST | Status transition |
| `/api/v1/ambulance-trips/{uuid}/at-destination` | POST | Status transition |
| `/api/v1/ambulance-trips/{uuid}/complete` | POST | Status transition |
| `/api/v1/ambulance-trips/{uuid}/cancel` | POST | Status transition |
| `/api/v1/ambulance-trips/patient/{patientId}` | GET | Patient history |
| `/api/v1/ambulance-trips/active` | GET | Active dispatches |
| `/api/v1/ambulance-trips/from-facility/{facilityId}` | GET | Facility outbound |
| `/api/v1/ambulance-trips/to-facility/{facilityId}` | GET | Facility inbound |

### Entity: Ambulance Trip Log
| Endpoint | Method | Used By |
|----------|--------|---------|
| `/api/v1/ambulance-trips/{tripUuid}/logs` | GET (list), POST (create) | Trip timeline |

### Entity: Ambulance Crew Member
| Endpoint | Method | Used By |
|----------|--------|---------|
| `/api/v1/ambulance-crew` | GET (list), POST (create) | Crew list, Assign |
| `/api/v1/ambulance-crew/{id}` | PUT, DELETE | Edit, Remove |
| `/api/v1/ambulance-crew/ambulance/{ambulanceId}` | GET | Crew by vehicle |
| `/api/v1/ambulance-crew/staff/{staffId}` | GET | Staff assignments |

---

## 4. Operations & Horizontal Actions

### Operation 1: "Ambulance Intelligence" (overview)
- No horizontal actions — single dashboard page
- Shows: active trip counter, fleet availability summary, recent trips list

### Operation 2: "Fleet & Assets" (fleet)
Horizontal actions:
| Key | Label | Icon | Description |
|-----|-------|------|-------------|
| `overview` | Fleet overview | Truck | Full fleet list with status badges |
| `add` | Add vehicle | PlusCircle | Register a new ambulance |
| `maintenance` | Maintenance | Wrench | Vehicles due/overdue for service |

### Operation 3: "Dispatch Center" (dispatch)
Horizontal actions:
| Key | Label | Icon | Description |
|-----|-------|------|-------------|
| `active` | Active dispatches | Activity | Currently in-progress trips |
| `all` | All trips | ListOrdered | Complete trip history |
| `request` | Request trip | FilePlus | Create a new trip request |

### Operation 4: "Crew" (crew)
Horizontal actions:
| Key | Label | Icon | Description |
|-----|-------|------|-------------|
| `assignments` | Crew assignments | Users | All crew-to-vehicle assignments |
| `assign` | Assign crew | UserPlus | Assign staff to a vehicle |

---

## 5. Route Constants (ambulance.paths.ts)

```ts
const PP = ROUTES.AMBULANCE; // '/ambulance'
export const AMBULANCE_ROUTES = {
  ROOT: PP,
  // Overview
  OVERVIEW: `${PP}/overview`,

  // Fleet & Assets
  FLEET: `${PP}/fleet`,
  FLEET_OVERVIEW: `${PP}/fleet/overview`,
  FLEET_ADD: `${PP}/fleet/add`,
  FLEET_MAINTENANCE: `${PP}/fleet/maintenance`,

  // Dispatch Center
  DISPATCH: `${PP}/dispatch`,
  DISPATCH_ACTIVE: `${PP}/dispatch/active`,
  DISPATCH_ALL: `${PP}/dispatch/all`,
  DISPATCH_REQUEST: `${PP}/dispatch/request`,
  DISPATCH_DETAIL: `${PP}/dispatch/:uuid`,

  // Crew
  CREW: `${PP}/crew`,
  CREW_ASSIGNMENTS: `${PP}/crew/assignments`,
  CREW_ASSIGN: `${PP}/crew/assign`,
} as const;
```

---

## 6. Navigation Operations (moduleWorkspaceOperations.tsx)

```ts
export const AMBULANCE_MODULE_OPERATIONS: ModuleOperation[] = [
  {
    id: 'overview',
    label: 'Ambulance Intelligence',
    icon: <LayoutDashboard className="w-4 h-4" />,
    subtext: 'Active trips, fleet status, and operational summary',
  },
  {
    id: 'fleet',
    label: 'Fleet & Assets',
    icon: <Truck className="w-4 h-4" />,
    subtext: 'Manage ambulances, equipment, and service schedules',
  },
  {
    id: 'dispatch',
    label: 'Dispatch Center',
    icon: <Navigation className="w-4 h-4" />,
    subtext: 'Request, track, and complete ambulance trips',
  },
  {
    id: 'crew',
    label: 'Crew',
    icon: <Users className="w-4 h-4" />,
    subtext: 'Assign and manage crew members per vehicle',
  },
];

const AMBULANCE_NESTED_ROUTES: Record<string, string> = {
  overview: AMBULANCE_ROUTES.OVERVIEW,
  fleet: AMBULANCE_ROUTES.FLEET_OVERVIEW,
  dispatch: AMBULANCE_ROUTES.DISPATCH_ACTIVE,
  crew: AMBULANCE_ROUTES.CREW_ASSIGNMENTS,
};

export const AMBULANCE_SIDEBAR_NESTED_OPERATIONS = mapWorkspaceToSidebar(
  AMBULANCE_MODULE_OPERATIONS,
  AMBULANCE_NESTED_ROUTES,
  'amb',
);
```

---

## 7. Operation Workspace Components (Horizontal Actions)

### FleetWorkspace.tsx — for the "fleet" operation

```tsx
const FleetWorkspace: React.FC<{ theme: string }> = ({ theme }) => (
  <BaseActionWorkspace
    title="Fleet & Assets"
    icon={<Truck className="h-5 w-5" />}
    theme={theme}
    defaultActionTo={AMBULANCE_ROUTES.FLEET_OVERVIEW}
    actions={[
      {
        key: 'overview',
        label: 'Fleet overview',
        icon: <Truck className="h-4 w-4" />,
        to: AMBULANCE_ROUTES.FLEET_OVERVIEW,
        description: 'View and manage all ambulances',
      },
      {
        key: 'add',
        label: 'Add vehicle',
        icon: <PlusCircle className="h-4 w-4" />,
        to: AMBULANCE_ROUTES.FLEET_ADD,
        description: 'Register a new ambulance',
      },
      {
        key: 'maintenance',
        label: 'Maintenance',
        icon: <Wrench className="h-4 w-4" />,
        to: AMBULANCE_ROUTES.FLEET_MAINTENANCE,
        description: 'Vehicles due for service',
      },
    ]}
  />
);
```

### DispatchWorkspace.tsx — for the "dispatch" operation

```tsx
const DispatchWorkspace: React.FC<{ theme: string }> = ({ theme }) => (
  <BaseActionWorkspace
    title="Dispatch Center"
    icon={<Navigation className="h-5 w-5" />}
    theme={theme}
    defaultActionTo={AMBULANCE_ROUTES.DISPATCH_ACTIVE}
    actions={[
      {
        key: 'active',
        label: 'Active dispatches',
        icon: <Activity className="h-4 w-4" />,
        to: AMBULANCE_ROUTES.DISPATCH_ACTIVE,
        description: 'Currently in-progress trips',
      },
      {
        key: 'all',
        label: 'All trips',
        icon: <ListOrdered className="h-4 w-4" />,
        to: AMBULANCE_ROUTES.DISPATCH_ALL,
        description: 'Complete trip history',
      },
      {
        key: 'request',
        label: 'Request trip',
        icon: <FilePlus className="h-4 w-4" />,
        to: AMBULANCE_ROUTES.DISPATCH_REQUEST,
        description: 'Create a new ambulance request',
      },
    ]}
  />
);
```

### CrewWorkspace.tsx — for the "crew" operation

```tsx
const CrewWorkspace: React.FC<{ theme: string }> = ({ theme }) => (
  <BaseActionWorkspace
    title="Crew Management"
    icon={<Users className="h-5 w-5" />}
    theme={theme}
    defaultActionTo={AMBULANCE_ROUTES.CREW_ASSIGNMENTS}
    actions={[
      {
        key: 'assignments',
        label: 'Crew assignments',
        icon: <Users className="h-4 w-4" />,
        to: AMBULANCE_ROUTES.CREW_ASSIGNMENTS,
        description: 'All crew-to-vehicle assignments',
      },
      {
        key: 'assign',
        label: 'Assign crew',
        icon: <UserPlus className="h-4 w-4" />,
        to: AMBULANCE_ROUTES.CREW_ASSIGN,
        description: 'Assign staff to a vehicle',
      },
    ]}
  />
);
```

---

## 8. Route Structure (ambulance.tsx)

```tsx
export const ambulanceRoutes = [
  // ── Index ──────────────────────────────────────
  <Route key="amb-index" index element={<Navigate to={AMBULANCE_ROUTES.OVERVIEW} replace} />},

  // ── Overview ────────────────────────────────────
  <Route key="amb-overview" path="overview" element={page(AmbulanceOverview)} />,

  // ── Fleet & Assets ──────────────────────────────
  <Route key="amb-fleet" path="fleet" element={page(FleetWorkspace)}>
    <Route index element={<Navigate to={AMBULANCE_ROUTES.FLEET_OVERVIEW} replace />} />
    <Route path="overview" element={page(AmbulanceList)} />
    <Route path="add" element={page(AmbulanceFormPage)} />
    <Route path="maintenance" element={page(MaintenanceList)} />
  </Route>,

  // ── Dispatch Center ─────────────────────────────
  <Route key="amb-dispatch" path="dispatch" element={page(DispatchWorkspace)}>
    <Route index element={<Navigate to={AMBULANCE_ROUTES.DISPATCH_ACTIVE} replace />} />
    <Route path="active" element={page(ActiveTripList)} />
    <Route path="all" element={page(TripList)} />
    <Route path="request" element={page(NewTripPage)} />
    <Route path=":uuid" element={page(TripDetailPage)} />
  </Route>,

  // ── Crew ─────────────────────────────────────────
  <Route key="amb-crew" path="crew" element={page(CrewWorkspace)}>
    <Route index element={<Navigate to={AMBULANCE_ROUTES.CREW_ASSIGNMENTS} replace />} />
    <Route path="assignments" element={page(CrewList)} />
    <Route path="assign" element={page(CrewAssignPage)} />
  </Route>,
];
```

---

## 9. File Structure

```
src/renderer/
  app/
    routes/
      constants/
        shared.paths.ts                    # + AMBULANCE: '/ambulance'
        ambulance.paths.ts                 # NEW
      routeConstants.ts                    # + barrel export
      modules/
        ambulance.tsx                      # NEW - route definitions
      ProtectedRoutes.tsx                  # + lazy import + <Route>
  modules/
    ambulance/
      api/
        ambulance/
          ambulanceTypes.ts
          useAmbulanceQueries.ts
        trip/
          tripTypes.ts
          useTripQueries.ts
        crew/
          crewTypes.ts
          useCrewQueries.ts
        log/
          logTypes.ts
          useLogQueries.ts
      ui/
        AmbulanceModule.tsx                # Shell (BaseModuleWorkspace)
        overview/
          AmbulanceOverview.tsx            # Dashboard
        fleet/
          FleetWorkspace.tsx               # Horizontal actions container
          AmbulanceList.tsx                # Fleet table
          AmbulanceFormDrawer.tsx          # Add/edit vehicle
          AmbulanceFormPage.tsx            # Wraps drawer
        dispatch/
          DispatchWorkspace.tsx            # Horizontal actions container
          ActiveTripList.tsx               # Active trips only
          TripList.tsx                     # All trips table
          NewTripPage.tsx                  # Request trip form
          TripDetailPage.tsx              # Detail + status stepper + logs
        crew/
          CrewWorkspace.tsx               # Horizontal actions container
          CrewList.tsx                    # Assignments table
          CrewAssignPage.tsx              # Assignment form
  shared/
    navigation/
      moduleWorkspaceOperations.tsx        # + ambulance operations
    components/
      Navigation/
        Sidebar.tsx                        # + ambulance menu item
```

---

## 10. Status Workflow

```
requested → dispatched → en_route → on_scene → transporting → at_destination → completed
                                                                                cancelled
```

### Status → Available Actions
| Current Status | Available Actions |
|----------------|-------------------|
| requested | dispatch, cancel |
| dispatched | en-route, cancel |
| en_route | on-scene, cancel |
| on_scene | patient-contact, cancel |
| transporting | at-destination, cancel |
| at_destination | complete, cancel |
| completed | (none) |
| cancelled | (none) |

---

## 11. Filters (All List Endpoints)

- `status` — filter by current status
- `vehicle_type`, `trip_type`, `priority` — enum filters
- `facility_id` — scope to facility
- `patient_id` — trips for a patient
- `ambulance_id` — trips by vehicle
- `from_date`, `to_date` — date range
- `search` — free-text search
- `per_page` — pagination

---

## 12. Phased Delivery

| Phase | Files | Scope |
|-------|-------|-------|
| **P1 Foundation** | 4 | Route constants, module operations, sidebar entry |
| **P2 API Layer** | 8 | Types + React Query hooks for all 4 entities |
| **P3 Shell + Routes** | 3 | Module shell, 3 workspace containers, route definitions, ProtectedRoutes registration |
| **P4 UI Components** | 10 | Dashboard, fleet CRUD, trip dispatch, crew management |
| **P5 Sidebar** | 1 | Menu item in Sidebar.tsx |

**Total: ~26 files**

---

## 13. Reference Files

| Reference | Path |
|-----------|------|
| Laboratory route constants | `src/renderer/app/routes/constants/laboratory.paths.ts` |
| Laboratory module shell | `src/renderer/modules/laboratory/ui/LaboratoryModule.tsx` |
| Laboratory route definitions | `src/renderer/app/routes/modules/laboratory.tsx` |
| Pharmacy Front Desk (actions pattern) | `src/renderer/modules/pharmacy/ui/patients/PharmacyFrontDesk.tsx` |
| Pharmacy Action Center (actions pattern) | `src/renderer/modules/pharmacy/ui/action-center/PharmacyActionCenter.tsx` |
| BaseActionWorkspace | `src/renderer/shared/components/workspace/BaseActionWorkspace.tsx` |
| BaseModuleWorkspace | `src/renderer/shared/components/workspace/BaseModuleWorkspace.tsx` |
| Sidebar menu items | `src/renderer/shared/components/Navigation/Sidebar.tsx` |
| ProtectedRoutes registration | `src/renderer/app/routes/ProtectedRoutes.tsx` |
