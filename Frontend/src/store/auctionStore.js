import { create } from 'zustand';
import { getAuctions } from '../data/api.js';

export const useAuctionStore = create((set) => ({
  // All Public Auctions State
  allAuctions: [],
  loadingAllAuctions: false,
  errorAllAuctions: null,
  fetchAllAuctions: async () => {
    set({ loadingAllAuctions: true, errorAllAuctions: null });
    try {
      const response = await getAuctions();
      set({ allAuctions: response.data.auctions || response.data || [], loadingAllAuctions: false });
    } catch (err) {
      console.error('Error fetching all auctions:', err);
      if (err.response && err.response.status === 404) {
        set({ allAuctions: [], loadingAllAuctions: false });
      } else {
        set({ errorAllAuctions: 'Failed to load auctions.', loadingAllAuctions: false });
      }
    }
  },
}));