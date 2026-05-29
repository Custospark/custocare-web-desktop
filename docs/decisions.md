# Architecture Decision Records

---

## 2026-05-27: Rename `max_patients_per_month` → `max_visits_per_month` + Frontend Limit Guards

**Context:** The column `max_patients_per_month` on the `plans` table was semantically misleading — the actual enforcement in `UsageService::getVisitsCount()` counts **all visits** (every encounter), not unique patients. Additionally, the frontend had plan limit guards only on the Staff Invitation flow; Department creation, Visit creation, and `StaffCreationForm` all lacked frontend enforcement, relying solely on backend validation errors.

**Decisions:**

- **Column renamed** `max_patients_per_month` → `max_visits_per_month` across the full stack (migration, model, service, resource, requests, seeder, TS types, config, display components)
- **New utilities** `isDepartmentLimitReached()` and `isVisitLimitReached()` added to `entitlements.ts`
- **`usePlanEntitlements` hook** now returns `departmentLimitReached` and `visitLimitReached`
- **Frontend guards added to 3 components:**
  - `StaffCreationForm.tsx` — staff limit banner + plan-filtered modules + submit disabled at capacity
  - `AdminFacilitySetup.tsx` / `DepartmentFormDrawer.tsx` — department limit banner + submit disabled
  - `MRPatientCreate.tsx` / `MRPatientSearch.tsx` — visit limit banner + create disabled

**Counting unchanged:** Visits still count total encounters (not unique patients). The rename aligns the column name with the actual counting logic.

---

## 2026-05-26: Facility Receipts & Invoices (billing documents)

**Context:** Facilities need formal invoices (amount due) and receipts (proof after admin approval), issued by Custospark Company Ltd for the Custocare product.

