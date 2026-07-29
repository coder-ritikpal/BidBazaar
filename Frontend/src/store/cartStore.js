import { create } from 'zustand';
import { toast } from 'react-toastify';
import api from '@/utils/api';

// Helper to load the Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const useCartStore = create((set, get) => ({
  myOrders: [],
  loadingMyOrders: false,
  errorMyOrders: null,
  currentOrder: null,
  loadingCurrentOrder: false,
  errorCurrentOrder: null,

  fetchMyOrders: async () => {
    set({ loadingMyOrders: true, errorMyOrders: null });
    try {
      const response = await api.get('/dashboard/orders/my-orders');
      set({ myOrders: response.data.orders || [], loadingMyOrders: false });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch orders.';
      set({ errorMyOrders: errorMessage, loadingMyOrders: false });
    }
  },

  fetchOrderById: async (orderId) => {
    set({ loadingCurrentOrder: true, errorCurrentOrder: null });
    try {
      const response = await api.get(`/dashboard/orders/${orderId}`);
      set({ currentOrder: response.data.order, loadingCurrentOrder: false });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch order details.';
      set({ errorCurrentOrder: errorMessage, loadingCurrentOrder: false });
      throw error;
    }
  },

  createOrder: async (auctionId) => {
    try {
      const response = await api.post('/dashboard/orders', { auctionId });
      toast.success(response.data.message);
      get().fetchMyOrders(); // Refresh orders after adding to cart
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add item to cart.';
      toast.error(errorMessage);
      throw error;
    }
  },

  shipOrder: async (orderId) => {
    try {
      const trackingInfo = {
        shippingProvider: 'DemoExpress',
        trackingNumber: `DE${Date.now()}`,
      };
      await api.post(`/dashboard/orders/${orderId}/ship`, trackingInfo);
      get().fetchMyOrders();
    } catch (error) {
      console.error("Failed to ship order:", error);
      throw error;
    }
  },

  confirmDelivery: async (orderId) => {
    try {
      const response = await api.post(`/dashboard/orders/${orderId}/deliver`);
      set({ currentOrder: response.data.order });
      get().fetchMyOrders(); // Also refresh the main list
    } catch (error) {
      console.error("Failed to confirm delivery:", error);
      throw error;
    }
  },

  payForOrder: async (order, user) => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error('Could not load payment gateway. Please check your connection.');
      throw new Error('Razorpay script failed to load.');
    }

    if (!user?.phoneNumber) {
      const message = "Please add a phone number to your profile to proceed with payment.";
      toast.error(message);
      throw new Error(message); // Throw an error to be caught by the component
    }

    const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKeyId) {
      const errorMessage = "Razorpay Key ID is not configured. Please set VITE_RAZORPAY_KEY_ID in your frontend .env file and restart the server.";
      console.error(errorMessage);
      toast.error("Payment gateway is not configured correctly. Please contact support.");
      throw new Error(errorMessage);
    }

    try {
      // 1. Create a Razorpay Order from our backend
      const { data: razorpayOrder } = await api.post('/dashboard/payments/create-order', {
        amount: order.amount,
        orderId: order._id,
      });

      // 2. Open Razorpay Checkout
      const options = {
        key: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'BidBazaar',
        description: `Total for ${order.itemDetails.title} (incl. fees)`,
        order_id: razorpayOrder.id,
        handler: async function (response) {
          // 3. Verify the payment on our backend
          try {
            const verificationData = { ...response, internal_order_id: order._id };
            const verificationRes = await api.post('/dashboard/payments/verify', verificationData);
            toast.success(verificationRes.data.message);
            setTimeout(() => get().fetchMyOrders(), 2000); // Refresh orders after a delay
          } catch (verifyError) {
            toast.error(verifyError.response?.data?.message || 'Payment verification failed.');
          }
        },
        prefill: {
          name: `${user.fullName.firstName} ${user.fullName.lastName}`,
          email: user.email,
          contact: user.phoneNumber || '',
        },
        theme: {
          color: '#6D28D9',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => toast.error(`Payment Failed: ${response.error.description}`));
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate payment.');
      throw error;
    }
  },

  clearCartData: () => {
    set({
      myOrders: [],
      loadingMyOrders: false,
      errorMyOrders: null,
    });
  },
}));