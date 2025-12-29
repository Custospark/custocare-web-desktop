export interface AppState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  systemStatus: 'online' | 'warning' | 'error';
  searchQuery: string;
  currentPage: 'dashboard' | 'patients' | 'analytics' | 'settings';
}

export type Action =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_SYSTEM_STATUS'; payload: AppState['systemStatus'] }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_CURRENT_PAGE'; payload: AppState['currentPage'] };
