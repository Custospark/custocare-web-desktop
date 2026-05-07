import type { AppDispatch } from '../store';
import { queryClient } from '../../api/axiosConfig';
import { logout } from '../slices/authSlice';
import { clearActiveContext } from '../slices/activeContextSlice';

/**
 * Clears auth storage, facility/user context, and React Query cache so no stale
 * authenticated requests run after logout (aligns Navbar logout with useLogout).
 */
export function logoutClientSession(dispatch: AppDispatch): void {
  dispatch(logout());
  dispatch(clearActiveContext());
  queryClient.clear();
}
