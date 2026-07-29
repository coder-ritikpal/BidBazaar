import { create } from 'zustand';
import {
  getListedItems as getListedItemsApi,
  getProductById as getProductByIdApi,
  createProduct as createProductApi,
  updateProduct as updateProductApi,
  deleteProduct as deleteProductApi,
  getSoldItems as getSoldItemsApi,
} from '../data/api.js';

const addUiProperties = (product) => {
  if (!product) return null;
  return {
    ...product,
    image: product.image || product.images?.[0]?.url || product.images?.[0]?.thumbnailUrl || null,
    startingBid: product.startingBid || product.price || 0,
    canEdit: new Date(product.reviewEndsAt).getTime() > Date.now(),
  };
};

export const useInventoryStore = create((set) => ({
  // Seller's Listed Items State
  listedItems: [],
  loadingListedItems: false,
  errorListedItems: null,
  creatingProduct: false,
  createProductError: null,
  updatingProduct: false,
  updateProductError: null,
  deletingProductId: null,
  deleteProductError: null,
  // Seller's Sold Items State
  soldItems: [],
  loadingSoldItems: false,
  errorSoldItems: null,
  currentEditingProduct: null,
  fetchListedItems: async () => {
    set({ loadingListedItems: true, errorListedItems: null });
    try {
      const response = await getListedItemsApi();
      const products = (response.data?.products || []).map(addUiProperties);
      set({ listedItems: products, loadingListedItems: false });
    } catch (err) {
      console.error('Error fetching listed items:', err);
      if (err.response && err.response.status === 404) {
        set({ listedItems: [], loadingListedItems: false });
      } else {
        set({ errorListedItems: 'Failed to load your listed items.', loadingListedItems: false });
      }
    }
  },
  fetchProductById: async (productId) => {
    try {
      const response = await getProductByIdApi(productId);
      const product = addUiProperties(response.data.product);
      set({ currentEditingProduct: product });
      return product;
    } catch (err) {
      set({ currentEditingProduct: null });
      throw err;
    }
  },
  createProduct: async (formData) => {
    set({ creatingProduct: true, createProductError: null });
    try {
      const response = await createProductApi(formData);

      set((state) => ({
        listedItems: [addUiProperties(response.data.product), ...state.listedItems],
        creatingProduct: false,
        currentEditingProduct: null,
      }));

      return response.data.product;
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || 'Failed to create product.';
      set({ createProductError: message, creatingProduct: false });
      throw err;
    }
  },
  updateProduct: async (productId, formData) => {
    set({ updatingProduct: true, updateProductError: null });
    try {
      const response = await updateProductApi(productId, formData);

      set((state) => ({
        listedItems: state.listedItems.map((item) =>
          item._id === productId ? addUiProperties(response.data.product) : item,
        ),
        updatingProduct: false,
        currentEditingProduct: addUiProperties(response.data.product),
      }));

      return response.data.product;
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.message || 'Failed to update product.';
      set({ updateProductError: message, updatingProduct: false });
      throw err;
    }
  },
  deleteProduct: async (productId) => {
    set({ deletingProductId: productId, deleteProductError: null });
    try {
      await deleteProductApi(productId);

      set((state) => ({
        listedItems: state.listedItems.filter((item) => item._id !== productId),
        deletingProductId: null,
        currentEditingProduct: state.currentEditingProduct?._id === productId ? null : state.currentEditingProduct,
      }));
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete product.';
      set({ deleteProductError: message, deletingProductId: null });
      throw err;
    }
  },

  fetchSoldItems: async () => {
    set({ loadingSoldItems: true, errorSoldItems: null });
    try {
      const response = await getSoldItemsApi();
      set({ soldItems: response.data.orders || [], loadingSoldItems: false });
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch sold items.';
      set({ errorSoldItems: errorMessage, loadingSoldItems: false });
    }
  },

  clearInventoryData: () => {
    set({
      listedItems: [],
      loadingListedItems: false,
      errorListedItems: null,
      currentEditingProduct: null,
    });
  },
}));