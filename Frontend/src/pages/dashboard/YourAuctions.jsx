import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import { Gavel, ArrowRight, RefreshCw, Trophy, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getEnrolledAuctionsStyles } from '@/styles/dashboard/enrolledAuctionsStyles';
import { useDashboardStore } from '@/store/dashboardStore';
import { useCartStore } from '@/store/cartStore';
import { getAuctionStatus as getClientAuctionStatus } from '@/lib/auctionStatus';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-toastify';

const YourAuctions = () => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const styles = getEnrolledAuctionsStyles(theme);
  const {
    enrolledAuctions: auctions,
    loadingEnrolledAuctions: loading,
    errorEnrolledAuctions: error,
    fetchEnrolledAuctions,
    wonAuctions,
    loadingWonAuctions,
    fetchWonAuctions,
  } = useDashboardStore();
  const {
    myOrders, // This contains items in cart and paid orders
    fetchMyOrders,
    createOrder,
  } = useCartStore();
  const { user } = useAuthStore();
  const [ongoingAuctions, setOngoingAuctions] = useState([]);
  const [completedAuctions, setCompletedAuctions] = useState([]);
  const [activeTab, setActiveTab] = useState('ongoing'); // New state for active tab
  const [now, setNow] = useState(Date.now());
  const [isAddingToCart, setIsAddingToCart] = useState(null); // Tracks which auction is being added

  useEffect(() => {
    fetchEnrolledAuctions();
    fetchWonAuctions();
    fetchMyOrders();
  }, [fetchEnrolledAuctions, fetchWonAuctions, fetchMyOrders]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const wonAuctionIds = new Set(wonAuctions.map(a => a._id));
    const ongoing = auctions.filter(a => ['live', 'upcoming'].includes(getClientAuctionStatus(a, now)));
    const completed = auctions.filter(a =>
      ['ended', 'cancelled', 'expired'].includes(getClientAuctionStatus(a, now))
    );
    setOngoingAuctions(ongoing.sort((a, b) => new Date(a.endAuctionAt).getTime() - new Date(b.endAuctionAt).getTime()));
    setCompletedAuctions(completed.sort((a, b) => new Date(b.endAuctionAt).getTime() - new Date(a.endAuctionAt).getTime()));
  }, [auctions, wonAuctions, now]);

  const handleAddToCart = async (auctionId) => {
    setIsAddingToCart(auctionId);
    try {
      await createOrder(auctionId);
      toast.success("Item added to cart!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add to cart. Please try again.");
    } finally {
      setIsAddingToCart(null);
    }
  };

  if (loading || loadingWonAuctions) {
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
            <Gavel className="text-purple-500" /> Your Auctions
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { fetchEnrolledAuctions(); fetchWonAuctions(); fetchMyOrders(); }}
              className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <span className="text-sm text-gray-500">
              {auctions.length} {auctions.length === 1 ? 'Auction' : 'Auctions'} Joined
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {auctions.length === 0 ? (
          <div className={styles.emptyStateContainer}>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 text-purple-500 mb-6">
              <Gavel size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">No active bids</h2>
            <p className={styles.emptyStateText}>
              You haven't placed any bids on auctions yet.
            </p>
            <Link to="/auctions">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                Start Bidding <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex justify-center mb-8">
              <Button
                onClick={() => setActiveTab('ongoing')}
                className={`px-6 py-3 rounded-l-lg font-semibold transition-colors duration-200 border-r ${isDark ? 'border-gray-600' : 'border-gray-300'} ${
                  activeTab === 'ongoing'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                }`}
              >
                Ongoing ({ongoingAuctions.length})
              </Button>
              <Button
                onClick={() => setActiveTab('won')}
                className={`px-6 py-3 font-semibold transition-colors duration-200 flex items-center ${
                  activeTab === 'won'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                }`}
              >
                <Trophy className="mr-2 h-4 w-4" /> Won ({wonAuctions.length})
              </Button>
              <Button
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-3 rounded-r-lg font-semibold transition-colors duration-200 border-l ${isDark ? 'border-gray-600' : 'border-gray-300'} ${
                  activeTab === 'completed'
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                }`}
              >
                Completed ({completedAuctions.length})
              </Button>
            </div>

            {activeTab === 'ongoing' && (
              <section>
                <h2 className="sr-only">Ongoing Auctions</h2> {/* Screen reader only heading */}
                {ongoingAuctions.length > 0 ? (
                  <div className={styles.grid}>
                    {ongoingAuctions.map((auction) => (
                      <div key={auction._id} className={styles.card}>
                        <div className={styles.imageContainer}>
                          <img src={auction.images?.[0]?.url || auction.image || 'https://via.placeholder.com/400x300'} alt={auction.title} className={styles.image} />
                        </div>
                        <div className={styles.content}>
                          <h3 className={styles.itemTitle}>{auction.title}</h3>
                          <div className="mt-2 mb-4">
                            <p className={styles.label}>Current Bid</p>
                            <p className={styles.price}>₹{auction.currentPrice}</p>
                          </div>
                          <Link to={`/auction/${auction._id}`}>
                            <Button size="sm" variant="outline" className={styles.viewButton}>View Auction</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyStateText}>You have no bids on any ongoing or upcoming auctions.</p>
                )}
              </section>
            )}

            {activeTab === 'won' && (
              <section>
                <h2 className="sr-only">Won Auctions</h2>
                {wonAuctions.length > 0 ? (
                  <div className={styles.grid}>
                    {wonAuctions.map((auction) => {
                      const orderForAuction = myOrders.find(order => order.auctionId === auction._id);
                      const isInCart = orderForAuction && orderForAuction.status === 'pending_payment';
                      const isPaid = orderForAuction && orderForAuction.status !== 'pending_payment';

                      return (
                        <div key={auction._id} className={styles.card}>
                          <div className={styles.imageContainer}>
                            <img src={auction.images?.[0]?.url || auction.image || 'https://via.placeholder.com/400x300'} alt={auction.title} className={styles.image} />
                          </div>
                          <div className={`${styles.content} flex flex-col`}>
                            <h3 className={styles.itemTitle}>{auction.title}</h3>
                            <div className="mt-2 mb-4">
                              <p className={styles.label}>Winning Bid</p>
                              <p className={styles.price}>₹{auction.currentPrice}</p>
                            </div>
                            <div className="mt-auto pt-4">
                              {isPaid ? (
                                <Button disabled className="w-full bg-green-700 text-white cursor-not-allowed">
                                  Order Placed
                                </Button>
                              ) : isInCart ? (
                                <Link to="/orders" className="w-full">
                                  <Button variant="outline" className="w-full bg-transparent text-foreground hover:text-accent-foreground">
                                    View in Cart
                                  </Button>
                                </Link>
                              ) : (
                                <>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-3">Add this item to your cart to proceed with payment.</p>
                                  <Button onClick={() => handleAddToCart(auction._id)} disabled={isAddingToCart === auction._id} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                                    {isAddingToCart === auction._id ? 'Adding...' : <><ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart</>}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className={styles.emptyStateText}>You haven't won any auctions yet.</p>
                )}
              </section>
            )}

            {activeTab === 'completed' && (
              <section>
                <h2 className="sr-only">Completed Auctions</h2> {/* Screen reader only heading */}
                {completedAuctions.length > 0 ? (
                  <div className={styles.grid}>
                    {completedAuctions.map((auction) => (
                      <div key={auction._id} className={styles.card}>
                        <div className={styles.imageContainer}>
                          <img src={auction.images?.[0]?.url || auction.image || 'https://via.placeholder.com/400x300'} alt={auction.title} className={styles.image} />
                        </div>
                        <div className={styles.content}>
                          <h3 className={styles.itemTitle}>{auction.title}</h3>
                          <div className="mt-2 mb-4">
                            <p className={styles.label}>Final Bid</p> {/* Changed label for completed */}
                            <p className={styles.price}>₹{auction.currentPrice}</p>
                          </div>
                          <Link to={`/auction/${auction._id}`}>
                            <Button size="sm" variant="outline" className={styles.viewButton}>View Auction</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyStateText}>You have no completed auctions.</p>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// export default YourAuctions;
//                   </div>
//                   <Link to={`/auction/${auction._id}`}>
//                     <Button size="sm" variant="outline" className={styles.viewButton}>View Auction</Button>
//                   </Link>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

export default YourAuctions;