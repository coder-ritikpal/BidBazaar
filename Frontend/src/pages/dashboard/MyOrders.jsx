import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { getMyOrdersStyles } from '@/styles/dashboard/myOrdersStyles';
import { Button } from '@/components/ui/button';
import { ShoppingCart, RefreshCw, CreditCard, Truck } from 'lucide-react';
import { toast } from 'react-toastify';

const MyOrders = () => {
  const { theme } = useThemeStore();
  const styles = getMyOrdersStyles(theme);
  const { myOrders, loadingMyOrders, errorMyOrders, fetchMyOrders, payForOrder, shipOrder } = useCartStore();
  const { user } = useAuthStore();
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [shippingOrderId, setShippingOrderId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  const handlePayment = async (order) => {
    if (!user) {
      toast.error("You must be logged in to make a payment.");
      return;
    }
    setPayingOrderId(order._id);
    try {
      // The payForOrder action now handles the entire Razorpay flow
      await payForOrder(order, user);
    } catch (error) {
      // The store now throws a specific error for missing phone number
      if (error.message.includes("Please add a phone number")) {
        navigate('/profile'); // Redirect user to profile page
      } else {
        toast.error(error.response?.data?.message || "Payment failed to start. Please try again.");
      }
    } finally {
      // The Razorpay modal is asynchronous; we don't know when it closes.
      // We can reset the state here, but the UI will update when fetchMyOrders is called in the handler.
      setPayingOrderId(null);
    }
  };

  const handleShipment = async (orderId) => {
    setShippingOrderId(orderId);
    try {
      await shipOrder(orderId);
      toast.success("Order has been shipped (simulated).");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to ship order.");
    } finally {
      setShippingOrderId(null);
    }
  };

  const getTrackingUrl = (provider, number) => {
    if (!provider || !number) return '#';
    const formattedProvider = provider.toLowerCase();
    if (formattedProvider.includes('fedex')) {
      return `https://www.fedex.com/fedextrack/?trknbr=${number}`;
    }
    if (formattedProvider.includes('ups')) {
      return `https://www.ups.com/track?loc=en_US&tracknum=${number}`;
    }
    // A generic Google search fallback for other carriers like our 'DemoExpress'
    return `https://www.google.com/search?q=${provider}+tracking+${number}`;
  };

  const pendingPaymentOrders = myOrders.filter(o => o.status === 'pending_payment');
  const processedOrders = myOrders.filter(o => o.status !== 'pending_payment');

  const renderOrderList = (orders, isPending) => {
    if (orders.length === 0) {
      return (
        <p className={styles.emptyStateText}>
          {isPending ? "You have no items awaiting payment." : "You have no processed orders."}
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {orders.map((order) => {
          const baseAmount = order.amount;
          const protectionFee = baseAmount * 0.05 + 100;
          const totalAmount = baseAmount + protectionFee;
          return (
          <Link to={`/order/${order._id}`} key={order._id} className={styles.orderCard}>
            <img
              src={order.itemDetails?.image || 'https://via.placeholder.com/100'}
              alt={order.itemDetails?.title}
              className={styles.image}
            />
            <div className={styles.itemDetails}>
              <h3 className={styles.itemTitle}>{order.itemDetails?.title}</h3>
              <p className={styles.price}>₹{order.amount}</p>
              <p className={styles.orderId}>Order ID: {order._id.slice(-6)}</p>
            </div>
            <div className={styles.statusSection}>
              {isPending ? (
                <div className="flex flex-col items-end gap-2 text-right">
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span>Item Price: ₹{baseAmount.toFixed(2)}</span><br />
                    <span>Buyer Protection: ₹{protectionFee.toFixed(2)}</span>
                  </div>
                  <p className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Total: ₹{totalAmount.toFixed(2)}</p>
                  <Button onClick={(e) => { e.preventDefault(); handlePayment(order); }} disabled={payingOrderId === order._id}>
                    {payingOrderId === order._id ? 'Initiating...' : <><CreditCard className="mr-2 h-4 w-4" /> Pay Now</>}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  <span className={styles.statusBadge}>{order.status ? (order.status.charAt(0).toUpperCase() + order.status.slice(1)).replace('_', ' ') : 'Processing'}</span>

                  {order.status === 'shipped' && order.trackingNumber && (
                     <a href={getTrackingUrl(order.shippingProvider, order.trackingNumber)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                       <Button variant="outline" size="sm" className="bg-transparent text-foreground hover:text-accent-foreground">
                         <Truck className="mr-2 h-4 w-4" /> Track Package
                       </Button>
                     </a>
                  )}
                </div>
              )}
            </div>
          </Link>
        )})}
      </div>
    );
  };

  if (loadingMyOrders) {
    return (
      <div className={styles.loadingContainer}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className="max-w-4xl mx-auto">
        <div className={styles.header}>
          <h1 className={styles.title}>
            <ShoppingCart className="text-purple-500" /> My Cart & Orders
          </h1>
          <button onClick={fetchMyOrders} className={styles.refreshButton} title="Refresh">
            <RefreshCw className={`w-5 h-5 ${loadingMyOrders ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {errorMyOrders && <div className={styles.errorState}>{errorMyOrders}</div>}

        {myOrders.length === 0 && !loadingMyOrders ? (
          <div className={styles.emptyStateContainer}>
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className={styles.emptyStateText}>Win an auction to add items to your cart.</p>
            <Link to="/auctions">
              <Button>Browse Auctions</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            <section>
              <h2 className={styles.sectionTitle}>Awaiting Payment ({pendingPaymentOrders.length})</h2>
              {renderOrderList(pendingPaymentOrders, true)}
            </section>
            <section>
              <h2 className={styles.sectionTitle}>Order History ({processedOrders.length})</h2>
              {renderOrderList(processedOrders, false)}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;