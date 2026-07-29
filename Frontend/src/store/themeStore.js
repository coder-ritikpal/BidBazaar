import { create } from 'zustand';
import { persist } from 'zustand/middleware';


export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light', // Initial theme state
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),
    }),
    {
      name: 'theme-storage', // unique name for the item in storage
    }
  )
);