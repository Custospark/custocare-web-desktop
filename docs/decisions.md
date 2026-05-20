# Architecture Decision Records

> Each entry records a design decision, its context, and the trade-offs considered.
> Read this before starting any feature to avoid repeating past mistakes.

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
