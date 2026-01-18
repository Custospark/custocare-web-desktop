// BaseModuleWorkspace.tsx
/**
 * ============================================================================
 * BASE MODULE WORKSPACE (ROUTER-DRIVEN)
 * ============================================================================
 *
 * Now uses React Router for scalable navigation:
 * - Operation switching updates the URL
 * - Nested routes render via <Outlet />
 *
 * Design is preserved by keeping ContentLayout unchanged.
 */

import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { ContentLayout, type Operation } from '../content/ContentLayout';
import type { RootState } from '../../../app/store/rootReducer';

export interface ModuleWorkspaceProps {
  contextTitle: string;
  operations: Operation[];
  /**
   * basePath: e.g. "/pharmacy"
   * Operation routes become: `${basePath}/${operationId}`
   */
  basePath: string;
  defaultOperationPath: string; // e.g. "/pharmacy/overview"
}

export function BaseModuleWorkspace({
  contextTitle,
  operations,
  basePath,
}: ModuleWorkspaceProps) {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const location = useLocation();
  const navigate = useNavigate();

  const activeOperation = useMemo(() => {
    // Expecting paths like: /pharmacy/<operation>...
    const path = location.pathname;
    if (!path.startsWith(basePath)) return undefined;

    const remainder = path.slice(basePath.length); // e.g. "/inventory/overview"
    const segments = remainder.split('/').filter(Boolean);
    const op = segments[0]; // "inventory"
    return op;
  }, [location.pathname, basePath]);

  const onOperationChange = useCallback(
    (/* operationId from ContentLayout */ operationId: string) => {
      // Navigate to the operation root: /pharmacy/<operationId>
      navigate(`${basePath}/${operationId}`);
    },
    [navigate, basePath]
  );

  // If route doesn't include an operation (e.g. user hit "/pharmacy"), the parent route
  // should redirect using <Navigate/> in routes. This component assumes nested routing.
  const fallbackOperation = operations[0]?.id ?? 'overview';

  return (
    <ContentLayout
      operations={operations}
      activeOperation={(activeOperation ?? fallbackOperation) as string}
      onOperationChange={onOperationChange}
      defaultOperation={fallbackOperation as string}
      contextTitle={contextTitle}
    >
      {/* Router renders the selected operation panel */}
      {/* theme is still available globally, operation screens can read theme via props or selector */}
      {/* We keep theme usage inside children modules as before. */}
      <React.Fragment>
        {/* If you need theme passed down, do it inside screens (they already accept theme props). */}
        {/* Operation content is now routed */}
        {/* IMPORTANT: Ensure parent route provides <Outlet/> */}
      </React.Fragment>
      {/* Actual content comes from nested routes */}
      {/* We place Outlet at the end so layout remains consistent */}
      <OutletWrapper theme={theme} />
    </ContentLayout>
  );
}

/**
 * Local wrapper so we can pass theme via Outlet context (best practice).
 * Any nested route can access it with: const { theme } = useOutletContext<{theme: 'light'|'dark'}>()
 */
import { Outlet } from 'react-router-dom';

function OutletWrapper({ theme }: { theme: 'light' | 'dark' }) {
  return <Outlet context={{ theme }} />;
}
