import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { getOrderDetailStyles } from '@/styles/dashboard/orderDetailStyles';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { CheckCircle, CreditCard, Package, Truck, Home, ArrowLeft } from 'lucide-react';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const styles = getOrderDetailStyles(theme);
  const { user } = useAuthStore();

  const {
    currentOrder: order,
    loadingCurrentOrder: loading,
    errorCurrentOrder: error,
    fetchOrderById,
    confirmDelivery,
  } = useCartStore();

  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    fetchOrderById(orderId).catch(() => {
      toast.error("Could not load order details.");
      navigate('/orders');
    });
  }, [orderId, fetchOrderById, navigate]);

  const handleConfirmDelivery = async () => {
    setIsConfirming(true);
    try {
      await confirmDelivery(orderId);
      toast.success("Delivery confirmed! Thank you for your purchase.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to confirm delivery.");
    } finally {
      setIsConfirming(false);
    }
  };

  const isBuyer = user?.id === order?.winnerId;

  const buyerStatusSteps = [
    { status: 'pending_payment', title: 'Awaiting Payment', desc: 'Your won item is in your cart, ready for payment.', icon: CreditCard },
    { status: 'paid', title: 'Paid', desc: 'Payment confirmed. The seller will ship your item soon.', icon: CheckCircle },
    { status: 'shipped', title: 'In Transit', desc: 'The seller has shipped your item.', icon: Truck },
    { status: 'delivered', title: 'Delivered', desc: 'You have received your item. Enjoy!', icon: Home },
  ];

  const sellerStatusSteps = [
    { status: 'pending_payment', title: 'Awaiting Payment', desc: 'The buyer has not paid for this item yet.', icon: CreditCard },
    { status: 'paid', title: 'Action Required', desc: 'Payment received. Please ship the item to the buyer.', icon: Package },
    { status: 'shipped', title: 'Shipped', desc: 'You have shipped the item. Awaiting buyer confirmation.', icon: Truck },
    { status: 'delivered', title: 'Delivered', desc: 'The buyer has confirmed delivery. The transaction is complete.', icon: Home },
  ];

  const statusSteps = isBuyer ? buyerStatusSteps : sellerStatusSteps;

  const currentStatusIndex = order ? statusSteps.findIndex(step => step.status === order.status) : -1;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.container}>
        <p className="text-center text-red-500">{error || "Order not found."}</p>
        <div className="text-center mt-4">
          <Link to="/orders" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const baseAmount = order.amount;
  const protectionFee = baseAmount * 0.05 + 100;
  const totalAmount = baseAmount + protectionFee;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Order Details</h1>
            <p className={styles.orderId}>ORDER #{order._id.toUpperCase()}</p>
          </div>
          <p className={styles.orderDate}>
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className={styles.body}>
          <div className={styles.itemSection}>
            <div className={styles.itemCard}>
              <img
                src={order.itemDetails?.image || 'https://via.placeholder.com/150'}
                alt={order.itemDetails?.title}
                className={styles.image}
              />
              <div className={styles.itemDetails}>
                <h2 className={styles.itemTitle}>{order.itemDetails?.title}</h2>
                <div className="space-y-1">
                  <p className={styles.priceLabel}>Winning Bid: <span className="font-medium text-base text-inherit">₹{baseAmount.toFixed(2)}</span></p>
                  <p className={styles.priceLabel}>Buyer Protection Fee: <span className="font-medium text-base text-inherit">₹{protectionFee.toFixed(2)}</span></p>
                  <hr className={`my-2 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`} />
                  <p className={`${styles.priceLabel} font-bold`}>Total Amount:</p>
                  <p className={styles.price}>₹{totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>
            {isBuyer && order.status === 'shipped' && (
              <div className={styles.confirmationCard}>
                <h3 className={styles.confirmationTitle}>Did you receive your product?</h3>
                <p className={styles.confirmationText}>
                  Please confirm once you have received your item to complete the order.
                </p>
                <Button onClick={handleConfirmDelivery} disabled={isConfirming} className={styles.confirmationButton}>
                  {isConfirming ? 'Confirming...' : 'Yes, I Received It'}
                </Button>
              </div>
            )}
          </div>

          <div className={styles.statusSection}>
            <h2 className={styles.statusTitle}>Order Status</h2>
            <div className={styles.timeline}>
              {statusSteps.map((step, index) => {
                const isActive = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const isDark = theme === 'dark';
                const activeColor = isDark ? 'bg-green-700 text-green-200' : 'bg-green-500 text-white';
                const inactiveColor = isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500';

                return (
                  <div key={step.status} className={styles.timelineItem}>
                    <div className={`${styles.timelineIconContainer} ${isActive ? activeColor : inactiveColor}`}>
                      <step.icon className={styles.timelineIcon} />
                    </div>
                    <div className={styles.timelineContent}>
                      <h3 className={`${styles.timelineTitle} ${isCurrent && (isDark ? 'text-purple-300' : 'text-purple-700')}`}>
                        {step.title}
                      </h3>
                      <p className={styles.timelineDescription}>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="p-6 text-center">
          <Link to={isBuyer ? "/orders" : "/listed-items"} className={styles.backLink}>
            <ArrowLeft size={16} /> Back to {isBuyer ? "My Orders" : "Sold Items"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;