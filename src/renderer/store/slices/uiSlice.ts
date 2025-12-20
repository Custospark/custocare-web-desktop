import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/* =========================
   Types
========================= */

interface UIState {
  isInitialized: boolean;
  isLoading: boolean;
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  modalOpen: Record<string, boolean>;
}

type UIPreferences = Pick<UIState, 'theme' | 'sidebarOpen'>;

/* =========================
   Local Storage Helpers
========================= */

const UI_STORAGE_KEY = 'ui_preferences';

const loadUIPreferences = (): UIPreferences => {
  try {
    const stored = localStorage.getItem(UI_STORAGE_KEY);
    if (!stored) {
      return { theme: 'dark', sidebarOpen: true };
    }
    return JSON.parse(stored);
  } catch {
    return { theme: 'dark', sidebarOpen: true };
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
  isInitialized: false,
  isLoading: false,
  sidebarOpen: persistedPrefs.sidebarOpen,
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
    },

    /* ---------- Sidebar ---------- */

    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
      saveUIPreferences({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      });
    },

    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
      saveUIPreferences({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      });
    },

    /* ---------- Theme ---------- */

    setTheme: (state, action: PayloadAction<'dark' | 'light'>) => {
      state.theme = action.payload;
      saveUIPreferences({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      });
    },

    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      saveUIPreferences({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
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
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  toggleTheme,
  openModal,
  closeModal,
  toggleModal,
} = uiSlice.actions;

export default uiSlice.reducer;
