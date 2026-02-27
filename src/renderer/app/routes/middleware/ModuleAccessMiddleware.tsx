/**
 * ============================================================================
 * MODULE ACCESS MIDDLEWARE
 * ============================================================================
 *
 * Synchronous middleware — every access decision is computed in a single
 * useMemo during the render phase, so no intermediate null/loading frame
 * is ever committed to the DOM.
 *
 * Decision tree (evaluated in order, first match wins):
 *   1. Bypass route   → render <Outlet /> immediately
 *   2. Patient mode   → render <Navigate /> to patient dashboard
 *   3. Unrestricted   → render <Outlet />
 *   4. Module check   → render <Outlet /> or <AccessDenied />
 *
 * Redirects use React Router's <Navigate /> component (declarative) rather
 * than the imperative navigate() inside a useEffect, which always costs
 * at least one extra render cycle.
 */

import React, { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, Lock } from 'lucide-react';
import type { RootState } from '../../store/store';
import { selectAccessibleModuleCodes } from '../../store/slices/activeContextSlice';
import { ROUTES } from './../routeConstants';
import { isInPatientMode } from '../../store/utils/contextSelectors';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ModuleAccessConfig {
  route: string;
  moduleCode: string;
  displayName: string;
}

/** Discriminated union — the four possible outcomes of an access check. */
type AccessDecision =
  | { type: 'render' }                          // show outlet
  | { type: 'redirect'; to: string }            // declarative navigate
  | { type: 'denied'; moduleName: string };     // show access-denied screen

// ─────────────────────────────────────────────────────────────────────────────
// Static configuration (defined once at module scope, never re-created)
// ─────────────────────────────────────────────────────────────────────────────

const MODULE_ACCESS_CONFIG: readonly ModuleAccessConfig[] = [
  { route: ROUTES.MEDICAL_RECORDS,   moduleCode: 'medical_records',   displayName: 'Medical Records'   },
  { route: ROUTES.CLINICAL,          moduleCode: 'clinical',          displayName: 'Clinical'          },
  { route: ROUTES.NURSING,           moduleCode: 'nursing',           displayName: 'Nursing'           },
  { route: ROUTES.LABORATORY,        moduleCode: 'laboratory',        displayName: 'Laboratory'        },
  { route: ROUTES.PHARMACY,          moduleCode: 'pharmacy',          displayName: 'Pharmacy'          },
  { route: ROUTES.BILLING,           moduleCode: 'billing',           displayName: 'Billing'           },
  { route: ROUTES.ADMINISTRATION,    moduleCode: 'administration',    displayName: 'Administration'    },
  { route: ROUTES.PATIENT_DASHBOARD, moduleCode: 'patient_dashboard', displayName: 'Patient Dashboard' },
  { route: ROUTES.ACCOUNT,           moduleCode: 'account',           displayName: 'Account'           },
] as const;

/**
 * Routes rendered without any access check.
 * These must NEVER produce a 'denied' or 'redirect' outcome.
 */
const BYPASS_ROUTES = new Set<string>([
  ROUTES.ACCOUNT,
  '/auth',
  '/login',
  '/logout',
  '/error',
  '/404',
]);

/** Routes reachable without a specific module permission. */
const UNRESTRICTED_ROUTES = new Set<string>([
  ROUTES.DASHBOARD,
  ROUTES.ACCOUNT,
  ROUTES.PATIENT_DASHBOARD,
  '/onboarding',
  '/settings',
  '/profile',
  '/auth',
  '/login',
  '/logout',
  '/error',
  '/404',
]);

/** Routes a patient-mode user may visit. */
const PATIENT_ACCESSIBLE_ROUTES = new Set<string>([
  ROUTES.PATIENT_DASHBOARD,
  ROUTES.ACCOUNT,
  '/settings',
  '/profile',
  '/patient',
]);

// Pre-built lookup maps — O(1) reads, zero allocation per render.
const ROUTE_TO_MODULE = new Map<string, string>(
  MODULE_ACCESS_CONFIG.map(({ route, moduleCode }) => [route, moduleCode])
);

const MODULE_TO_DISPLAY_NAME = new Map<string, string>(
  MODULE_ACCESS_CONFIG.map(({ moduleCode, displayName }) => [moduleCode, displayName])
);

// ─────────────────────────────────────────────────────────────────────────────
// Pure path utilities (no side-effects, fully deterministic)
// ─────────────────────────────────────────────────────────────────────────────

