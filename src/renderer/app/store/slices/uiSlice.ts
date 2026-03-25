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

const DEFAULT_UI_PREFERENCES: UIPreferences = {
  theme: 'light',
  sidebarOpen: true,
  sidebarCollapsed: false,
};

const isValidTheme = (value: unknown): value is UIState['theme'] =>
  value === 'light' || value === 'dark';

const saveUIPreferences = (prefs: UIPreferences) => {
  try {
    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // silently fail (private mode, quota exceeded, etc.)
  }
};

const loadUIPreferences = (): UIPreferences => {
  try {
    const stored = localStorage.getItem(UI_STORAGE_KEY);

    // Nothing in localStorage -> use light and persist it
    if (!stored) {
      saveUIPreferences(DEFAULT_UI_PREFERENCES);
      return DEFAULT_UI_PREFERENCES;
    }

    const parsed = JSON.parse(stored) as Partial<UIPreferences>;

    const normalized: UIPreferences = {
      theme: isValidTheme(parsed?.theme) ? parsed.theme : 'light',
      sidebarOpen:
        typeof parsed?.sidebarOpen === 'boolean'
          ? parsed.sidebarOpen
          : DEFAULT_UI_PREFERENCES.sidebarOpen,
      sidebarCollapsed:
        typeof parsed?.sidebarCollapsed === 'boolean'
          ? parsed.sidebarCollapsed
          : DEFAULT_UI_PREFERENCES.sidebarCollapsed,
    };

    // Re-save normalized value in case stored object is partial/invalid
    saveUIPreferences(normalized);

    return normalized;
  } catch {
    // Invalid JSON or localStorage read error -> fallback to light and persist it
    saveUIPreferences(DEFAULT_UI_PREFERENCES);
    return DEFAULT_UI_PREFERENCES;
  }
};

/* =========================
   Initial State
========================= */

const persistedPrefs = loadUIPreferences();

const initialState: UIState = {
  isInitialized: true,
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
   Selectors
========================= */

export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen;
export const selectSidebarCollapsed = (state: { ui: UIState }) => state.ui.sidebarCollapsed;
export const selectIsLoading = (state: { ui: UIState }) => state.ui.isLoading;
export const selectLoadingMessage = (state: { ui: UIState }) => state.ui.loadingMessage;
export const selectIsInitialized = (state: { ui: UIState }) => state.ui.isInitialized;
export const selectModalOpen = (modalId: string) => (state: { ui: UIState }) =>
  state.ui.modalOpen[modalId] || false;

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
