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
