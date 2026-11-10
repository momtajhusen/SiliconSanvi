import { create } from 'zustand';

const BUSINESS_KEY = 'silicon-admin-business';

function storedBusiness() {
  try {
    return localStorage.getItem(BUSINESS_KEY) === 'traders' ? 'traders' : 'institute';
  } catch {
    return 'institute';
  }
}

const useUIStore = create((set) => ({
  /** Which business menu the shared admin sidebar shows: `institute` (Silicon) or `traders` (Sanvi). */
  business: storedBusiness(),
  setBusiness: (business) => {
    try {
      localStorage.setItem(BUSINESS_KEY, business);
    } catch {
      /* private mode */
    }
    set({ business });
  },

  sidebarCollapsed: false,
  activeRole: 'super_admin',
  mobileOpen: false,
  breadcrumbs: [],

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  
  setActiveRole: (role) => set({ activeRole: role }),
  
  setMobileOpen: (open) => set({ mobileOpen: open }),
  
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
}));

export default useUIStore;