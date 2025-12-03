import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  timestamp: Date;
}

export interface Modal {
  id: string;
  component: string;
  props?: Record<string, any>;
  isOpen: boolean;
}

interface UIState {
  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;
  
  // Modals
  modals: Modal[];
  
  // Toasts (managed by Sonner, but we track them here)
  toasts: Toast[];
  
  // Sidebar state (moved from navigation-store for centralization)
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Actions
  setGlobalLoading: (loading: boolean, message?: string) => void;
  openModal: (component: string, props?: Record<string, any>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => string;
  removeToast: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  toggleSidebarCollapsed: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      globalLoading: false,
      loadingMessage: null,
      modals: [],
      toasts: [],
      sidebarOpen: true,
      sidebarCollapsed: false,

      // Loading actions
      setGlobalLoading: (loading, message) =>
        set({
          globalLoading: loading,
          loadingMessage: message || null,
        }),

      // Modal actions
      openModal: (component, props) => {
        const id = `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set((state) => ({
          modals: [
            ...state.modals,
            {
              id,
              component,
              props,
              isOpen: true,
            },
          ],
        }));
        return id;
      },

      closeModal: (id) =>
        set((state) => ({
          modals: state.modals.filter((modal) => modal.id !== id),
        })),

      closeAllModals: () => set({ modals: [] }),

      // Toast actions
      addToast: (toast) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set((state) => ({
          toasts: [
            ...state.toasts,
            {
              ...toast,
              id,
              timestamp: new Date(),
            },
          ],
        }));
        return id;
      },

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        })),

      // Sidebar actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
        if (typeof window !== 'undefined') {
          localStorage.setItem('sidebar-collapsed', String(collapsed));
        }
      },
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleSidebarCollapsed: () => {
        set((state) => {
          const newState = !state.sidebarCollapsed;
          if (typeof window !== 'undefined') {
            localStorage.setItem('sidebar-collapsed', String(newState));
          }
          return { sidebarCollapsed: newState };
        });
      },
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

// Load persisted sidebar state on initialization
if (typeof window !== 'undefined') {
  const persisted = localStorage.getItem('sidebar-collapsed');
  if (persisted !== null) {
    useUIStore.setState({ sidebarCollapsed: persisted === 'true' });
  }
}

