import  { createContext, useContext } from 'react';
import {type AppState } from '../../state/appTypes';
export {type AppState}
interface AppContextType {
  state: AppState;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  setSystemStatus: (status: AppState['systemStatus']) => void;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: AppState['currentPage']) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}