**Decisions:**
- **Issuer:** `BillingIssuer` constant — Custospark Company Ltd, Kampala, Uganda, www.custospark.com; Custocare is a product of Custospark.
- **Invoice:** Created when facility submits payment (`recordPayment`); line items from `latest_quote` metadata; status unpaid until approved.
- **Receipt:** `receipt_number` (RCP-YYYY-####) assigned on admin `approvePayment`; linked invoice marked paid.
- **API:** `GET .../billing-documents/invoices`, `.../invoices/{id}`, `.../receipts`, `.../receipts/{payment}` return list + full `document` payload for preview/print/download.
- **FE:** Plans & Subscriptions operation renamed **Receipts & Invoices**; tabbed UI (like platform admin Subscriptions/Payments); `BillingDocumentPreview` clinical-style layout.

---

## 2026-05-26: Restore facility functionalities (backend context resolve)

**Context:** After trial start or payment approval, Redux often still had owner-restricted modules while the subscription API reported `has_access`. Users needed an explicit, reliable way to reload module access from the server.

**Decisions:**
- **`GET /user/context/resolve`** is the single source of truth for module lists (`UserContextResolverService` uses subscription + plan features).
- **`restoreFacilityFunctionalityFromBackend`** — refetch subscription, resolve context, `setUserContext` + `switchCapability('staff')` + `switchFacility`.
- **`useRestoreFacilityFunctionality`** — detects stale Redux via `facilityContextNeedsRestore` (live access + owner-only modules) and optional approved-payment edge case.
- **UI:** `RestoreFacilityFunctionalityBanner` on Subscriptions and Payments; auto-restore after **Start Free Trial**; Layout hook still auto-syncs once per mismatch.
- **Backend:** `createSubscription` calls `moduleSyncService->syncForSubscription` when `hasAccess()` (trial) so DB role modules align before context resolve.

---

## 2026-05-26: Billing period dates, days remaining, and plan pricing context

**Context:** After payment approval, `activateSubscription()` called `$now->addMonth()` twice on the same Carbon instance, pushing `next_billing_date` ~2 months out and inflating `days_remaining`. Quotes/proration always read live `plans.price_usd`, which breaks when catalog prices change mid-period.

**Decisions:**
- **Activation:** one `$periodEnd = $now->copy()->addMonth()`; `starts_at`, `ends_at`, and `next_billing_date` each use explicit copies.
- **`days_remaining`:** calendar days until `trial_ends_at` (trial) or `next_billing_date` (else `ends_at`).
- **`metadata.billing_period_price_usd`:** locked on activation/renewal (from quote monthly line or catalog); used as **old** price in proration. **Renewal quotes** use current catalog price. **Upgrade-now** charges target plan catalog price for the remainder. **First activation** quotes use catalog at quote time.

---

## 2026-05-26: Subscription `payment_action` (backend source of truth)

**Context:** FE inferred "payment required" from plan slice, trial status, metadata, and payment list. Navbar already showed payment state from subscription; plan cards and Payments duplicated fragile client logic.

**Decision:**
- **`SubscriptionPaymentActionResolver`** (BE) returns `payment_action` on `SubscriptionResource`: `required`, `pending_approval`, `plan_id`, `intent` (`subscription` | `renewal` | `upgrade_now`), `label`, `message`.
- Resolves: pending payment proof → pending approval; `metadata.pending_upgrade_plan_id` → upgrade payment; trial without `approved_at` → subscription payment; `past_due` → renewal payment.
- **FE:** `subscriptionPaymentUtils.ts` + `AvailablePlans` ("Complete payment" pill/button), `Payments.tsx` (guided steps + quote from `payment_action` only), `FacilitySubscriptions.tsx` banners, navbar `getSubscriptionDisplay` — no plan slice for payment flow.

---

## 2026-05-26: Facility subscription billing v2 (scheduled changes, proration, quotes)

**Context:** Cancel and plan changes applied immediately on the FE (cancel + recreate). Payments used hardcoded plan price + onboarding. UI showed "Current Plan" after cancellation. Trial copy hardcoded 7 days.

**Decisions:**
- **Cancel at period end** (facility): `status` stays `active`; `metadata.cancel_at_period_end` + `access_ends_at`; `hasAccess()` until `ends_at`. Immediate cancel = platform admin only.
- **`subscription_scheduled_changes`** table: one pending row per subscription; types `upgrade`, `downgrade`, `cancel`, `plan_change`.
- **Apply pending on read** — `applyPendingScheduledChanges()` in `getSubscriptionForFacility()` and `EnsureFacilitySubscriptionIsActive` (no cron).
- **Upgrade paths:** schedule (next cycle, $0 quote) vs upgrade now (proration due, `upgrade_proration` payment type, plan swaps on admin approve).
- **`GET .../subscription/payment-quote`** + server validates `POST .../payments` amount (±$0.01) via `quote_intent` / `target_plan_id`.
- **FE:** `AvailablePlans` uses schedule/upgrade-now APIs; "Your plan" pill; `Payments` consumes quote line items only.
- **Navbar `Subscription.tsx`:** Uses `effective_plan`, status badges (Trial / Active / Ending / Change scheduled / Past due), cancel + scheduled-change callouts in dropdown; inactive CTA when `!has_access`; brand badge in `Navbar.tsx` hidden when no access.

**API (facility):**
| Method | Path |
|--------|------|
| POST | `/facilities/{facility}/subscription/schedule-change` |
| POST | `/facilities/{facility}/subscription/upgrade-now` |
| DELETE | `/facilities/{facility}/subscription/scheduled-change` |
| GET | `/facilities/{facility}/subscription/payment-quote?intent=&plan_id=` |

**Plan:** `docs/plans.md`

---

## 2026-05-26: Offline full-screen page (preview route)

**Context:** Users need a dedicated offline state matching 404 / ErrorBoundary styling, with theme from `uiSlice`.

**Decision:**
- `Offline.tsx` in `shared/components/Errors/` — `selectTheme` + `selectUser` (greeting via `profile.first_name` or first token of display name; generic copy if unauthenticated).
- Concise, empathetic copy; `BrandName` + `BRAND_TAGLINE` (same as navbar); no dashboard CTA — global overlay for any route.
- Actionable “What you can try” tips; Reconnect dispatches `checkNetworkConnectivity`.
- **`networkSlice`** (`systemStatus`: online | slow | offline) — monitor at root via `NetworkOfflineOverlay`; full-screen UI only when `offline` (slow keeps app usable). Layout status bar reads same slice.
- Connectivity toasts: `info` (offline) / `success` (back online), 8s, **top-center**, `z-index` 10001 (above overlay); personalized via `getUserFirstName`.
- Preview route `ROUTES.OFFLINE` (`/offline`) in `ErrorRoutes`; listed in `ModuleAccessMiddleware` bypass lists. No `navigator.onLine` wiring yet.
- **Preview URL (dev):** `http://localhost:5173/#/offline`

**Later:** Gate app or overlay from `seNetworkStatus` / browser `offline` events.

---

## 2026-05-26: Message contact notebook (owner-scoped address book)

**Context:** Users could not search recipients by name; compose only had device-local frequent contacts with plain email/phone. Messaging still resolves recipients via `User` `email_hash` / `phone_hash`.

**Decisions:**
- New `user_message_contacts` table: `owner_user_id`, `display_name`, optional `linked_user_id`, encrypted + hashed email/phone (same pattern as `User`).
- API: `GET/POST/PUT/DELETE /api/message-contacts`, `POST /message-contacts/resolve`, `POST /message-contacts/{id}/touch`.
- FE: **Messages → Contacts** page + compose picker merges notebook with `compose_contacts_v1` local frequent list.
- **Save to contacts** is manual (button in compose); send path unchanged.

---

## 2026-05-25: Compose recipients — email or international phone

**Context:** Account Message Center compose allowed free-text “email or phone” without dial-code UI. Phone values often did not match signup format (`+{dial}{digits}`), so `MessageService` could not resolve `users.phone_hash`.

**Decisions:**
- Shared `phoneNumber.ts` + `PhoneInputWithCountryCode` (same `countryCodes` as SignUp).
- `ComposeRecipients`: per-row Email / Phone toggle; phone path uses dial picker + local digits → full international string.
- API payload sends normalized `+…` phone only (XOR with email per recipient); backend unchanged (`MessageController` + `MessageService` hash lookup).

---

## 2026-05-24: Platform admin plan CRUD aligned with PlanFeatures

**Context:** `FacilityPlans` used legacy feature keys (`lab_integration`, `pharmacy_module`, etc.) that fail backend validation (`PlanFeatures::ALL`). Pagination `page` was not sent; onboarding fee `0` was coerced to `null`; stats reflected the current page only.

**Decisions:**
- Added `shared/billing/planFeatureCatalog.ts` mirroring `PlanFeatures` module + addon keys (same set as `entitlements.ts` / BE).
- Platform plan form sends `buildPlanFeaturesPayload()` only; removed custom feature keys.
- `AdminPlanFilters.page` wired to list query; edit form hydrates from list row `PlanResource` (same shape as show endpoint).
- `UpdatePlanRequest` accepts `billing_cycle`; plan search matches name or slug.

---

## 2026-05-24: Facility-owner-only subscription UI and plans access

**Context:** Navbar subscription widget and Plans & Subscriptions admin operations were visible to all staff. Non-owners could see “Choose a plan” CTAs and navigate to billing routes they cannot manage.

**Decisions:**
- **Navbar `Subscription` + brand plan badge:** Render only when `selectHasActiveStaffFacility` and `selectIsActiveFacilityOwner` (staff mode + active facility + owner).
- **Administration module/sidebar:** `filterAdministrationModuleOperations` / `filterAdministrationSidebarOperations` hide `plans-subscriptions` unless `isFacilityOwner`; `restrictToPlansOnly` applies to owners only (inactive subscription).
- **`ModuleAccessMiddleware`:** Denies `/administration/plans-subscriptions/*` for non-owners, patient mode, or staff without active facility.
- **Search (`useSearchFilter`):** Scopes results by capability, staff facility context, `accessibleModuleCodes`, and optional `facilityOwnerOnly`; patient mode includes `custocare_hub`.
- **Always-available modules:** `patient_dashboard` added alongside `account` and `custocare_hub` in FE `ALWAYS_AVAILABLE_MODULES` and BE `PlanFeatures::ALWAYS_AVAILABLE_MODULES`; assignable-modules API merges `patient_dashboard` + `custocare_hub` into allowed codes.

---

## 2026-05-24: Plan-Based Module Resolution for Staff Context

**Context:** Staff with facility assignments received modules solely from `facility_staff_roles.module_code`, ignoring the facility's subscription plan. The pricing strategy notebook (`Custocare_Pricing_Strategy.ipynb` §4) defines tier-gated module workspaces, but context resolution did not intersect role modules with plan features. Module/plan seed data was also out of sync (missing `patient_dashboard`, `custocare_hub`; Enterprise incorrectly included `platform_administration`).

**Decisions:**

**Backend (Laravel):**
- Extended `App\Constants\Billing\PlanFeatures` with canonical module codes, always-available modules (`account`, `custocare_hub`), tier default feature flags, and helpers: `enabledModuleCodes()`, `intersectRoleModulesWithPlan()`, `restrictedModuleCodes()`
- Updated `UserContextResolverService::resolveStaffFacilitiesWithModules()` to eager-load `facility.subscription.plan`, resolve plan-enabled modules via `Subscription::hasAccess()`, and intersect with role-assigned modules
- Restricted/suspended facilities and facilities without accessible subscriptions resolve to always-available modules only
- Updated `DatabaseSeeder` modules list to 13 codes aligned with Frontend Sidebar: added `patient_dashboard`, `custocare_hub`; ordered consistently
- Added `RoleModuleDefault` rows for `patient` and `staff` capability roles
- Updated `PlanSeeder` to derive features from `PlanFeatures::defaultFeatureFlagsForPlan()` — Essential (MR + admin + billing), Professional (+ nursing/clinical/lab/pharmacy), Enterprise (+ referrals/ambulance); removed `platform_administration` from plan tiers
- Added `tests/Unit/PlanFeaturesTest.php` (3 tests)

**Frontend (React/TypeScript):**
- Extended `shared/entitlements/entitlements.ts` with `SubscriptionModuleCode`, `ALWAYS_AVAILABLE_MODULES`, `MODULE_REQUIRED_TIER`, `PLAN_ENABLED_MODULES`, and `intersectRoleModulesWithPlan()` — mirrors Backend `PlanFeatures`

**Module tier mapping (source of truth):**

| Tier | Gated modules |
|------|---------------|
| Essential | `medical_records`, `administration`, `billing`, `patient_dashboard` |
| Professional | + `nursing`, `clinical`, `laboratory`, `pharmacy` |
| Enterprise | + `referrals`, `ambulance` |
| Always available | `account`, `custocare_hub` |
| Internal only | `platform_administration` (Spatie `super_admin`) |

**Trade-offs:**
- Role assignments may still store modules above the plan tier; resolution-time intersection keeps DB assignments intact while gating UI access. Future work could validate assignments at invite/assign time.
- Notebook uses `patient_portal` / `referral` naming; codebase standard is `patient_dashboard` / `referrals` — documented here to avoid drift.

---

## 2026-05-24: Plan Limit Enforcement (Staff, Departments, Visits)

**Context:** Subscription plans define `max_staff`, `max_departments`, and `max_visits_per_month` but limits were not enforced when inviting staff, creating departments, or registering visits. Invitation UI also listed all modules regardless of plan tier.

**Decisions:**

**Backend (Laravel):**
- Added `PlanLimitService` + interface with `assertCanAddStaff`, `assertCanAddDepartment`, `assertCanCreateVisit`, `assertModulesAllowed`, `filterModulesForPlan`, `getPlanLimits`
- Updated `UsageService`: staff count = active/on_leave assignments + pending invitations (excluding staff already assigned); visits = total visits in current calendar month
- Extended `GET /facilities/{facility}/usage` to include plan `limits`
- Enforced limits in `StaffInvitationService` (create + accept), `FacilityStaffRoleService` (create assignment), `DepartmentService` (create), `VisitService` (new visit only — existing active visit reuse exempt)
- Module codes on invitations/assignments validated and filtered against plan features

**Frontend (React/TypeScript):**
- Added `usePlanEntitlements` hook + `getPlanEnabledModuleCodesFromPlan()` / `isStaffLimitReached()` in `entitlements.ts`
- `InvitationManager` filters module checkboxes by plan; shows staff limit banner; disables invite actions at capacity
- Extended `FacilityUsage` type with optional `limits`

**Counting rules:**
| Limit | Counts toward cap |
|-------|-------------------|
| Staff | Distinct staff with `active`/`on_leave` assignment + pending non-expired invitations for unassigned staff |
| Departments | Active departments at facility |
| Visits/month | All visits with `arrived_at` in current calendar month (new visit creation blocked; reuse of active visit allowed) |

**Facility owners without active subscription:**
- Context resolver returns `account`, `custocare_hub`, and **`administration`** (not only account/hub) so owners can manage plans and billing.
- Portal selector: owner workspace card shows “Renew subscription” and routes to **Plans & Subscriptions**; regular staff get limited access toast and dashboard with account/hub only.
- Invitation module picker uses owner administration fallback via `usePlanEntitlements` + `PlanLimitService::getAssignableModuleCodes(..., $inviterIsOwner)`.

---

## 2026-05-24: Restore Full Plan Modules After Subscription Approval

**Context:** After platform admin approved payment, subscription status became `ACTIVE` but facility owners stayed on the 3-module restricted set (`account`, `custocare_hub`, `administration`). Staff invited during inactive subscription had truncated `facility_staff_roles.module_code` persisted in DB. Context resolution intersected stored modules with the plan, so access could never expand.

**Decisions:**

**Backend:**
- `FacilityStaffRoleModuleSyncService` runs on `activateSubscription()` and `renewSubscription()` — owners get full plan modules; staff get `RoleModuleDefault` ∩ plan
- `UserContextResolverService`: owners with active subscription receive full plan modules (no intersection with truncated DB row); staff with restricted-only stored modules fall back to role defaults at resolve time
- `PlanFeatures::isRestrictedOnlyModuleSet()` detects inactive-subscription fallback module sets
- Artisan repair: `php artisan billing:sync-facility-modules` (optional `--facility=`)

**Frontend:**
- `useSubscriptionAccessContextRefresh` in `Layout` re-fetches `/user/context/resolve` when live subscription reports `has_access` but Redux modules are still owner-restricted

**Trade-offs:** Staff still receive role-scoped modules within the plan (not every plan module for every role). Re-run sync command once for facilities approved before this deploy.

---

## 2026-05-24: Plan-Scoped Assignable Modules for Invitations

**Context:** Invitation module picker loaded all modules via `GET /modules` and filtered client-side with `usePlanEntitlements`, which could drift from backend `PlanLimitService` rules.

**Decisions:**
- **Backend:** `GET /api/facilities/{facility}/assignable-modules` via `AssignableModuleService` — uses `PlanLimitService::getAssignableModuleCodes()` (same source as invitation validation); excludes `account` and `platform_administration` from picker; returns plan name/slug
- **Frontend:** `useGetFacilityAssignableModules` + `InvitationManager` uses backend list only; client validates selection ⊆ `allowed_module_codes`
- **Edit Staff Permissions:** `StaffPermissionDrawer` uses the same assignable-modules endpoint; `FacilityStaffRoleService::updateAssignment` enforces plan limits using **editor** ownership (not target staff) so owners can grant `administration` to staff without making them facility owners

---

## 2026-05-24: Administration Route Constants & Context Navigation Parity

**Context:** Plans/subscriptions URLs were duplicated and sometimes wrong (`available-plans`, `/payments` vs registered `/plans`, `/payment-methods`). Hardcoded paths appearedClass scattered across Portal Selector, Navbar, Sidebar, and Admin shell. Facility context switching did not consistently land owners without subscriptions on Plans & Subscriptions.

**Decisions:**

**Route constants (`administration.paths.ts`):**
- Canonical `ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES` + `ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTE_SEGMENTS` for nested `<Route>` paths
- `ADMIN_ROUTES` plan/settings entries alias the canonical constants (no duplicate path strings)

**Registered child routes (`plans-and-subscriptions.tsx`, `facility-settings.tsx`):**
- Relative segments under parent shells; index redirects to `plans` / `identity`
- Components: `AvailablePlans`, `FacilitySubscriptions`, `Payments`, `Invoices`; `FacilityIdentity`, `OperationalPolicy`
- `BILLING_DETAILS` constant reserved — no route until a component exists

**Navigation parity (`facilityContextNavigation.ts`):**
- `resolveStaffFacilityLandingPath()` — restricted → dashboard; owner w/o sub → `AVAILABLE_PLANS`; staff w/o sub → dashboard
- `mergeStaffFacilityContext()` merges Redux facility assignment with portal role flags (strict `=== true` checks; no `?? true` defaults)
- Shared by **Navbar** context switcher, **Portal Selector** workspace cards, **Sidebar** admin landing href, **AdminModule** redirect guard, **AdministrationIndexRedirect**

**Trade-offs:**
- Admin child routes in `admin.routes.tsx` still use absolute paths (existing pattern); plans/settings use relative nested segments under `ProtectedRoutes`.

---

## 2026-05-24: Subscription Invoices & Receipts Feature

**Context:** The subscription billing system had Plans, Subscriptions, and Payments but no structured invoices or receipts for facilities. Facilities needed formal invoicing for their subscription fees (monthly renewals, onboarding fees) with printable receipt documents.

**Decisions:**

**Backend (Laravel):**
- Created `InvoiceStatus` enum (`paid`, `unpaid`, `overdue`, `partially_paid`, `cancelled`, `refunded`) and `InvoiceType` enum (`subscription`, `renewal`, `onboarding`, `adjustment`) in `app/Enums/Billing/`
- Created `invoices` migration with columns: `subscription_id`, `facility_id`, `invoice_number` (unique), `invoice_type`, `status`, `amount`, `currency`, `paid_amount`, `description`, `line_items` (JSON), `issued_at`, `due_at`, `paid_at`, `cancelled_at`
- Created `Invoice` model with relationships to `Subscription` and `Facility`, scopes (`forFacility`, `paid`, `unpaid`), and helper methods (`isPaid`, `isOverdue`, `balanceDue`)
- Created `InvoiceRepositoryInterface` / `InvoiceRepository` following existing billing repository pattern with filtering by status, type, date range
- Created `InvoiceServiceInterface` / `InvoiceService` with `createInvoice`, `markAsPaid`, `cancelInvoice`, plus `generateInvoiceNumber` (auto-incrementing INV-YYYY-NNNN)
- Created `InvoiceResource` (returns camelCase frontend-friendly shape with computed `balance_due`, nested subscription/facility when loaded)
- Created `InvoiceController` (facility-facing: `GET /invoices`, `GET /invoices/{invoice}`) and `Admin\InvoiceController` (admin: `GET /invoices`, `GET /invoices/{invoice}`, `POST /invoices/{invoice}/mark-paid`, `POST /invoices/{invoice}/cancel`)
- Registered routes in `facilitySubscriptions/_index.php` under both facility and admin groups
- Added `InvoiceRepository` and `InvoiceService` bindings to `BillingServiceProvider`

**Frontend (React/TypeScript):**
- Added `InvoiceStatus`, `InvoiceType`, `Invoice`, `InvoiceLineItem` types plus request/response types, filter types, and label maps to `SubscriptionTypes.ts`
- Added invoice query keys + hooks to `SubscriptionQueries.ts`: `useGetFacilityInvoices`, `useGetFacilityInvoice`, `useGetAdminInvoices`, `useGetAdminInvoice`, `useAdminMarkInvoicePaid`, `useAdminCancelInvoice`
- Built `Invoices.tsx` — full component with search, filter controls, paginated table, status badges (color-coded by status), invoice detail modal with line items breakdown, and receipt download
- Built `PrintableInvoiceReceipt.tsx` — modal receipt view with print/download support, line items table, facility info, status watermark, and print-optimized HTML output
- Registered the Invoices route in `plans-and-subscriptions.tsx` with lazy loading

---

## 2026-05-23: Error Boundary — Friendlier Icon & Visual Tone

**Context:** Users found the `AlertTriangle` icon with `animate-pulse` on the error boundary page alarming and unsettling. The red-tinted background gradient also contributed to a stressful experience during errors.

**Decisions:**
- Replaced `AlertTriangle` (lucide-react) with `Frown` — a sympathetic sad face icon conveys empathy rather than alarm
- Removed `animate-pulse` so the icon is static and calm
- Changed background gradient from `red-50/orange-50/yellow-50` to `blue-50/indigo-50/purple-50` — a calming cool palette
- Changed icon color from `text-red-500` to `text-amber-400` — softer, less urgent
- Messaging ("Something Went Wrong" + friendly description) was already correct and unchanged

**Follow-up (2026-05-23): Theme awareness**
- Added optional `theme?: 'light' | 'dark'` prop to `ErrorBoundary`
- Replaced all `dark:` Tailwind classes with explicit `cn()` + `isDark` ternary pattern for programmatic theme control
- Data flow: `Redux uiSlice → SuspenseWrapper useSelector → <ErrorBoundary theme={theme}>`
- Updated `routeUtils.tsx` to pass the theme from Redux into ErrorBoundary

---

## 2026-05-22: Custocare Hub + Platform Admin — Optimistic Updates, Meaningful Icons, Refresh Buttons

**Context:** All Custocare Hub user-facing actions (View Discussions, Create Post, Feature Ideas, Vote, Submit Feedback, Open Ticket, etc.) and their corresponding Platform Admin management pages lacked optimistic UI updates, meaningful action icons, and manual refresh controls. Users had to wait for mutation responses before seeing their changes reflected, the horizontal action strip used a generic `FileText` icon for everything, and there was no way to manually refresh lists.

**Decisions:**

**1. Horizontal Action Icons — HubOperationWorkspace**
- Added optional `icon?: string` field to `HubHorizontalAction` interface in `hubConfig.ts`
- Assigned 16 unique lucide-react icon names across all Hub operations (Rocket, PlayCircle, GraduationCap, BarChart3, MessageSquare, SquarePen, Lightbulb, Megaphone, Search, Ticket, Waypoints, HelpCircle, MessageSquareHeart, WandSparkles, Heart, ClipboardCheck)
- `HubOperationWorkspace.tsx` now dynamically renders the configured icon using `import * as Icons from 'lucide-react'` with `FileText` as fallback

**2. Optimistic Updates — 7 mutation hooks (Custocare Hub)**
- `useCreateHubCommunityPost` — optimistically prepends post to list cache, rolls back on error
- `useCreateHubCommunityComment` — optimistically appends comment to post detail cache
- `useCreateHubFeedback` — optimistically prepends to "mine" list cache
- `useVoteHubFeedback` — optimistically toggles vote state in roadmap cache
- `useCreateHubSupportTicket` — snapshot/rollback on create mutation

**3. Optimistic Updates — 5 query sets (Platform Admin)**
- `usePlatformHubFeedbackQueries` — update mutation patches list item, rolls back
- `usePlatformHubSupportTicketQueries` — update mutation patches list item
- `usePlatformHubSupportFaqQueries` — create/update/delete all have optimistic cache + rollback
- `usePlatformHubProductUpdateQueries` — create/update/delete optimistic cache + rollback
- `usePlatformLearningMaterialQueries` — create/update/delete optimistic cache + rollback

All use `onMutate` (cancel + snapshot), `onError` (rollback), `onSettled` (invalidate) pattern.

**4. Refresh Buttons — 10 UI views (Hub + Admin)**
- Added `RefreshCw` icon buttons to: CommunityChannelView, FeedbackRoadmapView, FeedbackMyRequestsView, LearningCenterMaterialsView, SupportFaqsView (was already there, improved), SupportTicketsTrackView (was already there)
- Fixed FeedbackMyRequestsView + FeedbackRoadmapView to use `isFetching` (not `isLoading`/`voteMut.isPending`) for the refresh spin — icon now spins on manual refresh, not just initial load
- Improved existing refresh buttons on all 5 Platform Admin pages (disabled state when fetching, spinning animation)
- All refresh buttons call `refetch()` and show a spinner animation while fetching

**5. Navigation Improvements**
- CommunityCreatePostView — added "Back to Discussions / Feature Ideas" link with ArrowLeft icon
- SupportTicketsOpenView — replaced generic `Plus` icon with `Ticket` icon

**6. Tracking UUID Display**
- FeedbackSubmitForm — now shows a confirmation banner with the submission UUID and a "Save this reference" reminder after creation
- SupportTicketsOpenView — improved existing confirmation banner with "Save this reference" reminder text
- CommunityCreatePostView — toast now includes the first 8 chars of the created post UUID

**7. Support Ticket Tracking — User-Friendly Error Message**
- `SupportTicketsTrackView.tsx` — when the backend returns a route-not-found error (`"could not be found"` in the message), the UI now shows `"Ticket not found. Please check your reference number and try again."` instead of the raw Laravel route path error

**9. Sidebar Support Card — Feedback Link**
- `SidebarFooter.tsx` — added a "Send Feedback" button with `MessageSquareHeart` icon below the support phone, navigates to `CUSTOCARE_HUB_ROUTES.FEEDBACK_REQUESTS`

**8. Custocare Hub Quick Access Icons — Top Layout Bar**
- `QuickActions.tsx` — added 4 Custocare Hub operation icons (GraduationCap, MessageSquare, LifeBuoy, MessageSquareHeart) in the top status bar, wrapped in `hidden lg:flex` so they appear only on large screens
- Icons use the same as sidebar navigation: `GraduationCap`, `UsersRound`, `LifeBuoy`, `MessageSquareHeart` (matches `moduleWorkspaceOperations.tsx`)
- Icons navigate directly to: Learning Center, Community, Support Center, Feedback & Requests using `CUSTOCARE_HUB_ROUTES` constants
- Separated from the existing action icons by a vertical divider (`border-r`)

**Files changed: 22 files across custocare-hub/ and platform-administration/**
- 6 API hook files (optimistic updates)
- 11 UI view files (refresh buttons + icons)
- 1 config file (icon assignments)
- 1 workspace component (dynamic icon rendering)

**Trade-offs:**
- Optimistic updates assume mutation success for UX responsiveness. On rare server failures, the UI briefly shows the optimistic state before rolling back, which may be confusing. The toast notification helps users understand failures.
- Dynamic icon resolution via `Icons[key]` requires all lucide icons used to be importable. The barrel import `import * as Icons from 'lucide-react'` ensures tree-shaking still works as long as the icons are referenced.
- Refresh buttons add clutter if users rarely need them, but the pattern is consistent with the rest of the app and provides a manual escape hatch for stale data when auto-refetch intervals are conservative.

**Context:** The workspace card image on the Portal Selector page took its natural height on large screens (`lg:h-auto`), making it disproportionately tall compared to the card's content area. Additionally, the greeting was computed once on mount via `useMemo([], [])`, so it could show the wrong time-of-day greeting if the component stayed mounted across time boundaries.

**Decisions:**

1. **Image height** — Changed `lg:h-auto` to `lg:h-full` + `min-h-0` in `WorkspaceCard.tsx:98`. On large screens (flex row layout), the image container now fills the card's full height instead of taking its natural image height. The `object-cover` class on the `<img>` already crops the image proportionally, so it stays sharp.

2. **Greeting** — Removed `useMemo` and replaced with an IIFE that computes `new Date().getHours()` at render time. This ensures the greeting always reflects the user's browser local time whenever the component re-renders (instead of being frozen on mount).

**Files changed (FE — 2 files):**
- `WorkspaceCard.tsx` — image container: `lg:h-auto` → `lg:h-full min-h-0`
- `WelcomeSection.tsx` — removed `useMemo` import, greeting computed at render time via IIFE

**Trade-offs:**
- `lg:h-full` depends on the flex container's implicit height (stretch behavior). In a flex row, children stretch to match the tallest child by default, so the image fills the full card height correctly.
- Computing the greeting at render time means it updates whenever React re-renders (triggered by state/prop changes or parent re-render). For a portal selector page where users spend seconds, this is sufficient — no timer needed.

## 2026-05-22: Nursing Tasks & Shifts — Count Badge Contrast Fix

**Context:** The Available/Busy/Total count badges in `AssignTaskView` and `ShiftHandoverView` used overly subtle backgrounds on dark theme (`dark:bg-emerald-900/50`, `dark:bg-amber-900/50`, `dark:bg-gray-800`) with low-contrast text, making them barely visible. Light theme contrast was also poor.

**Decision:**
- Increased background opacity on dark theme: `dark:bg-emerald-800/60`, `dark:bg-amber-800/60`, `dark:bg-gray-600`
- Brighter text on dark theme: `dark:text-emerald-200`, `dark:text-amber-200`, `dark:text-gray-100`
- Added `font-medium` for better readability at `text-xs`
- Light theme kept the same background levels (100) but text bumped to 800/700 for extra contrast

**Files changed (FE — 2 files):**
- `AssignTaskView.tsx` — 3 badge class strings updated
- `ShiftHandoverView.tsx` — 3 badge class strings updated

**Trade-offs:**
- Solid/opaque backgrounds on dark mode trade subtlety for readability. The 60% opacity backgrounds still show some of the underlying page color while being clearly distinct pill shapes.
- No structural or logic changes — purely class string updates.

---

## 2026-05-22: Shift Handover — Removed Duplicate Success Toast

**Context:** After a successful shift handover, two success toasts fired. The `useBulkReassignStaff` mutation in `useVisitQueries.ts` had its own `onSuccess` toast ("Visits reassigned successfully."), and the `ShiftHandoverView.submit()` handler showed a second toast ("Shift handover recorded. X visit(s) reassigned.").

**Decision:**
- Removed the toast from `useBulkReassignStaff.onSuccess` in `useVisitQueries.ts:905`
- The caller (`ShiftHandoverView`) already handles the success toast with a more specific message that includes the reassignment count and context

**Files changed (FE — 1 file):**
- `useVisitQueries.ts` — removed redundant `showToast` call from `useBulkReassignStaff.onSuccess`

**Trade-offs:**
- `useBulkReassignStaff` is only used by `ShiftHandoverView`, so removing the mutation-level toast has no impact on other callers. If a future component uses this hook, it will need to show its own success toast.
- The `onError` toast is kept in the mutation (no caller-level error toast), so errors still show feedback. Only the success toast was duplicated.

---

> Each entry records a design decision, its context, and the trade-offs considered.
> Read this before starting any feature to avoid repeating past mistakes.

---

## 2026-05-22: Walk-in Label — "Customer" → "Patient" in Pharmacy Walk-in UI

**Context:** The Pharmacy Dispense Medication entry point showed "Customer Walk-in" as the tab label and "Walk-in for unknown customers" in the help guide. The term "Customer" is pharmacy/commercial terminology, but the rest of the app uses "Patient" (the medical/clinical term). The backend already returns `display_name => 'Walk-in Patient'` in the API response, so only the frontend UI labels needed updating.

**Decision:**
- Changed tab label from `'Customer Walk-in'` → `'Walk-in Patient'`
- Changed help text from `'Walk-in for unknown customers'` → `'Walk-in for unknown patients'`
- Updated inline comment from `'Customer Walk-in'` → `'Walk-in Patient'`

**Files changed (FE — 1 file):**
- `DispenseMedication.tsx` — 3 user-facing string replacements

**Trade-offs:**
- No backend changes needed — the `display_name` was already `'Walk-in Patient'`.
- Internal code naming (component name `CustomerWalkIn`, module directory `customer-walkin/`, types `CustomerWalkInProps`) was not changed to minimize diff scope. These are internal identifiers not visible to users.

---

## 2026-05-21: Refund Amount Capped at Total Paid — Prevents Over-Refunding Partial Payments

**Context:** When a patient made a partial payment of 5000 on a total of 5500, the system allowed a full refund of 5500 (the grand total) instead of capping at 5000 (what was actually paid). Three root causes were identified:

1. **Frontend `totalRefund` computation** used `grandTotal` directly for full refunds without considering `totalPaid`
2. **Backend `cashRefundAmount`** was set to the sum of refunded line item net amounts, never capped at `originalTotalPaid`
3. **Backend `adjustment_amount`** recorded the theoretical line-item total (5500) instead of the actual cash refunded (5000)

Separately, inventory ledger entries for refund/void stock restorations used the generic `'reconciliation'` transaction cause, making them indistinguishable from manual adjustments in inventory history.

**Decisions:**

**1. Frontend `RefundModal.tsx` — Cap totalRefund at totalPaid**
- Extracted `maxRefundable` from `selectedTransaction.billing_data.totalPaid` at the top of the `totalRefund` useMemo
- Full refund path: `Math.min(grandTotal, maxRefundable)` instead of raw `grandTotal`
- Partial refund path: `Math.min(computedAmount, maxRefundable)` for the final return

**2. Backend `RefundService.php` — Cap cashRefundAmount at originalTotalPaid**
- After computing `$cashRefundAmount` from refund plans, added a cap: if `$originalTotalPaid > 0` and `$cashRefundAmount > $originalTotalPaid`, cap it and log a warning
- Changed `adjustment_amount` in the `createFinancialAdjustment` call from `$cashRefundAmount` to `round($patientRefundAmount + $insuranceRefundAmount, 2)` — the actual cash refunded after payer split

**3. Backend `RefundService.php` + `InventoryLedgerService.php` — Distinct transaction cause for refund/void restorations**
- Added 4th `$transactionCause` parameter to `restoreInventoryForRefundedLineItems()` (default `'reconciliation'` for backward compat)
- Refund caller passes `'refund_restoration'`, void caller passes `'void_restoration'`
- `InventoryLedgerService::recordAdjustment()` changed to preserve `transaction_cause` from input data, falling back to `'reconciliation'` only when not provided

**Files changed (FE):**
- `RefundModal.tsx` — capped `totalRefund` at `totalPaid` for full and partial paths

**Files changed (BE):**
- `RefundService.php` — capped `$cashRefundAmount`, fixed `adjustment_amount`, added `$transactionCause` param (3 call sites updated)
- `InventoryLedgerService.php` — `recordAdjustment()` preserves custom `transaction_cause`

**Trade-offs:**
- Capping at `totalPaid` rather than returning an error means the refund still processes gracefully for the maximum refundable amount. Users see the capped amount in the UI.
- The `adjustment_amount` correction affects reporting — historical records may have the inflated amount. New records will correctly reflect actual cash refunded.
- Adding a 4th parameter to a private method is safe; no public API/interface changes needed.

---

## 2026-05-18: Email Verification Flow for Unverified Login

**Context:** When a user registers but doesn't verify their email, then tries to log in, the system must send a new OTP and redirect to the verification page — not just reject with a generic error.

**Decision:**
- Backend returns `HTTP 200` (not 403) for `EMAIL_NOT_VERIFIED` so it reaches React Query's `onSuccess` rather than `onError`
- Backend calls `sendEmailVerification()` in the login gate to dispatch a fresh OTP
- Backend returns the `$user` object so the frontend has `user_id` for verification APIs
- Frontend checks `data.code === 'EMAIL_NOT_VERIFIED'` before the generic `!data.success` catch-all
- TwoFactorAuthPage auto-sends verification code on mount when `flow === 'login'`

**Trade-offs:**
- `HTTP 200` with `success: false` is non-standard but consistent with the `MFA_REQUIRED` pattern already in place
- Storing `user_id` in the Redux slice avoids passing it through URL params (security best practice)

---

## 2026-05-18: Pre-Commit Hooks via Husky + Lint-Staged

**Context:** Vera catches issues before commits, but relies on manual execution. Automating the most common checks (lint) on every commit prevents trivial errors from reaching the remote.

**Decision:**
- Installed `husky` + `lint-staged` in the Frontend project
- Pre-commit hook runs `eslint --fix` on staged `.ts/.tsx` files
- Hook does NOT run `tsc --noEmit` or full test suite (too slow for pre-commit — those remain Vera's job)

**Trade-offs:**
- Pre-commit hooks add ~2-5s per commit for linting staged files only. Full-project checks are still Vera's domain.
- Skipped `tsc --noEmit` because it's slow and often has pre-existing errors unrelated to staged changes.

---

## 2026-05-20: Patient Registration Printout / Download (Revised)

**Context:** Original implementation had a basic printout but was missing facility context for staff registration and had an auto-redirect that prevented users from viewing/printing the confirmation.

**Decisions:**

**1. Two-mode printout: Staff vs Self-Registration**
- `PatientRegistrationPrintout` now accepts a `facility` prop (or `null` for self-registration)
- **Staff registration:** Header follows the exact clinical forms pattern — facility name (uppercase), badges, address, phone, email, facility code, and a gradient title banner reading "PATIENT REGISTRATION CONFIRMATION". Info rows show patient name, patient number, registered by (staff name from `selectUserDisplayName`), and registration date. Facility data pulled from `activeContextSlice.selectActiveFacility`.
- **Self-registration (onboarding):** Simpler header with emerald-colored styling and "Self-Registration via Patient Portal" subtitle. No facility data shown.
- Footer matches the clinical forms pattern exactly: "Electronically Generated Registration Confirmation" + description + tagline "Connected Care • One Identifier Across All Facilities" + print timestamp.

**2. Auto-redirect disabled for self-registration**
- `useRegisterPatient` in `PatientOnboarding` now passes `autoNavigateToDashboard: false` — the 1.5s setTimeout redirect in the mutation hook no longer fires
- User sees the success screen with printout and can print/download at their own pace
- "Continue to Patient Portal" button handles manual navigation when the user is ready

**3. Patient number universality**
- Printout includes a blue info banner: "This patient number is unique and valid across all Custocare facilities. Present this number at any facility during your next visit — no need to register again."

**Trade-offs:**
- Facility data comes from Redux `activeContextSlice` using the existing `selectActiveFacility` selector (same source as all clinical previews). No backend changes needed.
- Staff name comes from `selectUserDisplayName` (Redux auth slice) — priority: display_name > full_name > name. This is the currently logged-in user, not a separate "registered_by" field from the backend (which would require a BE change).
- Hidden DOM rendering (`className="hidden"`) keeps the printout in the DOM for `react-to-print` cloning without visual clutter in the modal.

---

## 2026-05-20: Fixed Allergies Count in MRPatientRecords (Double-Wrapped Response)

**Context:** The `MRPatientRecords` component (Patient Encounter Hub → Patient Records) showed "No historical data" even when allergies existed, and the Known Allergies stat always displayed 0. The backend `AllergyCollection` resource wraps data in a nested structure — `GET /patients/{id}/allergies` returns `{ data: { data: Allergy[], meta: {...} } }`.

**Decision:**
- Replaced raw `allergiesQuery.data?.data?.length` (which resolves to `undefined` because `data` is an object, not an array) with `normalizeAllergyResponse()` — the same utility already used by `MRClinicalCare.tsx`.
- This utility handles both nested (`data.data`) and flat (`data`) response shapes and returns a `NormalizedAllergiesPayload` with `meta.total` for the correct count.

**Files changed:** `MRPatientRecords.tsx` — added import + 2 usages (medicalHistoryStatus memo and stats memo).

**Trade-offs:**
- `normalizeAllergyResponse` is in the allergies-form-components barrel, which is a UI-path utility. Ideal would be a shared API-level type fix, but this unblocks the display bug without cascading type changes to other consumers that may rely on the current (incorrect) type.

---

## 2026-05-20: Broader Documentation Check + Suspense Fallback Theme

**Context:** The "Latest Visit" status card in `MRPatientRecords` only checked clinical notes and diagnoses, so it showed "No documentation yet" even when consultations or vitals were recorded. Separately, all `Suspense` fallbacks in `FocusModeRoutes` rendered `LoadingSkeleton` with its default `'dark'` theme, ignoring the actual theme setting.

**Decisions:**
1. **Broadened `latestVisitStatus`** to check 4 data sources: clinical notes, diagnoses, consultations, and vitals. "Complete" requires 3+/4, "Partial" shows `(x/4)` count for 1-2, "No documentation yet" when all are empty.
2. **Added `useGetActiveVisitConsultations` and `useGetActiveVisitVitals`** queries to `MRPatientRecords` (both already cached — no additional network overhead beyond one API call each).
3. **Passed `theme={theme}` to all 12 `LoadingSkeleton` Suspense fallbacks** in `FocusModeRoutes.tsx`, fixing the loading state theme mismatch.

**Files changed:**
- `MRPatientRecords.tsx` — added 2 imports, 2 hook calls, broadened latestVisitStatus
- `FocusModeRoutes.tsx` — added `theme={theme}` to all 12 Suspense fallbacks

---

## 2026-05-20: Replaced Individual Visit Queries with Single Medical History Query (All 8 Form Categories)

**Context:** The previous `latestVisitStatus` checked only 4 categories (clinical notes, diagnoses, consultations, vitals) with a hardcoded `/4` denominator. In reality there are 8 clinical form categories. The `/4` was misleading.

**Decisions:**
1. **Replaced 4 individual `useGetActiveVisit*` hooks** with a single `usePatientMedicalHistory(patientId)` query. The medical history endpoint (`GET /patients/{id}/medical-history`) returns all 8 categories in one payload: clinical_notes, diagnoses, consultations, vitals, allergies, prescriptions, lab_requests, lab_results.
2. **Status message now shows `x/8`** — e.g., "⚠️ 3/8 clinical forms have data" — accurately reflecting the actual number of clinical form categories.
3. **Kept `useGetAllergies` separately** for the Known Allergies stat count and Medical History card (which need the allergy-specific display).

**Files changed:**
- `MRPatientRecords.tsx` — replaced 4 imports + 4 hook calls with 1 import + 1 hook call; updated latestVisitStatus to check 8 categories from medical history payload.

**Trade-offs:**
- Single API call vs 4 individual calls = fewer network requests, but the medical history endpoint is a heavier payload (all patient data, not just current visit). React Query caching mitigates this for repeated visits to this component.
- The medical history endpoint is patient-scoped (all visits) rather than visit-scoped. For a "current visit documentation" check this is slightly inaccurate, but it gives the user a complete picture of what clinical data exists for this patient.

---

## 2026-05-20: Prescription Template — Missing dosage_form / dosage_unit / duration_unit Defaults

**Context:** Creating a prescription from a clinical template failed with `"The items.0.dosage_form field is required"` (and 5 more errors). The `StorePrescriptionRequest` validates that every item has `dosage_form`, `dosage_unit`, and `duration_unit`, but templates stored before these fields were required were missing them from their JSON blob.

**Decisions — three-layer fix:**

1. **Frontend `templateToPrescriptionItem()`** — Added `||` fallbacks for `dosage_form`→`DosageForm.TABLET`, `dosage_unit`→`DosageUnit.TABLETS`, `duration_unit`→`DurationUnit.DAYS`. These fields already had `||` fallbacks in `ClinicalTemplateForm.addOrUpdateMedication`, but the standalone conversion function was missing them.

2. **Backend `StoreTemplateRequest`** — Added validation rules for `dosage_form`, `dosage_unit`, `duration_unit` as `required_with:default_medications` so future templates cannot be saved without these fields.

3. **Backend `PrescriptionService::applyTemplate()`** — Added `??=` defaults for all required-but-occasionally-missing fields (`dosage_form`, `dosage_unit`, `duration_unit`, `route`, `administration_instructions`, `refills`, `substitution`) as a runtime safety net for existing templates in the database.

**Files changed (FE):**
- `ClinicalTemplateTypes.ts` — 3 fallback defaults in `templateToPrescriptionItem()`

**Files changed (BE):**
- `StoreTemplateRequest.php` — 3 new validation rules
- `PrescriptionService.php` — 7 `??=` defaults in `applyTemplate()` loop

---

## 2026-05-20: Theme-Aware Dialogs — ConfirmationDialog + DiagnosesPreviewModal + ConsultationsPreviewModal

**Context:** The `ConfirmationDialog` (shared/Feedback/Prompt/) used for dispute/verify/resolve/accept/decline in diagnosis and consultation forms had no `theme` prop — it relied entirely on `dark:` Tailwind CSS class strategy. The `DiagnosesPreviewModal` and `ConsultationsPreviewModal` had hardcoded light-mode colors with no dark mode support at all.

**Decisions:**
1. **`ConfirmationDialog`** — Added `theme?: 'light' | 'dark'` prop with `isDark` programmatic color switching. Replaced all `dark:` CSS classes with conditional ternary expressions using `isDark`. Icon background colors use opacity-based dark variants (`bg-amber-900/30`) for consistency with the rest of the app.
2. **`DiagnosesPreviewModal`** + **`ConsultationsPreviewModal`** — Added `theme?: 'light' | 'dark'` prop. Extracted 7 shared color tokens (`cardBg`, `borderColor`, `bodyBg`, `textPrimary`, `textSecondary`, `textMuted`, `hoverBg`, `btnBorder`) via `isDark` and applied them across all 3 state branches (loading, empty, normal). Download PDF button also uses theme-aware green tones.
3. **`DiagnosisForm`** + **`ConsultationsForm`** — Both now pass `theme={theme}` (already available from their own props) to `ConfirmationDialog`, `DiagnosesPreviewModal`, and `ConsultationsPreviewModal`.

**Files changed:**
- `ConfirmationDialog.tsx` — added `theme` prop, replaced `dark:` with `isDark` ternaries
- `DiagnosesPreviewModal.tsx` — added `theme` prop, theme-aware color tokens
- `ConsultationsPreviewModal.tsx` — added `theme` prop, theme-aware color tokens
- `DiagnosisForm.tsx` — passes `theme={theme}` to both child dialogs
- `ConsultationsForm.tsx` — passes `theme={theme}` to both child dialogs

**Trade-offs:**
- Uses shared color token variables rather than per-element `dark:` classes — consistent with the app's `isDark` pattern but less automatic than Tailwind's CSS-based strategy.
- The `ConfirmationDialog` now has two code paths (old `dark:` classes remain removed), but the `useConfirm()`-based `ConfirmDialog` (shared/Feedback/ConfirmDialog/) was already theme-aware — these fixes bring the older `Prompt/ConfirmationDialog` up to parity.

---

## 2026-05-20: Module Access — Broadened Focus Route Permissions for Cross-Module Components

**Context:** Focus-mode components (Latest Visit, Medical History, Forward Patient) live under the `medical-records` module's route tree but are reused by other modules (front desk, nursing, pharmacy, laboratory, etc.). The `ModuleAccessMiddleware` uses `FOCUS_MODE_ROUTE_ACCESS` to validate access by prefix, but `PATIENT_RECORD_FOCUS` (`/patient-record-focus`) and `/medical-records-focus` entries only allowed `['medical_records']`. Users without `medical_records` module access (e.g., front desk, nursing, pharmacy) were blocked from these shared components.

**Decision:**
- Updated `PATIENT_RECORD_FOCUS` entry in `focusModeRouteAccess.ts` — `moduleCodes` changed from `['medical_records']` to `['medical_records', 'clinical', 'nursing', 'pharmacy', 'laboratory', 'ambulance', 'referrals', 'billing']`
- Updated `/medical-records-focus` entry — same change
- No changes needed to `ModuleAccessMiddleware.tsx` — `validateModuleAccess` already uses `.some()` against the multi-code array, so it was already equipped for this pattern

**Files changed:**
- `focusModeRouteAccess.ts` — 2 entries broadened

**Trade-offs:**
- Broadening access means any clinical staff with any of the listed modules can see patient records in focus mode. This matches the clinical workflow intent but reduces strict module isolation.
- If finer-grained access is needed later, individual focus routes could get their own entries (vs. prefix-based matching) or a per-route access function could be introduced.

---

## 2026-05-20: Global Cursor Pointer for All Interactive Elements

**Context:** Interactive elements throughout the app (buttons, tabs, dropdown items, selects, labels, checkboxes, switches, etc.) inconsistently had `cursor: pointer`. Some had it via inline utility classes, others relied on the browser default (`cursor: default` for buttons, selects, and ARIA roles). The user wanted consistent `cursor: pointer` across all interactive elements on every theme.

**Decision:**
- Added a `@layer base` block in `App.css` with a grouped selector targeting all common interactive elements
- Uses `:not(:disabled)` to preserve `cursor: not-allowed` / default cursor on disabled interactive elements
- Covers: `button`, `[type="button"]`, `[type="submit"]`, `[type="reset"]`, `[role="button"]`, `[role="tab"]`, `[role="menuitem"]`, `[role="option"]`, `[role="checkbox"]`, `[role="radio"]`, `[role="switch"]`, `select`, `summary`, `label`
- Excludes `<a>` (already `pointer` by default), `<input>`/`<textarea>` (should keep `text` cursor)
- Component-level `cursor-pointer` / `cursor-not-allowed` utility classes override this base layer via specificity

**Files changed:**
- `App.css` — new `@layer base` block
- `LabRequestDetailsCard.tsx` — fixed `&&` → ternary for `cursor-pointer` on Cancel Request trigger button

**Trade-offs:**
- Global rule means future components automatically get `cursor: pointer` without remembering to add it — consistent UX out of the box.
- If a specific interactive element needs `cursor: default` or another cursor, an explicit utility class will win due to higher specificity.
- `label` is included broadly — covers both `htmlFor`-associated labels and standalone labels used in custom form controls.

---

## 2026-05-20: Lab Result Editor — Template Fields + Manual Overrides

**Context:** When a lab test is linked to a template with predefined fields, the result editor showed template fields correctly but locked the user into template-only mode — the "Add Another Result Field" button was hidden unless the test had no template at all. Users couldn't add extra manual result fields alongside template-defined ones.

**Decisions:**

1. **`buildDraftsFromFieldsAndResults` (utils)** — Now also includes manual results (those with `template_field_id === null`) as drafts appended after template field drafts. Previously they were filtered out entirely, meaning manually-added results from a prior session would be lost when re-opening the editor.

2. **Removed binary `isManualMode` toggle** — The editor no longer switches between template mode and manual mode. Instead, template fields are shown when available, and manual fields can always be added on top. The initialization logic:
   - If template fields exist → build drafts from template fields + all results (template-linked + manual)
   - If no template fields → fall back to manual draft

3. **"Add Manual Result Field" button always visible** — Now shown whenever the editor is not read-only. When no template fields exist, it reads "Add Another Result Field"; when template fields are present, it reads "Add Manual Result Field".

4. **`is_manual_entry` metadata per-field** — Changed from `!hasTemplateWithFields` (global) to per-field `template_field_id === null` check, so the metadata accurately reflects which results are from template fields vs manually added.

**Files changed:**
- `labResultForm.utils.ts` — `buildDraftsFromFieldsAndResults` now includes manual results; extracted shared `draftFromResult` helper
- `LabResultItemResultEditor/index.tsx` — removed `isManualMode` state, `shouldUseManualMode` memo; simplified initialization effect; always show "Add Manual Result Field" button

**Trade-offs:**
- Manual fields added alongside template fields will have `template_field_id: null` — the backend already handles this correctly (no field validation, preserves flag as-is).
- The `resultsKey` dependency captures serialized `result_uuid` + `updated_at` rather than the `existingResults` array directly — avoids unnecessary draft rebuilds when the array reference changes but content hasn't.
- Pre-existing manual results from prior sessions are now preserved on re-open (included in `buildDraftsFromFieldsAndResults`).

---

## 2026-05-20: BE-FE Sync — Lab Test Template Detection in Result Editor

**Context:** Even when a lab test was linked to a template with fields, the result editor always showed "Manual Result Entry Mode" — template fields never loaded. The root cause was a **BE eager-loading gap**: the template relationship was never included in API responses, so the FE could never detect it.

**Root cause trace:**

1. FE editor checks `item?.lab_test?.template?.template_uuid` to detect if a test has a template
2. The item data comes from `GET /lab/requests/{uuid}/with-items` → `LabRequestRepository::findByUuid()`
3. The repository eager-loaded `items.labTest` but **not** `items.labTest.template`
4. `LabTestResource::toArray()` uses `$this->whenLoaded('template')` — since template was never loaded, the `template` key was silently omitted from JSON
5. FE got `item.lab_test` without `template` → `template_uuid` was always `undefined`
6. `hasTemplate` was `false` → `useGetFieldsByTemplate` never fired → editor fell to manual mode

**Fix — Backend:**
- Added `'labTest.template'` to the nested `->with()` inside the items callback in:
  - `LabRequestRepository::findByUuid()` — used by `GET /lab/requests/{uuid}/with-items`
  - `LabRequestRepository::getWithItems()` — used by `GET /lab/requests/{id}`
  - `LabRequestRepository::getWithFullDetails()` — used by `GET /lab/requests/{id}/full-details`
  - `LabRequestItemRepository::getWithFullDetails()` — used by item-level details endpoint

**Fix — Frontend:**
- Added `testHasTemplateId` check (`!!item?.lab_test?.template_id`) as a more robust signal that a test belongs to a template — works even if the template relationship isn't loaded for any reason
- Changed `noTemplateFieldsAvailable` from `!hasTemplate || templateFields.length === 0` to `!testHasTemplateId && !hasTemplate` — prevents false fallback to manual mode while fields are still loading

**Files changed (BE):**
- `app/Repositories/Lab/LabRequestRepository.php` — added `'labTest.template'` in 3 methods
- `app/Repositories/Lab/LabRequestItemRepository.php` — changed `'labTest'` to `'labTest.template'`

**Files changed (FE):**
- `LabResultItemResultEditor/index.tsx` — added `testHasTemplateId` guard, fixed timing bug in `noTemplateFieldsAvailable`

**Trade-offs:**
- Adding eager loading adds a JOIN or extra query per request, but only when items are loaded — negligible overhead for correct behavior.
- The `template_id` fallback on the FE means even if a future endpoint omits the eager loading, the editor won't falsely fall to manual mode (it will show a loading state until the template becomes available or an error occurs).
- The `testHasTemplateId` check is always available because `template_id` is a direct column on the `lab_tests` table — no relationship needed.

---

## 2026-05-20: Forward Patient — Show Current Workflow Step

**Context:** The Forward Patient component's "Care step" grid showed all available workflow stages (Medical Records, Doctor Visit, Pharmacy, etc.) to choose where to forward the patient, but never indicated which step the patient was currently at. Staff had to remember or guess where the patient currently was in the workflow.

**Decision:**
- Added optional `currentWorkflow` prop to `ForwardingModeSection` accepting the patient's current `CareDeliveryWorkflow` from `activeVisit.care_delivery_workflow`
- When set, a "Currently at" banner shows above the care step grid (indigo-themed, icon + label)
- In the grid, the current step button gets a distinct border/background (indigo instead of default) plus a `MapPin` icon and a small "Current" badge
- No BE changes needed — `care_delivery_workflow` is already exposed in `VisitResource` and loaded via Redux `activeVisit`

**Files changed:**
- `ForwardingModeSection.tsx` — added `currentWorkflow` prop, current step indicator banner + visual highlight in grid
- `ForwardPatient.tsx` — passes `activeVisit?.care_delivery_workflow` to `ForwardingModeSection`

**Trade-offs:**
- The current step display is purely visual — users can still forward to the same step (useful for re-queuing). No blocking logic was added.
- Only `ENCOUNTER_WORKFLOW_STAGE_ORDER` stages are highlighted; steps not in that list (Registration, Triage, Imaging) show only in the "Currently at" banner but not in the grid.
- The feature relies on `care_delivery_workflow` being set on the visit — visits that have never been forwarded (null) will not show a "Currently at" block.

---

## 2026-05-20: Three-Layer Navigation Crash Protection (Debounce + Per-Route ErrorBoundary + Query Cancellation)

**Context:** Users experienced crashes when rapidly clicking sidebar links. Multiple simultaneous `navigate()` calls triggered competing lazy chunk loads that could race and crash the entire app. A single root `ErrorBoundary` meant any module-level crash took down the whole SPA, and in-flight API requests from unmounting routes would try to update stale closures after navigation.

**Decision — three-layer defense:**

**Layer 1 — Navigation Debounce Guard (`useNavigationGuard` hook)**
- Created `src/renderer/shared/hooks/useNavigationGuard.ts` — reusable hook wrapping `useNavigate` with configurable `delay` (300ms) and `cooldown` (500ms)
- Rapid clicks within the cooldown window are silently dropped; the first click is debounced by `delay` before calling `navigate()`
- Exposes `isNavigating` state for visual feedback
- Applied to `Sidebar.handleNavigation` and `FocusedModeLayout.handleClose`, replacing direct `useNavigate()`

**Layer 2 — Per-Route ErrorBoundary**
- Moved `<ErrorBoundary>` from `App.tsx` (root wrapper) into each lazy-loaded route's `<Suspense>` fallback wrapper (`SuspenseWrapper` in `routeUtils.tsx`)
- Each route's `<ErrorBoundary>` wraps only its own `{children}` inside `<Suspense>`
- A crash in one lazy module no longer takes down the entire app
- Removed the outer `<ErrorBoundary>` from `App.tsx`

**Layer 3 — Query Cancellation on Navigation**
- Added module-level `AbortController` in `axiosConfig.ts` — `cancelAllPendingQueries()` aborts it and calls `queryClient.cancelQueries()`
- `createNavigationSignal()` exposes the `AbortSignal` for selective per-query use
- `useNavigationGuard` calls `cancelAllPendingQueries()` dynamically before navigating when `cancelQueries: true`

**Files changed:**
- `src/renderer/shared/hooks/useNavigationGuard.ts` — **CREATED** (60 lines)
- `src/renderer/app/api/axiosConfig.ts` — added `cancelAllPendingQueries()` + `createNavigationSignal()`
- `src/renderer/shared/components/Navigation/Sidebar.tsx` — replaced `useNavigate` with `useNavigationGuard`
- `src/renderer/shared/components/Navigation/FocusedModeLayout.tsx` — replaced `useNavigate` with `useNavigationGuard`
- `src/renderer/app/routes/modules/shared/routeUtils.tsx` — added `<ErrorBoundary>` inside `SuspenseWrapper`
- `src/renderer/App.tsx` — removed root `<ErrorBoundary>`

**Trade-offs:**
- 300ms delay + 500ms cooldown adds a sub-second wait between rapid clicks; `isNavigating` provides visual feedback
- `cancelAllPendingQueries()` aborts all in-flight requests aggressively — React Query refetches on remount; long-polling endpoints can opt in via `createNavigationSignal()`

---

## 2026-05-20: Lint Cleanup + ScrollToTop Fix

**Context:** Six pre-existing eslint errors blocked the pre-commit hook on every commit (5× `no-explicit-any` in `axiosConfig.ts`, 1× `react-hooks/purity` `Date.now()` in `FocusedModeLayout.tsx`). The `ScrollToTop` component existed but was never imported — and even when wired, it targeted `window`/`main` which wasn't the actual scroll container.

**Decisions:**

**1. Lint fixes:**
- `axiosConfig.ts` — replaced all `config.headers as any` with `config.headers as AxiosHeaders` (already imported); removed redundant fallback branches (`AxiosHeaders` always has `.set()` and `.delete()`)
- `FocusedModeLayout.tsx` — moved `Date.now()` from inline in `calculateWaitTime` (called during render) into a `useState(() => Date.now())` + `useEffect` interval (updates every 60s)

**2. ScrollToTop fix:**
- `ScrollToTop.tsx` — already imported and placed correctly in `App.tsx` (inside `<Router>`) but used `window.scrollTo()` which didn't always work in the app's layout (content may scroll inside `document.scrollingElement` or a scoped container)
- Rewritten to use `document.scrollingElement ?? document.documentElement ?? document.body` as the primary target
- Also queries for `main`, `[role="main"]`, `#main-content`, `.main-content-area` as fallback containers
- Uses `requestAnimationFrame` to ensure DOM is ready before scrolling (avoids race with lazy-loaded route rendering)
- Uses `behavior: 'instant'` for reliability (no animation conflicts with route transitions)

**Files changed:**
- `src/renderer/app/api/axiosConfig.ts` — `as any` → `as AxiosHeaders` in 5 places, removed redundant `set` guard
- `src/renderer/shared/components/Navigation/FocusedModeLayout.tsx` — added `useState(() => Date.now())` + interval, removed `const now = Date.now()` from `calculateWaitTime`
- `src/renderer/shared/components/ScrollToTop/ScrollToTop.tsx` — rewritten with robust container detection + RAF timing

**Trade-offs:**
- 60s interval for `now` means wait times on FocusedModeLayout update at most every minute (vs. per-render before). Acceptable for a display-time relative value.
- `behavior: 'instant'` is less visually smooth but avoids racing with route animations — user sees content at the top immediately.

---

## 2026-05-21: Clinical Data Scoped by Visit — Combined patientId+visitId Cache Keys

**Context:** The `PrescriptionForm` was fetching all patient prescriptions (patient-scoped) instead of only the active visit's prescriptions (visit-scoped). This caused draft prescription data from previous visits to appear in the current visit's form. Additionally, the "Latest Visit" document count in `MRPatientRecords` was checking data across all visits rather than only the latest visit, and billing was auto-completing visits on full payment (preventing further clinical work on the same visit).

**Root causes:**

1. **Billing auto-completed visits** — `BillingProcessor.php` set `status = 'completed'` and `current_phase = 'discharged'` on full payment, locking the visit.
2. **Fully-paid visits reused** — `VisitService.php` didn't exclude `payment_status = 'paid_in_full'` visits when looking for an existing reusable visit.
3. **PrescriptionForm was patient-scoped** — Used `useGetPatientPrescriptions(patientNumericId, [])` which fetched all prescriptions across all patient visits, then filtered in-memory. Drafts from previous visits appeared in the current visit.
4. **All clinical form queries lacked visit scope** — Vitals, clinical notes, diagnoses, consultations, prescriptions, and lab queries used patient-scoped keys or visit-only keys without patientId prefix, making invalidation tricky.
5. **Stale variable reference caused crash** — `patientPrescriptionsQuery` was renamed to `visitPrescriptionsQuery` but one reference at line 878 was missed, throwing a `ReferenceError` on render.
6. **Medical history not invalidated on prescription save** — The Latest Visit document count (`x/8`) didn't update after saving a prescription because `patientMedicalHistoryKeys` invalidation was missing from prescription mutation `onSuccess`.

**Decisions:**

**1. Backend — Billing no longer completes visits**
- `BillingProcessor.php`: Removed `$visit->status = 'completed'` and `$visit->current_phase = 'discharged'` on full payment. Visit stays `active` with phase `billing`.
- `BillingService.php`: Response message changed from "Payment successfully settled. Visit has been completed." to "Payment successfully settled."

**2. Backend — Fully-paid visits excluded from reuse**
- `VisitService.php`: Added `->where('payment_status', '!=', 'paid_in_full')` to the existing-visit reuse query.
- Filters now check `status = 'active'` + `payment_status != 'paid_in_full'` + strict same-facility.

**3. Backend — New visit-scoped prescription endpoint**
- `PrescriptionController.php`: Added `visitPrescriptions($visitId)` method returning prescriptions filtered by `visit_id`.
- Route: `GET /prescriptions/visit/{visitId}` registered.
- `PrescriptionResource.php`: Now returns `visit_id` and `patient_id`.

**4. Frontend — Combined cache key pattern for all clinical form queries**
- Every clinical form module (vitals, clinical-notes, diagnoses, consultations, prescriptions, lab) now has a `visitPatient(patientId, visitId)` key: `['entity-root', 'patient', patientId, 'visit', visitId]`.
- `useGetActiveVisit*` hooks read `selectActiveVisitPatientId` from Redux and use the combined key.
- `useGetVisit*` hooks accept optional `patientId` (via options/param) for backward compatibility.
- The pattern ensures a single `invalidateQueries({ queryKey: ['entity-root', 'patient', patientId] })` cascades to both patient-scoped and visit-scoped caches.

**5. Allergies excluded from combined key pattern**
- Stay patient-scoped only per explicit instruction (allergies belong to the patient, not the visit).

**6. PrescriptionForm uses visit-scoped query**
- Replaced `useGetPatientPrescriptions(patientNumericId, [])` with `useGetVisitPrescriptions(visitId ?? 0, patientNumericId, { enabled: !!visitId && !existingPrescription })`.
- Drafts are now found only within the active visit.

**7. Added medical history cache invalidation to prescription mutations**
- Both `PrescriptionQueries.ts` and `PrescriptionItemsQueries.ts`: added `queryClient.invalidateQueries({ queryKey: patientMedicalHistoryKeys.all() })` and `queryClient.invalidateQueries({ queryKey: prescriptionKeys.all() })` to all mutation `onSuccess` handlers.

**8. Toast changes for template application**
- `PrescriptionItemsQueries.ts` `useCreatePrescriptionItem`: removed individual success toast (noisy during multi-item template application).
- `PrescriptionForm.tsx` `addOrUpdateMedication`: added single `showToast('success', 'Medication added', 3000)` for individual persisted item saves.

**9. MRPatientRecords — visit-scoped document count + medical history simplification**
- `latestVisitStatus` now filters medical history by latest visit ID (via `pickLatestVisitId` + `filterMedicalHistoryPayloadByVisitId`).
- Counts only prescriptions and other forms from the latest visit.
- "clinical forms" → "clinical documents" in status message.
- `medicalHistoryStatus` simplified to just "Historical data exists" (removed x/8 count — was misleading when scoped to latest visit).

**Files changed (FE — 9 files):**
- `vitalQueries.ts` — added `visitPatient` key, active visit hook reads patientId
- `clinicalNoteQueries.ts` — same combined key pattern
- `diagnosisQueries.ts` — same combined key pattern
- `consultationQueries.ts` — same combined key pattern
- `PrescriptionQueries.ts` — added `visitPatient` key, dual invalidation, patientId param
- `PrescriptionItemsQueries.ts` — toast removed, medical history invalidation added
- `LabQueries.ts` — combined key for requestByVisit
- `PrescriptionForm.tsx` — visit-scoped query, toast added for item saves, crash fix (line 878)
- `LatestVisit.tsx` — passes patientId to prescription/lab hooks

**Files changed (BE — 4 files):**
- `BillingProcessor.php` — removed visit completion on full payment
- `BillingService.php` — updated response message
- `VisitService.php` — exclude fully-paid visits from reuse
- `PrescriptionController.php` — new `visitPrescriptions` method + route

**Trade-offs:**
- `patientId` as optional param/option on `useGetVisit*` hooks adds some API surface but keeps backward compatibility with callers that don't have patientId (patient portal, report launchers).
- Combined key pattern means more specific invalidation targets; generic `invalidateQueries({ queryKey: ['entity-root', 'patient', patientId] })` is broader than necessary but ensures correctness.
- Removing toast from the mutation hook means template appliers must show their own toast. Single grouped toast is better UX but requires each caller to implement it.

---

## 2026-05-26: Messaging — Partial Send, Custocare-Only Contacts, Exact Errors

**Context:** Compose showed a generic “Failed to send message” when the API failed; one unresolved recipient aborted the entire send. Contacts could be saved even when email/phone did not match a Custocare user. The contact list did not show the linked Custocare account name beside the notebook label.

**Decision:**
- **Send:** `MessageService::syncRecipients()` accepts `skipUnresolved`; unresolved addresses are collected in `skipped_recipients` on the JSON response while resolved recipients still receive the message. If none resolve, return 422 with a clear message (no generic wrapper for validation/resolution errors).
- **Drafts:** Same lenient sync so drafts can be saved without failing the whole payload; `updateDraft` now syncs when `to`/`cc`/`bcc` are present (fixed `recipients` key bug).
- **Contacts:** `UserMessageContactService` rejects create/update when email or phone is not on Custocare; response includes `custocare_user_name` for list UI.
- **FE:** `useStoreMessage` surfaces API `message` + validation errors; warns when `skipped_recipients` is non-empty. Compose contact picker only lists `can_message` contacts.
- **Contacts page (2026-05-26 follow-up):** Fetch up to 100 contacts once; filter client-side via `filterMessageContacts()` (display name, Custocare name, email, phone). Always-visible **New contact** button beside search and in empty / no-results states.

**Files changed (BE):** `MessageService.php`, `MessageController.php`, `MessageRecipientNotResolvedException.php`, `UserMessageContactService.php`, `bootstrap/app.php`

**Files changed (FE):** `MessageTypes.ts`, `MessageQueries.ts`, `MessageContacts.tsx`, `ComposeContactPicker.tsx`, `messageContactDisplay.ts`, `MessageContactTypes.ts`

---

## 2026-05-26: Message body encryption at rest (server-side)

**Context:** Message Center stored `messages.body` in plaintext. Contacts and user PII already use Laravel `encrypt()` / `decrypt()`.

**Decision:**
- Encrypt **body only** at rest in `body_encrypted`; **subject** remains plaintext so inbox search and sort by subject keep working.
- `Message` model exposes virtual `body` (decrypt on read, encrypt on write); API JSON shape unchanged — **no frontend changes**.
- Folder search no longer matches body text (encrypted); search still works on subject, people, and labels.
- Migration backfills existing rows and clears legacy `body` plaintext.

**Files changed (BE):** `MessageBodyCipher.php`, `Message.php`, `MessageService.php` (search), migration `2026_05_26_120000_add_body_encrypted_to_messages_table.php`, `tests/Unit/MessageBodyCipherTest.php`, `docs/entities.md`

**Files changed (FE):** None (contract unchanged).

**Run after deploy:** `php artisan migrate` from `Backend/`.

---

## 2026-05-21: Refund/Void Query Invalidation — Added Missing Detail + Facility-Visit Keys

**Context:** After processing a refund or void on the billing review detail page, the page still showed refunded items because React Query's cached detail query was never invalidated. Only the `['billing-review', 'list', facilityId]` key was invalidated (used by the list view), but the detail view uses separate keys: `['billing-review', 'detail', facilityId, visitId]` and `['billing-review', 'facility-visit', facilityId, visitId]`.

**Decision:**
- Added `queryClient.invalidateQueries({ queryKey: ['billing-review', 'detail', facilityId] })` to both `useRefundTransaction` and `useVoidTransaction` in `RefundQueries.ts`
- Added `queryClient.invalidateQueries({ queryKey: ['billing-review', 'facility-visit', facilityId] })` to both hooks
- Uses prefix matching so a single invalidation covers all visit IDs for the current facility

**Files changed:**
- `src/renderer/modules/medical-records/api/refund/RefundQueries.ts` — added 4 `invalidateQueries` calls across 2 mutation hooks

---

## 2026-05-20: Removed NavigationGuard Hook — Reverted to Plain useNavigate

**Context:** The `useNavigationGuard` hook (added as Layer 1 of the three-layer crash protection) caused a 300ms delay on every sidebar click. Users reported navigation felt completely broken — clicking sidebar items did nothing for 300ms. Rapid clicks were also silently dropped, making the app appear unresponsive.

**Decision:**
- Deleted `src/renderer/shared/hooks/useNavigationGuard.ts`
- Reverted `Sidebar.tsx` and `FocusedModeLayout.tsx` back to plain `useNavigate()` from `react-router-dom`
- Kept the per-route `<ErrorBoundary>` in `SuspenseWrapper` (Layer 2) and the `cancelAllPendingQueries()` / `createNavigationSignal()` in `axiosConfig.ts` (Layer 3) — those didn't cause navigation issues

**Trade-offs:**
- Users can rapid-click sidebar links again, which risks the original crash scenario (competing lazy chunk loads). The per-route `ErrorBoundary` (Layer 2) still provides protection — a crash in one module won't take down the whole app.
- No query cancellation before navigation — in-flight API requests from unmounting routes may still fire and update stale closures. This is the original behavior before the three-layer system.

---

## 2026-05-26: AvailablePlans — Responsive "Your plan — trial day X of Y" text

**Context:** The "Your plan — trial day X of Y" badge text in the plan card's action area overflowed on mobile, causing text to overlap with adjacent UI elements.

**Decision:**
- Wrapped the text in a responsive `<span>` that breaks into two lines on mobile (`<sm`): "Your plan" on one line, "trial day X of Y" below — keeps as one line on desktop (`sm+`).
- Added `shrink-0` on the `CheckCircle2` icon to prevent compression.
- Added `leading-tight` for tighter line height on multi-line layout.
- Added `px-2` padding so text doesn't touch the card border.

**Files changed (FE — 1 file):**
- `AvailablePlans.tsx` — lines 484-489: replaced single `<span>` with nested `<span>` + responsive block/inline behavior

**Trade-offs:**
- The `block sm:inline` pattern is simple CSS and doesn't require media query hooks or breakpoint constants. Works with existing Tailwind responsive prefix system.
- Two-line text on mobile increases badge height slightly but trial badges already have `py-2.5` for vertical padding, so the visual impact is minimal.

---

## 2026-05-26: Backend PDF Generation for Billing Receipts & Invoices

**Context:** The Download button on billing documents was previously saving `.html` files instead of proper PDFs. Facilities need professional, downloadable PDF invoices and receipts for their records.

**Decisions:**

**Backend (Laravel):**
- Installed `barryvdh/laravel-dompdf` (^3.1) for server-side PDF rendering — no client-side PDF libraries
- Created `SubscriptionBillingPdfServiceInterface` / `SubscriptionBillingPdfService` — new SOLID pair injected via constructor into `BillingDocumentController`
- `downloadInvoicePdf(Invoice $invoice)` and `downloadReceiptPdf(Payment $payment)` each use `Pdf::loadView()` with the appropriate Blade template and reuse existing `SubscriptionBillingDocumentServiceInterface::buildInvoiceDocument()`/`buildReceiptDocument()` data arrays
- Two new Blade templates under `resources/views/pdf/billing/`:
  - `invoice.blade.php` — Blue header banner, bill-to section, line items table, totals with balance due, footer
  - `receipt.blade.php` — Emerald header banner, received-from section, payment details box, totals, footer
- Both templates use dompdf-compatible CSS (DejaVu Sans font, no flexbox fallbacks, `@page` margins)
- New routes: `GET /invoices/{invoice}/pdf` and `GET /receipts/{payment}/pdf` — both validate facility ownership; receipt additionally checks `approved` status
- Binding added to `BillingServiceProvider`: `SubscriptionBillingPdfServiceInterface::class => SubscriptionBillingPdfService::class`

**Frontend (React/TypeScript):**
- `BillingDocumentPreviewModal.handleDownload` now fetches the PDF as a blob from the backend endpoint using `axiosInstance`, creates a download link with `.pdf` extension
- Falls back to HTML download if the PDF endpoint fails
- `handlePrint` still uses existing HTML print (works great for browser print dialog)
- Removed the `downloadBillingDocumentHtml` import (replaced by PDF download)

**Trade-offs:**
- Server-side PDF generation adds load to the web server for each download. For facility-facing billing (low frequency), dompdf's overhead is negligible.
- dompdf supports only CSS 2.1 with selected CSS 3 properties — the Blade templates avoid flexbox, floats are used instead for layout. This limits visual design but guarantees consistent output.
- The HTML fallback on the FE ensures the download still works if the PDF endpoint is unreachable (e.g., dompdf dependency issue during deploy).
- Font is DejaVu Sans (bundled with dompdf) rather than the app's Inter font — close enough for a downloadable document.

**Files changed (BE):** `composer.json`, `SubscriptionBillingPdfServiceInterface.php` (new), `SubscriptionBillingPdfService.php` (new), `invoice.blade.php` (new), `receipt.blade.php` (new), `BillingDocumentController.php`, `routes/api_v1/facilitySubscriptions/_index.php`, `app/Providers/BillingServiceProvider.php`

**Files changed (FE):** `BillingDocumentPreviewModal.tsx`

---

## 2026-05-26: AvailablePlans — Description layout, cyan contrast, responsive trial text

**Context:** Three visual issues in the AvailablePlans plan cards:
1. The description `<p>` used `flex-1` in a flex column, making it grow unpredictably and push/overlap the limits grid below.
2. The limit pill badges used cyan-tinted gradient/text on light mode, where cyan on white/light-blue backgrounds had poor contrast.
3. The "Your plan — trial day X of Y" text (previous fix) needed responsive wrapping for mobile.

**Decisions:**

**Fix 1 — Description `flex-1` → `min-h-[2.5rem]`** (line 451)
- Replaced `flex-1` with `min-h-[2.5rem]` so the description has a fixed minimum height (~2 lines of `text-xs`) instead of growing in the flex column and disturbing the grid below.

**Fix 2 — Cyan contrast on light mode badges** (lines 478, 489)
- Split the gradient/tint classes per theme:
  - **Light:** `from-blue-600/15 to-blue-500/15 text-blue-700 border-blue-300/40` — clean blue tones, no cyan.
  - **Dark:** `from-blue-600/15 to-cyan-500/15 text-cyan-300 border-cyan-500/30` — cyan preserved where it pops well.

**Fix 3 — Responsive trial text wrapping** (line 487)
- `block sm:inline` on the trial portion so "trial day X of Y" drops to a second line on mobile.
- `leading-tight` for tighter multi-line spacing.

**Files changed (FE — 1 file):**
- `AvailablePlans.tsx` — 4 class-string edits, plus responsive `span` nesting

**Trade-offs:**
- `min-h-[2.5rem]` is an arbitrary value that fits ~2 lines at `text-xs`; if font size or line-height changes, this breakpoint would need adjustment.
- Splitting gradient classes means two separate class strings — no runtime switching, just Tailwind's `dark:` prefix. Simple and static.
- The responsive wrapping already existed from the previous fix but was refined to use `block sm:inline` + `leading-tight` for better mobile layout.

---

## 2026-05-26: Subscription Approval/Rejection — Optimistic Updates, Confirm Dialog, Spinning Refresh

**Context:** Three UX gaps in the subscription payments workflow:

1. **No optimistic feedback on approval/rejection** — Admin clicking Approve or Reject on a payment saw no UI change until the API responded. On slow networks the button appeared unresponsive.
2. **No confirmation on approval** — Approving a payment activates the facility's subscription (a consequential action), but there was no "Are you sure?" step before sending the mutation.
3. **Refresh button had no loading state** — The manual refresh button on `FacilitySubscriptions` silently clicked with no visual feedback while refetching.

**Decisions:**

**1. Optimistic updates in `useAdminApprovePayment` / `useAdminRejectPayment`**
- Both hooks now have `onMutate`: cancels in-flight queries, snapshots current payments cache (and subscriptions for approve), then optimistically updates all cached payment lists to mark the payment as `approved`/`rejected` instantly.
- `onError`: restores the cache snapshot from `onMutate` if the API call fails (rollback).
- React Query context type bumped to `{ snapshot: unknown } | undefined` 4th generic for snapshot/rollback typing.

**2. `useConfirm` dialog before approve**
- `FacilitySubscriptions.tsx`: The Approve button now triggers a `useConfirm` dialog: *"Approve this payment and activate the subscription for this facility?"* with Approve/Cancel buttons.
- Proceeds to `approvePay.mutate(...)` only if confirmed.

**3. Spinning refresh button**
- Added `refreshing` boolean state to `FacilitySubscriptions`.
- Refresh handler awaits `Promise.all([refetchSubs(), refetchPays()])` then clears `refreshing`.
- While `refreshing`: `RefreshCw` icon gets `animate-spin`, button is `disabled`.

**Files changed (FE — 2 files):**
- `SubscriptionQueries.ts` — `useAdminApprovePayment` and `useAdminRejectPayment`: `onMutate`/`onError`/`onSettled` with snapshot/rollback (4 changes: 2 hooks × 2 methods each)
- `FacilitySubscriptions.tsx` — `useConfirm` dialog wired to approve button, `refreshing` state + spinning icon on refresh button

**Trade-offs:**
- Optimistic updates assume the mutation will succeed. On server failure, the UI briefly shows the approved/rejected state then reverts — the toast error notification helps users understand the rollback.
- The confirm dialog adds one extra click to approval. Given the consequence (activating a paid subscription for a facility), the guard is warranted.
- `refreshing` state is local to the component; if multiple callers need refresh status, it would need lifting. Single-caller pattern keeps it simple.

---

## 2026-05-27: Plan-Scoped Workflow Stage Filtering (Facility Enabled Modules)

**Context:** The “Forward Patient” care-step picker and queue workflow stage dropdowns must align with the active facility’s plan/subscription modules. Without filtering, the UI could show workflows (e.g. Clinical) that the facility plan does not include, causing users to forward to queues they cannot access.

**Decisions:**

- **FE mapping (workflow → module code):**
  - Added `WORKFLOW_TO_MODULE_CODE` in `src/renderer/modules/pharmacy/api/dispensing/visit-queue/visitTypes.ts`.
  - Handles the existing singular/plural mismatch (`referral` → module code `referrals`).

- **FE hook (plan filtering using active facility context):**
  - Added `useAccessibleWorkflows` in `src/renderer/shared/hooks/useAccessibleWorkflows.ts`.
  - Filters `ENCOUNTER_WORKFLOW_STAGE_ORDER` by the active facility’s `selectAccessibleModuleCodes` from `activeContextSlice`.

- **Forward Patient UI:**
  - Updated `src/renderer/modules/medical-records/ui/visit-action-center/billing-space/forward-patient-components/ForwardingModeSection.tsx` to render care-step buttons using `useAccessibleWorkflows()` (instead of always rendering all stages).

- **Queue stage dropdown:**
  - Updated `src/renderer/modules/pharmacy/ui/dispensing/dispensing-medication/views/PatientQueue.tsx` workflow stage dropdown options to use `useAccessibleWorkflows()` (only show queues enabled by the facility plan).

- **Backend:** No changes required. Module access is already resolved in Redux for the active facility context.

**Trade-offs:**

- Workflows with no mapping would remain visible as a safety fallback (though the current stages are fully mapped through this ADR).

**Files changed (FE):**
- `src/renderer/modules/pharmacy/api/dispensing/visit-queue/visitTypes.ts` (added mapping constant)
- `src/renderer/shared/hooks/useAccessibleWorkflows.ts` (new hook)
- `src/renderer/modules/medical-records/ui/visit-action-center/billing-space/forward-patient-components/ForwardingModeSection.tsx`
- `src/renderer/modules/pharmacy/ui/dispensing/dispensing-medication/views/PatientQueue.tsx`

---

## ADR-2026-05-29-1: Discharge Form — Clinical Form Pattern, No Separate Entity

**Status:** Accepted

**Context:** Need a discharge form UI for clinicians to process patient discharges and generate discharge summaries.

**Decision:**
1. **No separate Discharge entity** — discharge data lives on the existing `visits` table. No new table, model, or relationships needed.
2. **Frontend follows existing clinical form pattern** — Mode-based (idle/create/edit) with React Query hooks, BaseFormWrapper, BaseFormActions, sub-component directory, report launcher, and form grid tile registration.
3. **New column** `discharge_diagnosis` (TEXT, nullable) added to `visits` table.

**New Frontend Files:**
- `api/discharge/DischargeTypes.ts` — Types and enums
- `api/discharge/DischargeQueries.ts` — React Query hooks (useGetDischargeData, useCreateDischarge, useUpdateDischarge)
- `DischargeForm.tsx` — Main orchestrator component
- `DischargeEditor.tsx` — Form editor with all fields
- `DischargeSummaryCard.tsx` — Read-only summary view
- `DischargeEmptyState.tsx` — Empty/not-yet-discharged state
- `DischargeHeader.tsx` — Status header
- `DischargePreviewModal.tsx` / `DischargePreviewDocument.tsx` — Report preview
- `DischargeFocus.tsx` — Focus mode wrapper
- `DischargeReportLauncher.tsx` — Report launcher for discharge

**Modified Frontend Files:**
- `clinicalFormGridDefinitions.tsx` — Added 'discharge' tile
- `clinical-reports/launchers/index.ts` — Added launcher export

**Consequences:**
- Discharge data is always accessible via the Visit model without joins
- Follows same BaseFormWrapper/BaseFormActions pattern as other clinical forms
- Registered in the clinical form grid and report launcher system

