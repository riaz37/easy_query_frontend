import { create } from 'zustand';

interface NavigationState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeRoute: string;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setActiveRoute: (route: string) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeRoute: '/',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', String(collapsed));
    }
  },
  toggleSidebarCollapsed: () => set((state) => {
    const newState = !state.sidebarCollapsed;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', String(newState));
    }
    return { sidebarCollapsed: newState };
  }),
  setActiveRoute: (route) => set({ activeRoute: route }),
}));

// Load persisted state on initialization
if (typeof window !== 'undefined') {
  const persisted = localStorage.getItem('sidebar-collapsed');
  if (persisted !== null) {
    useNavigationStore.setState({ sidebarCollapsed: persisted === 'true' });
  }
}

