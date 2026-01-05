//uiSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/* =========================
   Types
========================= */

interface UIState {
  isInitialized: boolean;
  isLoading: boolean;
  loadingMessage: string | null;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
  modalOpen: Record<string, boolean>;
}

type UIPreferences = Pick<UIState, 'theme' | 'sidebarOpen' | 'sidebarCollapsed'>;

/* =========================
   Local Storage Helpers
========================= */

const UI_STORAGE_KEY = 'custocare_ui_preferences';

const loadUIPreferences = (): UIPreferences => {
  try {
    const stored = localStorage.getItem(UI_STORAGE_KEY);
    if (!stored) {
      return { 
        theme: 'dark', 
        sidebarOpen: true,
        sidebarCollapsed: false 
      };
    }
    return JSON.parse(stored);
  } catch {
    return { 
      theme: 'dark', 
      sidebarOpen: true,
      sidebarCollapsed: false 
    };
  }
};

const saveUIPreferences = (prefs: UIPreferences) => {
  try {
    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // silently fail (private mode, quota exceeded, etc.)
  }
};

/* =========================
   Initial State
========================= */

const persistedPrefs = loadUIPreferences();

const initialState: UIState = {
  isInitialized: true, // Initialize immediately - no artificial loading
  isLoading: false,
  loadingMessage: null,
  sidebarOpen: persistedPrefs.sidebarOpen,
  sidebarCollapsed: persistedPrefs.sidebarCollapsed,
  theme: persistedPrefs.theme,
  modalOpen: {},
};

/* =========================
   Slice
========================= */

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    /* ---------- App Lifecycle ---------- */

    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (!action.payload) {
        state.loadingMessage = null;
      }
    },

    setLoadingMessage: (state, action: PayloadAction<string | null>) => {
      state.loadingMessage = action.payload;
      if (action.payload) {
        state.isLoading = true;
      }
    },

    /* ---------- Sidebar ---------- */

    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
      saveUIPreferences({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        sidebarCollapsed: state.sidebarCollapsed,
      });
    },

    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
      saveUIPreferences({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        sidebarCollapsed: state.sidebarCollapsed,
      });
    },

    toggleSidebarCollapse: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      saveUIPreferences({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        sidebarCollapsed: state.sidebarCollapsed,
      });
    },

    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
      saveUIPreferences({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        sidebarCollapsed: state.sidebarCollapsed,
      });
    },

    /* ---------- Theme ---------- */

    setTheme: (state, action: PayloadAction<'dark' | 'light'>) => {
      state.theme = action.payload;
      saveUIPreferences({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        sidebarCollapsed: state.sidebarCollapsed,
      });
    },

    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      saveUIPreferences({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        sidebarCollapsed: state.sidebarCollapsed,
      });
    },

    /* ---------- Modals ---------- */

    openModal: (state, action: PayloadAction<string>) => {
      state.modalOpen[action.payload] = true;
    },

    closeModal: (state, action: PayloadAction<string>) => {
      state.modalOpen[action.payload] = false;
    },

    toggleModal: (state, action: PayloadAction<string>) => {
      state.modalOpen[action.payload] = !state.modalOpen[action.payload];
    },
  },
});

/* =========================
   Exports
========================= */

export const {
  setInitialized,
  setLoading,
  setLoadingMessage,
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapse,
  setSidebarCollapsed,
  setTheme,
  toggleTheme,
  openModal,
  closeModal,
  toggleModal,
} = uiSlice.actions;

export default uiSlice.reducer;