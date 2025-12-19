import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isInitialized: boolean;
  isLoading: boolean;
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  modalOpen: {
    [key: string]: boolean;
  };
}

const initialState: UIState = {
  isInitialized: false,
  isLoading: true,
  sidebarOpen: true,
  theme: 'dark',
  modalOpen: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Initialize app
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },

    // Global loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Sidebar
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    // Theme
    setTheme: (state, action: PayloadAction<'dark' | 'light'>) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },

    // Modals
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