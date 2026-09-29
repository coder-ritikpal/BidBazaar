import { create } from 'zustand';
import {
  addToWishlist as addToWishlistApi,
  getEnrolledAuctions,
  getWonAuctions as getWonAuctionsApi,
  getWishlist,
  removeFromWishlist as removeFromWishlistApi,
} from '../data/api.js';

export const useDashboardStore = create((set, get) => ({
  // Won Auctions State
  wonAuctions: [],
  loadingWonAuctions: false,
  errorWonAuctions: null,
  fetchWonAuctions: async () => {
    set({ loadingWonAuctions: true, errorWonAuctions: null });
    try {
      const response = await getWonAuctionsApi();
      set({ wonAuctions: response.data.auctions || response.data || [], loadingWonAuctions: false });
    } catch (err) {
      console.error('Error fetching won auctions:', err);
      if (err.response && (err.response.status === 404 || err.response.status === 401)) {
        set({ wonAuctions: [], loadingWonAuctions: false, errorWonAuctions: null });
      } else {
        set({ errorWonAuctions: 'Failed to load your won auctions.', loadingWonAuctions: false });
      }
    }
  },
  // Enrolled Auctions State
  enrolledAuctions: [],
  loadingEnrolledAuctions: false,
  errorEnrolledAuctions: null,
  fetchEnrolledAuctions: async () => {
    set({ loadingEnrolledAuctions: true, errorEnrolledAuctions: null });
    try {
      const response = await getEnrolledAuctions();
      set({ enrolledAuctions: response.data.auctions || response.data || [], loadingEnrolledAuctions: false });
    } catch (err) {
      console.error('Error fetching enrolled auctions:', err);
      // If not found (404) or not authorized (401), just clear the list and any previous errors.
      if (err.response && (err.response.status === 404 || err.response.status === 401)) {
        set({ enrolledAuctions: [], loadingEnrolledAuctions: false, errorEnrolledAuctions: null });
      } else {
        set({ errorEnrolledAuctions: 'Failed to load auctions you have joined.', loadingEnrolledAuctions: false });
      }
    }
  },

  // Wishlist State
  wishlist: [],
  loadingWishlist: false,
  errorWishlist: null,
  fetchWishlist: async () => {
    set({ loadingWishlist: true, errorWishlist: null });
    try {
      const response = await getWishlist();
      set({ wishlist: response.data.wishlist || response.data || [], loadingWishlist: false });
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      // If not found (404) or not authorized (401), just clear the list and any previous errors.
      if (err.response && (err.response.status === 404 || err.response.status === 401)) {
        set({ wishlist: [], loadingWishlist: false, errorWishlist: null });
      } else {
        set({ errorWishlist: 'Failed to load your wishlist.', loadingWishlist: false });
      }
    }
  },
  addToWishlist: async (auctionId, snapshotFallback = null) => {
    const id = String(auctionId);
    const previousList = get().wishlist;

    // If already in wishlist, avoid duplicate additions
    if (previousList.some((item) => String(item._id) === id)) {
      return;
    }

    // 1. Optimistic update: immediately show item as wishlisted
    const optimisticItem = {
      _id: id,
      title: snapshotFallback?.title || '',
      image: snapshotFallback?.image || snapshotFallback?.images?.[0]?.url || '',
      currentBid: snapshotFallback?.currentBid || snapshotFallback?.currentPrice || 0,
      price: snapshotFallback?.price || 0,
      status: snapshotFallback?.status || 'live',
    };

    set((state) => ({
      wishlist: [optimisticItem, ...state.wishlist],
    }));

    try {
      const response = await addToWishlistApi(id);
      const newItem = response.data?.item;
      if (newItem) {
        set((state) => ({
          wishlist: state.wishlist.map((item) =>
            String(item._id) === id ? { ...newItem, _id: id } : item
          ),
        }));
      }
    } catch (err) {
      // Rollback optimistic update on error
      set({ wishlist: previousList });
      console.error('Error adding item to wishlist:', err);
      throw err;
    }
  },
  removeFromWishlist: async (auctionId) => {
    const id = String(auctionId);
    const previousList = get().wishlist;

    // 1. Optimistic update: immediately remove item from UI
    set((state) => ({
      wishlist: state.wishlist.filter((item) => String(item._id) !== id),
    }));

    try {
      await removeFromWishlistApi(id);
    } catch (err) {
      // If error is 404 (item was already removed in DB), keep it removed
      if (err.response?.status === 404) {
        return;
      }
      // Rollback on unexpected server/network failure
      set({ wishlist: previousList });
      console.error('Error removing item from wishlist:', err);
      throw err;
    }
  },

  // Action to clear all user-specific data on logout
  clearUserSpecificData: () => {
    set({
      enrolledAuctions: [],
      wonAuctions: [],
      wishlist: [],
      loadingWonAuctions: false,
      errorWonAuctions: null,
      loadingEnrolledAuctions: false,
      errorEnrolledAuctions: null,
      loadingWishlist: false,
      errorWishlist: null,
    });
  },
}));
