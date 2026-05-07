/**
 * Single HTTP client for the renderer: same base URL (`VITE_API_BASE_URL` via
 * `apiConfig`), Bearer token + facility/staff headers, and 401 handling.
 * Previously this file used `REACT_APP_*` and a different default host, which
 * broke auth and produced “not found” responses for callers importing this path.
 */
export { axiosInstance as default, axiosInstance } from '../../../../app/api/axiosConfig';