/** Canonical form: leading slash, no trailing slash, no hash prefix. */
function normalizePath(raw: string): string {
  let p = raw.startsWith('#') ? raw.slice(1) : raw;
  if (!p.startsWith('/')) p = `/${p}`;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

/** Returns the first path segment, e.g. "/foo/bar/baz" → "/foo". */
function basePath(normalized: string): string {
  const first = normalized.split('/').filter(Boolean)[0];
  return first ? `/${first}` : '/';
}

function matchesRouteSet(normalized: string, routes: Set<string>): boolean {
  const base = basePath(normalized);
  for (const route of routes) {
    const r = normalizePath(route);
    if (normalized === r || normalized.startsWith(`${r}/`) || base === r) return true;
  }
  return false;
}

function formatModuleName(code: string): string {
  return code.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Core decision function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pure function — derives the correct UI outcome from path + auth state.
 * Called inside useMemo so it runs synchronously during render with zero
 * scheduling overhead. No async work, no side-effects.
 */
function resolveAccess(
  path: string,
  accessibleModuleCodes: string[],
  patientMode: boolean,
): AccessDecision {
  // ── Step 1: hard bypass (account, auth, error pages) ──────────────────────
  if (matchesRouteSet(path, BYPASS_ROUTES)) {
    return { type: 'render' };
  }

  // ── Step 2: patient-mode fence ─────────────────────────────────────────────
  if (patientMode && !matchesRouteSet(path, PATIENT_ACCESSIBLE_ROUTES)) {
    return { type: 'redirect', to: ROUTES.PATIENT_DASHBOARD };
  }

  // ── Step 3: globally unrestricted routes ───────────────────────────────────
  if (matchesRouteSet(path, UNRESTRICTED_ROUTES)) {
    return { type: 'render' };
  }

  // ── Step 4: module-level access check ─────────────────────────────────────
  const base          = basePath(path);
  const requiredCode  = ROUTE_TO_MODULE.get(base) ?? null;

  // No module mapping for this route → allow through (unknown routes are
  // handled by the router's 404 boundary, not this middleware).
  if (!requiredCode || requiredCode === 'account') {
    return { type: 'render' };
  }

  if (accessibleModuleCodes.includes(requiredCode)) {
    return { type: 'render' };
  }

  const moduleName =
    MODULE_TO_DISPLAY_NAME.get(requiredCode) ?? formatModuleName(requiredCode);

  return { type: 'denied', moduleName };
}

// ─────────────────────────────────────────────────────────────────────────────
// AccessDenied UI
// ─────────────────────────────────────────────────────────────────────────────

interface AccessDeniedProps {
  theme: 'light' | 'dark';
  moduleName: string;
  onNavigateHome: () => void;
  isPatientMode: boolean;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  theme,
  moduleName,
  onNavigateHome,
  isPatientMode,
}) => {
  const dark           = theme === 'dark';
  const dashboardLabel = isPatientMode ? 'Patient Dashboard' : 'Dashboard';

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
        dark ? 'bg-gray-950' : 'bg-gray-50'
      }`}
    >
      <div
        className={`max-w-md w-full rounded-2xl shadow-2xl p-8 space-y-6 ${
          dark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
        }`}
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center ${
              dark ? 'bg-red-900/20' : 'bg-red-50'
            }`}
          >
            <Lock className={`w-12 h-12 ${dark ? 'text-red-400' : 'text-red-600'}`} />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center space-y-3">
          <h1 className={`text-2xl font-bold ${dark ? 'text-gray-100' : 'text-gray-900'}`}>
            Access Restricted
          </h1>
          <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
            {moduleName ? `Module: ${moduleName}` : 'This area requires special permissions'}
          </p>
        </div>

        {/* Detail */}
        <div className={`p-4 rounded-lg ${dark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                dark ? 'text-yellow-400' : 'text-yellow-600'
              }`}
            />
            <div className="space-y-2">
              <p className={`text-sm font-medium ${dark ? 'text-gray-200' : 'text-gray-800'}`}>
                Permission Required
              </p>
              <p className={`text-xs leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                {isPatientMode
                  ? 'Patient accounts have limited access to the system. Please use the patient dashboard for available features.'
                  : `Your current role does not include access to the ${moduleName} module. Contact your administrator if you need access to this resource.`}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            autoFocus
            onClick={onNavigateHome}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all cursor-pointer ${
              dark
                ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            Go to {dashboardLabel}
          </button>

          <div className="flex gap-3">
            <a
              href="mailto:support@custospark.com"
              className={`flex-1 px-4 py-3 rounded-lg font-medium text-center transition-colors ${
                dark
                  ? 'bg-gray-800 hover:bg-gray-750 text-gray-300 border border-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
              }`}
            >
              Contact Support
            </a>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                dark
                  ? 'bg-gray-800 hover:bg-gray-750 text-gray-300 border border-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
              }`}
            >
              Refresh Page
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={`pt-4 border-t ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
          <p className={`text-xs text-center ${dark ? 'text-gray-500' : 'text-gray-500'}`}>
            Reference: MOD_ACCESS_{moduleName.toUpperCase().replace(/\s+/g, '_')}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export const ModuleAccessMiddleware: React.FC = () => {
  const location           = useLocation();
  const navigate           = useNavigate();
  const theme              = useSelector((state: RootState) => state.ui.theme);
  const accessibleCodes    = useSelector(selectAccessibleModuleCodes);
  const patientMode        = useSelector(isInPatientMode);

  // ── Normalize path once ───────────────────────────────────────────────────
  // Handles both BrowserRouter (/foo) and HashRouter (#/foo)
  const currentPath = useMemo(() => {
    const raw = location.hash ? location.hash.substring(1) : location.pathname;
    return normalizePath(raw);
  }, [location]);

  // ── Single synchronous decision — computed during render, zero async work ─
  const decision = useMemo<AccessDecision>(
    () => resolveAccess(currentPath, accessibleCodes, patientMode),
    [currentPath, accessibleCodes, patientMode],
  );

  // ── Home navigation for AccessDenied button ───────────────────────────────
  const handleNavigateHome = useCallback(() => {
    navigate(patientMode ? ROUTES.PATIENT_DASHBOARD : ROUTES.DASHBOARD, { replace: true });
  }, [navigate, patientMode]);

  // ── Render — exactly ONE path per outcome, committed on first paint ────────

  if (decision.type === 'redirect') {
    // Declarative redirect: no extra render cycle, no useEffect
    return <Navigate to={decision.to} replace />;
  }

  if (decision.type === 'denied') {
    return (
      <AccessDenied
        theme={theme}
        moduleName={decision.moduleName}
        onNavigateHome={handleNavigateHome}
        isPatientMode={patientMode}
      />
    );
  }

  // 'render' — bypass or granted
  return <Outlet />;
};

export default ModuleAccessMiddleware;
