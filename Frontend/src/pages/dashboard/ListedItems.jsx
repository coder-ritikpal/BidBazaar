import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import { Package, ArrowRight, Edit, RefreshCw, Trash2, Truck, DollarSign } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { getListedItemsStyles } from '@/styles/dashboard/listedItemsStyles';
import { useInventoryStore } from '@/store/inventoryStore';
import { useCartStore } from '@/store/cartStore';

const ListedItems = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const styles = getListedItemsStyles(theme);
  const {
    listedItems: items,
    loadingListedItems: loading,
    errorListedItems: error,
    fetchListedItems,
    deleteProduct,
    deletingProductId,
    soldItems,
    loadingSoldItems,
    fetchSoldItems,
  } = useInventoryStore();
  const { shipOrder } = useCartStore(); // For the "Simulate Ship" button

  const [activeTab, setActiveTab] = useState('listed');
  const [shippingOrderId, setShippingOrderId] = useState(null);

  const formatDateTime = (value) => {
    if (!value) return null;
    return new Date(value).toLocaleString();
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'live') return 'bg-green-500 text-white';
    if (status === 'ended') return 'bg-red-500 text-white';
    if (status === 'paid') return 'bg-orange-500 text-white';
    if (status === 'shipped') return 'bg-indigo-500 text-white';
    if (status === 'delivered') return 'bg-teal-500 text-white';
    if (status === 'upcoming') return 'bg-blue-500 text-white';
    if (status === 'under_review') return 'bg-yellow-500 text-white';
    return 'bg-gray-500 text-white'; // Default for unknown status
  };

  const getStatusLabel = (status) => {
    if (status === 'live') return 'Live';
    if (status === 'ended') return 'Ended';
    if (status === 'upcoming') return 'Upcoming';
    if (status === 'paid') return 'Paid';
    if (status === 'shipped') return 'Shipped';
    if (status === 'delivered') return 'Delivered';
    if (status === 'under_review') return 'Under Review';
    return 'Unknown'; // Default for unknown status
  };

  useEffect(() => {
    if (activeTab === 'listed') fetchListedItems();
    if (activeTab === 'sold') fetchSoldItems();
  }, [activeTab, fetchListedItems, fetchSoldItems]);

  const handleEdit = (productId) => {
    navigate(`/start-selling?edit=${productId}`);
  };

  const handleDelete = async (productId) => {
    const confirmed = window.confirm('Delete this product? This cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      await deleteProduct(productId);
      toast.success('Product deleted successfully.');
      navigate('/listed-items');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  const handleShipment = async (orderId) => {
    setShippingOrderId(orderId);
    try {
      await shipOrder(orderId);
      toast.success("Order has been shipped (simulated).");
      fetchSoldItems(); // Re-fetch to update status
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to ship order.");
    } finally {
      setShippingOrderId(null);
    }
  };

  if (loading || loadingSoldItems) {
    return (
      <div className={styles.loadingContainer}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className="max-w-7xl mx-auto">
        <div className={styles.header}>
          <h1 className={styles.title}>
            <Package className="text-purple-500" /> Listed Items
          </h1>
          <div className="flex items-center gap-4">
            <Link to="/start-selling">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                List More Products <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <button
              onClick={() => { activeTab === 'listed' ? fetchListedItems() : fetchSoldItems(); }}
              className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <span className={styles.itemCount}>
              {activeTab === 'listed' ? `${items.length} Listed` : `${soldItems.length} Sold`}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <div className="flex justify-center mb-8">
          <Button
            onClick={() => setActiveTab('listed')}
            className={`px-6 py-3 rounded-l-lg font-semibold transition-colors duration-200 border-r ${isDark ? 'border-gray-600' : 'border-gray-300'} ${
              activeTab === 'listed'
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
            }`}
          >
            <Package className="mr-2 h-4 w-4" /> Listed ({items.length})
          </Button>
          <Button
            onClick={() => setActiveTab('sold')}
            className={`px-6 py-3 rounded-r-lg font-semibold transition-colors duration-200 ${
              activeTab === 'sold'
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
            }`}
          >
            <DollarSign className="mr-2 h-4 w-4" /> Sold ({soldItems.length})
          </Button>
        </div>

        {activeTab === 'listed' && (
          items.length === 0 ? (
          <div className={styles.emptyStateContainer}>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 text-purple-500 mb-6">
              <Package size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">No items listed yet</h2>
            <p className={styles.emptyStateText}>
              You haven't listed any items for auction. Start selling today!
            </p>
            <Link to="/start-selling">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                Start Selling <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {items.map((item) => (
              <div key={item._id} className={styles.card}>
                <div className={styles.imageContainer}>
                  <span className={`${styles.statusBadge} ${getStatusBadgeClass(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </span>
                  <img src={item.image || item.images?.[0]?.url || item.images?.[0]?.thumbnailUrl || 'https://via.placeholder.com/400x300'} alt={item.title} className={styles.image} />
                </div>
                <div className={styles.content}>
                  <h3 className={styles.itemTitle}>{item.title}</h3>
                  {item.status === 'under_review' && (
                    <p className={styles.label}>Under review until {formatDateTime(item.reviewEndsAt)}</p>
                  )}
                  {item.status === 'upcoming' && (
                    <p className={styles.label}>Starts {formatDateTime(item.startAuctionAt)}</p>
                  )}
                  {item.status === 'live' && (
                    <p className={styles.label}>Auction is live</p>
                  )}
                  {item.status === 'ended' && (
                    <p className={styles.label}>Auction ended on {formatDateTime(item.endAuctionAt)}</p>
                  )}
                  <div className="flex justify-between items-end mt-4">
                    <div>
                      <p className={styles.label}>Current Bid</p>
                      <p className={styles.price}>Rs {item.currentBid || item.startingBid || item.price || 0}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className={styles.actionButton}
                        disabled={!item.canEdit}
                        title={item.canEdit ? 'Editable during review window' : 'Editing is locked after the review period ends'}
                        onClick={() => handleEdit(item._id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={styles.actionButton}
                        disabled={!item.canEdit || deletingProductId === item._id}
                        title={item.canEdit ? 'Delete during review window' : 'Deleting is locked after the review period ends'}
                        onClick={() => handleDelete(item._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {item.auctionId && (
                        <Link to={`/auction/${item.auctionId}`}>
                          <Button size="sm" variant="outline" className={styles.actionButton}>View</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
        {activeTab === 'sold' && (
          soldItems.length === 0 ? (
            <div className={styles.emptyStateContainer}>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 text-purple-500 mb-6">
                <DollarSign size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-2">No sold items yet</h2>
              <p className={styles.emptyStateText}>
                Once a buyer pays for a won auction, it will appear here.
              </p>
            </div>
          ) : (
            <div className={styles.grid}>
              {soldItems.map((order) => (
                <Link to={`/order/${order._id}`} key={order._id} className={styles.card}>
                  <div className={styles.imageContainer}>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <img src={order.itemDetails?.image || 'https://via.placeholder.com/400x300'} alt={order.itemDetails?.title} className={styles.image} />
                  </div>
                  <div className={styles.content}>
                    <h3 className={styles.itemTitle}>{order.itemDetails?.title}</h3>
                    <div className="flex justify-between items-end mt-4">
                      <div>
                        <p className={styles.label}>Sold For</p>
                        <p className={styles.price}>Rs {order.amount}</p>
                      </div>
                      <div className="flex gap-2">
                        {order.status === 'paid' && (
                          <Button size="sm" onClick={(e) => { e.preventDefault(); handleShipment(order._id); }} disabled={shippingOrderId === order._id}>
                            {shippingOrderId === order._id ? 'Shipping...' : <><Truck className="mr-2 h-4 w-4" /> Ship Item</>}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ListedItems;
