// src/store/slices/ui-slice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Theme and appearance
  theme: 'light', // light, dark, auto
  sidebarCollapsed: false,
  
  // Modals and overlays
  modals: {
    createBot: false,
    editBot: false,
    confirmAction: false,
    vendorDetails: false,
    notifications: false
  },
  
  // Loading states
  loading: {
    page: false,
    bots: false,
    marketData: false,
    orders: false,
    vendors: false
  },
  
  // Error states
  errors: {
    global: null,
    bots: null,
    marketData: null,
    orders: null,
    vendors: null
  },
  
  // UI preferences
  preferences: {
    autoRefresh: true,
    refreshInterval: 5000, // 5 seconds
    showConnectionStatus: true,
    enableNotificationSounds: true,
    enableDesktopNotifications: true,
    defaultChartTimeframe: '1D',
    compactView: false,
    showVendorInfo: true
  },
  
  // Dashboard layout
  dashboard: {
    layout: 'default', // default, compact, detailed
    widgetOrder: ['vendor-status', 'market', 'bots', 'notifications'],
    pinnedSymbols: ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK']
  },
  
  // Filters and search
  filters: {
    bots: {
      status: 'all', // all, running, stopped, error
      strategy: 'all'
    },
    orders: {
      status: 'all', // all, pending, executed, cancelled
      timeRange: '1D' // 1D, 1W, 1M, 3M, 1Y
    },
    notifications: {
      level: 'all',
      type: 'all',
      read: 'all'
    }
  },
  
  // Active selections
  selected: {
    botId: null,
    symbol: null,
    orderId: null,
    notificationId: null,
    vendorId: null
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme management
    setTheme: (state, action) => {
      state.theme = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', action.payload);
      }
    },
    
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
    
    // Modal management
    openModal: (state, action) => {
      const { modalName, data } = action.payload;
      state.modals[modalName] = true;
      if (data) {
        if (!state.modalData) state.modalData = {};
        state.modalData[modalName] = data;
      }
    },
    
    closeModal: (state, action) => {
      const { modalName } = action.payload;
      state.modals[modalName] = false;
      if (state.modalData) {
        delete state.modalData[modalName];
      }
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modalName => {
        state.modals[modalName] = false;
      });
      state.modalData = {};
    },
    
    // Loading states
    setLoading: (state, action) => {
      const { section, isLoading } = action.payload;
      state.loading[section] = isLoading;
    },
    
    setPageLoading: (state, action) => {
      state.loading.page = action.payload;
    },
    
    // Error management
    setError: (state, action) => {
      const { section, error } = action.payload;
      state.errors[section] = error;
    },
    
    clearError: (state, action) => {
      const { section } = action.payload;
      state.errors[section] = null;
    },
    
    clearAllErrors: (state) => {
      Object.keys(state.errors).forEach(section => {
        state.errors[section] = null;
      });
    },
    
    // Preferences
    updatePreferences: (state, action) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload
      };
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('ui-preferences', JSON.stringify(state.preferences));
      }
    },
    
    togglePreference: (state, action) => {
      const { preference } = action.payload;
      if (preference in state.preferences) {
        state.preferences[preference] = !state.preferences[preference];
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('ui-preferences', JSON.stringify(state.preferences));
        }
      }
    },
    
    // Dashboard layout
    updateDashboardLayout: (state, action) => {
      state.dashboard = {
        ...state.dashboard,
        ...action.payload
      };
    },
    
    reorderWidgets: (state, action) => {
      const { newOrder } = action.payload;
      state.dashboard.widgetOrder = newOrder;
    },
    
    addPinnedSymbol: (state, action) => {
      const { symbol } = action.payload;
      const symbolUpper = symbol.toUpperCase();
      if (!state.dashboard.pinnedSymbols.includes(symbolUpper)) {
        state.dashboard.pinnedSymbols.push(symbolUpper);
      }
    },
    
    removePinnedSymbol: (state, action) => {
      const { symbol } = action.payload;
      const symbolUpper = symbol.toUpperCase();
      state.dashboard.pinnedSymbols = state.dashboard.pinnedSymbols.filter(
        s => s !== symbolUpper
      );
    },
    
    updatePinnedSymbols: (state, action) => {
      const { symbols } = action.payload;
      state.dashboard.pinnedSymbols = symbols.map(s => s.toUpperCase());
    },
    
    // Filters
    updateFilters: (state, action) => {
      const { section, filters } = action.payload;
      state.filters[section] = {
        ...state.filters[section],
        ...filters
      };
    },
    
    resetFilters: (state, action) => {
      const { section } = action.payload;
      switch (section) {
        case 'bots':
          state.filters.bots = { status: 'all', strategy: 'all' };
          break;
        case 'orders':
          state.filters.orders = { status: 'all', timeRange: '1D' };
          break;
        case 'notifications':
          state.filters.notifications = { level: 'all', type: 'all', read: 'all' };
          break;
        default:
          // Reset all filters
          state.filters = {
            bots: { status: 'all', strategy: 'all' },
            orders: { status: 'all', timeRange: '1D' },
            notifications: { level: 'all', type: 'all', read: 'all' }
          };
      }
    },
    
    // Selections
    selectItem: (state, action) => {
      const { type, id } = action.payload;
      state.selected[type] = id;
    },
    
    clearSelection: (state, action) => {
      const { type } = action.payload;
      if (type) {
        state.selected[type] = null;
      } else {
        // Clear all selections
        Object.keys(state.selected).forEach(key => {
          state.selected[key] = null;
        });
      }
    },
    
    // Bulk operations
    resetUIState: (state) => {
      return {
        ...initialState,
        theme: state.theme, // Preserve theme
        preferences: state.preferences // Preserve preferences
      };
    },
    
    loadUISettings: (state, action) => {
      const { settings } = action.payload;
      return {
        ...state,
        ...settings
      };
    },
    
    // Initialize from localStorage
    initializeFromStorage: (state) => {
      if (typeof window !== 'undefined') {
        // Load theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
          state.theme = savedTheme;
        }
        
        // Load preferences
        const savedPreferences = localStorage.getItem('ui-preferences');
        if (savedPreferences) {
          try {
            state.preferences = {
              ...state.preferences,
              ...JSON.parse(savedPreferences)
            };
          } catch (error) {
            console.error('Failed to parse saved UI preferences:', error);
          }
        }
      }
    }
  }
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  openModal,
  closeModal,
  closeAllModals,
  setLoading,
  setPageLoading,
  setError,
  clearError,
  clearAllErrors,
  updatePreferences,
  togglePreference,
  updateDashboardLayout,
  reorderWidgets,
  addPinnedSymbol,
  removePinnedSymbol,
  updatePinnedSymbols,
  updateFilters,
  resetFilters,
  selectItem,
  clearSelection,
  resetUIState,
  loadUISettings,
  initializeFromStorage
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectTheme = (state) => state.ui.theme;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
export const selectModalOpen = (modalName) => (state) => state.ui.modals[modalName];
export const selectIsLoading = (section) => (state) => state.ui.loading[section];
export const selectError = (section) => (state) => state.ui.errors[section];
export const selectPreferences = (state) => state.ui.preferences;
export const selectDashboardLayout = (state) => state.ui.dashboard;
export const selectFilters = (section) => (state) => state.ui.filters[section];
export const selectSelectedItem = (type) => (state) => state.ui.selected[type];
export const selectPinnedSymbols = (state) => state.ui.dashboard.pinnedSymbols;
