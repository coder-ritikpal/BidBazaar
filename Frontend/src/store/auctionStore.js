import { create } from 'zustand';
import { getAuctions } from '../data/api.js';

export const useAuctionStore = create((set) => ({
  // All Public Auctions State
  allAuctions: [],
  auctionPagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
  loadingAllAuctions: false,
  errorAllAuctions: null,
  fetchAllAuctions: async (page = 1) => {
    set({ loadingAllAuctions: true, errorAllAuctions: null });
    try {
      const response = await getAuctions(page);
      set({
        allAuctions: response.data.auctions || response.data || [],
        auctionPagination: response.data.pagination || { page, limit: 50, total: 0, totalPages: 0 },
        loadingAllAuctions: false,
      });
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
