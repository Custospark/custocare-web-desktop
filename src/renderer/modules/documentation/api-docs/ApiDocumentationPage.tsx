import { useMemo, useState } from 'react';
import { Search, ShieldCheck, ShieldOff } from 'lucide-react';
import { cn } from '../../../shared/utils/classNameUtils';
import { API_ROUTE_DOCS } from './data/apiRoutes';
import type { ThemeProp } from '../../../app/routes/modules/shared/routeUtils';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const METHOD_TONE: Record<Method, string> = {
  GET: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  POST: 'bg-blue-100 text-blue-700 border-blue-200',
  PUT: 'bg-amber-100 text-amber-700 border-amber-200',
  PATCH: 'bg-violet-100 text-violet-700 border-violet-200',
  DELETE: 'bg-rose-100 text-rose-700 border-rose-200',
};

const METHOD_TONE_DARK: Record<Method, string> = {
  GET: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  POST: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  PUT: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  PATCH: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  DELETE: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

const TOP_MODULES = new Set([
  'auth',
  'users',
  'patients',
  'visit',
  'clinicalEncounter',
  'clinicalNote',
  'diagnosis',
  'vital',
  'prescription',
  'lab',
  'pharmacy',
  'nursing',
  'nursingMedication',
  'billing',
  'billingCycle',
  'invoiceLineItem',
  'facilitySubscriptions',
  'facilities',
  'department',
  'staff',
  'staffInvitation',
  'platform',
  'admin/billing',
]);

function toReadableModule(moduleName: string): string {
  return moduleName
    .replaceAll('/', ' / ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function ApiDocumentationPage({ theme }: ThemeProp) {
  const isDark = theme === 'dark';
  const [query, setQuery] = useState('');
  const [activeModule, setActiveModule] = useState<string>('all');
  const [authOnly, setAuthOnly] = useState(false);

  const moduleStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const route of API_ROUTE_DOCS) {
      map.set(route.module, (map.get(route.module) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([module, count]) => ({ module, count, priority: TOP_MODULES.has(module) ? 0 : 1 }))
      .sort((a, b) => a.priority - b.priority || b.count - a.count || a.module.localeCompare(b.module));
  }, []);

  const filteredRoutes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return API_ROUTE_DOCS.filter((route) => {
      if (activeModule !== 'all' && route.module !== activeModule) return false;
      if (authOnly && !route.authRequired) return false;
      if (!q) return true;
      return (
        route.uri.toLowerCase().includes(q) ||
        route.method.toLowerCase().includes(q) ||
        route.module.toLowerCase().includes(q) ||
        (route.name ?? '').toLowerCase().includes(q) ||
        route.action.toLowerCase().includes(q)
      );
    });
  }, [activeModule, authOnly, query]);

  const ui = {
    page: isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900',
    card: isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
    textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
    input:
      isDark
        ? 'bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-500'
        : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400',
    row: isDark ? 'border-gray-800 hover:bg-gray-900/60' : 'border-gray-200 hover:bg-gray-50',
    code: isDark ? 'bg-gray-950 text-cyan-300' : 'bg-slate-100 text-slate-700',
    chip: isDark ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-200',
    activeChip: isDark ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <div className={cn('min-h-full p-4 sm:p-6', ui.page)}>
      <div className="mx-auto max-w-[1600px] space-y-4">
        <div className={cn('rounded-2xl border p-5 sm:p-6', ui.card)}>
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">API Documentation</h1>
            <p className={cn('text-sm', ui.textSecondary)}>
              Generated from backend route inventory. Includes 813 API endpoints grouped by module, with route name,
              middleware, auth requirement, and controller action mapping.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto]">
            <label className={cn('flex items-center gap-2 rounded-xl border px-3 py-2.5', ui.input)}>
              <Search className="h-4 w-4" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by URI, route name, action, method, or module..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>

            <button
              type="button"
              onClick={() => setAuthOnly((prev) => !prev)}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                authOnly ? ui.activeChip : ui.chip
              )}
            >
              {authOnly ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
              {authOnly ? 'Auth Only' : 'All Endpoints'}
            </button>

            <div className={cn('inline-flex items-center rounded-xl border px-4 py-2 text-sm', ui.chip)}>
              Showing {filteredRoutes.length} routes
            </div>
          </div>
        </div>

        <div className={cn('rounded-2xl border p-4 sm:p-5', ui.card)}>
          <p className={cn('mb-3 text-xs font-semibold uppercase tracking-wider', ui.textSecondary)}>Modules</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveModule('all')}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                activeModule === 'all' ? ui.activeChip : ui.chip
              )}
            >
              All ({API_ROUTE_DOCS.length})
            </button>
            {moduleStats.map(({ module, count }) => (
              <button
                key={module}
                type="button"
                onClick={() => setActiveModule(module)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  activeModule === module ? ui.activeChip : ui.chip
                )}
              >
                {toReadableModule(module)} ({count})
              </button>
            ))}
          </div>
        </div>

        <div className={cn('overflow-hidden rounded-2xl border', ui.card)}>
          <div className={cn('grid grid-cols-[100px_1.5fr_1fr_1fr_1fr] gap-3 border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide', ui.row)}>
            <div>Method</div>
            <div>URI</div>
            <div>Name</div>
            <div>Auth</div>
            <div>Action</div>
          </div>
          <div className="max-h-[70vh] overflow-auto">
            {filteredRoutes.map((route) => {
              const toneMap = isDark ? METHOD_TONE_DARK : METHOD_TONE;
              const method = (route.method as Method) in toneMap ? (route.method as Method) : 'GET';
              return (
                <div
                  key={`${route.method}:${route.uri}:${route.name ?? route.action}`}
                  className={cn('grid grid-cols-[100px_1.5fr_1fr_1fr_1fr] gap-3 border-b px-4 py-3 text-sm', ui.row)}
                >
                  <div>
                    <span className={cn('inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold', toneMap[method])}>
                      {route.method}
                    </span>
                  </div>
                  <code className={cn('break-all rounded px-2 py-1 text-xs', ui.code)}>{route.uri}</code>
                  <div className={cn('break-all text-xs', ui.textSecondary)}>{route.name ?? '—'}</div>
                  <div className="text-xs">
                    {route.authRequired ? (
                      <span className={cn('inline-flex items-center gap-1 rounded border px-2 py-0.5', ui.activeChip)}>
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Protected
                      </span>
                    ) : (
                      <span className={cn('inline-flex items-center gap-1 rounded border px-2 py-0.5', ui.chip)}>
                        <ShieldOff className="h-3.5 w-3.5" />
                        Public
                      </span>
                    )}
                  </div>
                  <div className={cn('break-all text-xs', ui.textSecondary)}>{route.action}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
