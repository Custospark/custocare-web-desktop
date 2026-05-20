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
