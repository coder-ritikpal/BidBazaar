import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import { Trash2, ShoppingBag, ArrowRight, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { getWishlistStyles } from '@/styles/dashboard/wishlistStyles';
import { useDashboardStore } from '@/store/dashboardStore';

const Wishlist = () => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const styles = getWishlistStyles(theme);
  const { wishlist, loadingWishlist: loading, errorWishlist: error, fetchWishlist, removeFromWishlist } = useDashboardStore();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (auctionId) => {
    try {
      await removeFromWishlist(auctionId);
      toast.success('Removed from wishlist');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingBag className="text-purple-500" /> My Wishlist
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchWishlist}
              className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <span className={styles.itemCount}>
              {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {wishlist.length === 0 ? (
          <div className={styles.emptyStateContainer}>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 text-purple-500 mb-6">
              <ShoppingBag size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
            <p className={styles.emptyStateText}>
              Looks like you haven't added any auctions to your wishlist yet.
            </p>
            <Link to="/auctions">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                Browse Auctions <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <div key={item._id} className={styles.itemCard}>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.image || item.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                    alt={item.title || item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <button
                    onClick={() => handleRemove(item._id)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-red-500 text-white transition-colors backdrop-blur-sm"
                    title="Remove from wishlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 truncate" title={item.title || item.name}>
                    {item.title || item.name || 'Untitled Auction'}
                  </h3>
                  <div className="flex justify-between items-end mt-4">
                    <div>
                      <p className={styles.label}>Current Bid</p>
                      <p className="text-purple-600 font-bold text-lg">
                        Rs {item.currentBid || item.startingBid || item.price || 0}
                      </p>
                    </div>
                    <Link to={`/auction/${item._id}`}>
                      <Button size="sm" variant="outline" className={styles.viewButton}>
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;

