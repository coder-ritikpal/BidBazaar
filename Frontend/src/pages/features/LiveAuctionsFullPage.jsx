import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import Footer from '@/pages/modules/Footer'; // Assuming Footer is in modules
import { getLiveAuctionsFullPageClasses } from '@/styles/features/liveAuctionsFullPageStyles'; // Updated style import
import { Heart } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { toast } from 'react-toastify';
import { useAuctionStore } from "@/store/auctionStore";
import { formatAuctionCountdown, getAuctionStatus as getClientAuctionStatus } from "@/lib/auctionStatus";
import CategoriesCarousel from '@/pages/containers/CategoriesCarousel';

const LiveAuctionsFullPage = () => { // Renamed component
  const { theme } = useThemeStore();
  const classes = getLiveAuctionsFullPageClasses(theme); // Updated style function call

  // Use Zustand auction state
  const auctions = useAuctionStore((state) => state.allAuctions);
  const loading = useAuctionStore((state) => state.loadingAllAuctions);
  const error = useAuctionStore((state) => state.errorAllAuctions);
  const fetchAllAuctions = useAuctionStore((state) => state.fetchAllAuctions);

  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [liveAuctions, setLiveAuctions] = useState([]); // Local state for filtered live auctions
  const [endedAuctions, setEndedAuctions] = useState([]); // Local state for filtered ended auctions
  const [upcomingAuctions, setUpcomingAuctions] = useState([]); // Local state for filtered upcoming auctions
  const [now, setNow] = useState(Date.now()); // Local state for current time
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();

  const { wishlist, fetchWishlist, addToWishlist, removeFromWishlist } = useDashboardStore();
  const wishlistIds = useMemo(() => new Set(wishlist.map((item) => item._id)), [wishlist]);
  useEffect(() => {
    fetchAllAuctions(); // Trigger fetching all auctions from the store
  }, [fetchAllAuctions]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const filteredAuctions = useMemo(() => {
    if (selectedCategory === 'All') {
      return auctions;
    }
    return auctions.filter(auction => auction.category === selectedCategory);
  }, [auctions, selectedCategory]);

  const searchedAndFilteredAuctions = useMemo(() => {
    if (!searchQuery) return filteredAuctions;
    const lowercasedQuery = searchQuery.toLowerCase();
    return filteredAuctions.filter(auction =>
      auction.title.toLowerCase().includes(lowercasedQuery) ||
      (auction.category && auction.category.toLowerCase().includes(lowercasedQuery))
    );
  }, [filteredAuctions, searchQuery]);

  useEffect(() => {
    // Re-calculate statuses and filter auctions whenever auctions or the time changes.
    const live = [];
    const upcoming = [];
    const ended = [];

    // Use the searched and filtered auctions
    searchedAndFilteredAuctions.forEach(auction => {
      // Use the client-side status calculation which is aware of the current time
      const status = getClientAuctionStatus(auction, now);
      const auctionWithStatus = { ...auction, status };

      if (status === 'live') {
        live.push(auctionWithStatus);
      } else if (status === 'upcoming') {
        upcoming.push(auctionWithStatus);
      } else if (status === 'ended') {
        ended.push(auctionWithStatus);
      }
      // 'expired' auctions are filtered out
    });

    setLiveAuctions(live.sort((a, b) => new Date(a.endAuctionAt).getTime() - new Date(b.endAuctionAt).getTime()));
    setUpcomingAuctions(upcoming.sort((a, b) => new Date(a.startAuctionAt).getTime() - new Date(b.startAuctionAt).getTime()));
    setEndedAuctions(ended.sort((a, b) => new Date(b.endAuctionAt).getTime() - new Date(a.endAuctionAt).getTime()));
  }, [searchedAndFilteredAuctions, now]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchWishlist();
    }
  }, [isLoggedIn, fetchWishlist]);

  const getAuctionTimeLabel = (auction) => {
    if (auction.status === 'upcoming') {
      return `Starts in ${formatAuctionCountdown(auction.startAuctionAt, now, 'Starting soon')}`;
    }
    if (auction.status === 'live') {
      return `${formatAuctionCountdown(auction.endAuctionAt, now)} remaining`;
    }
    return `Ended on ${new Date(auction.endAuctionAt).toLocaleString()}`;
  };

  const getStatusLabel = (status) => {
    if (status === 'live') return 'Live';
    if (status === 'upcoming') return 'Upcoming';
    return 'Ended';
  };

  const getStatusBadgeClasses = (status) =>
    `${classes.statusBadge} ${
      status === 'live'
        ? 'bg-green-500 text-white'
        : status === 'upcoming'
        ? 'bg-amber-500 text-white'
        : 'bg-red-500 text-white'
    }`;

  const handleWishlist = async (e, auctionId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      toast.info("Please login to add to wishlist");
      navigate('/login');
      return;
    }

    const isWishlisted = wishlistIds.has(auctionId);

    try {
      if (isWishlisted) {
        await removeFromWishlist(auctionId);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(auctionId);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error(`Error ${isWishlisted ? 'removing from' : 'adding to'} wishlist:`, error);
      if (error.response && error.response.status === 400 && !isWishlisted) {
        toast.info('Item already in wishlist');
      } else {
        toast.error(`Failed to ${isWishlisted ? 'remove from' : 'add to'} wishlist`);
      }
    }
  };

  const auctionsToDisplay = [...liveAuctions, ...upcomingAuctions, ...endedAuctions];

  return (
    <div className={classes.pageWrapper}>
      <main className={classes.mainContentArea}>
        <div className={classes.heroSection}>
          <div className={classes.heroContent}>
            <h1 className={classes.heroTitle}>
              {searchQuery ? (
                `Results for "${searchQuery}"`
              ) : selectedCategory === 'All' ? (
                'Discover Exciting Auctions'
              ) : selectedCategory === 'Art' ? (
                'Auctions in Art' // This title already uses a purple gradient from classes.heroTitle
              ) : (
                `Auctions in ${selectedCategory}`
              )}
            </h1>
            <p className={classes.heroSubtitle}>Bid on unique items from around the globe in real-time.</p>
          </div>
        </div>

        <section className="py-8">
          <h2 className={`text-2xl font-bold mb-8 text-center ${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}`}>
            Browse by Category
          </h2>
          <CategoriesCarousel
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        </section>

        <section className={classes.auctionsSection}> {/* Keep the section wrapper */}

          {loading && <p className={classes.loadingState}>Loading exciting auctions for you...</p>}
          {error && <p className={classes.errorState}>Oops! Failed to load auctions. Please try again later.</p>}

          {!loading && !error && auctionsToDisplay.length > 0 && (
            <div className={classes.auctionGrid}>
              {auctionsToDisplay.map((auction) => {
                const auctionId = auction._id;
                const isWishlisted = wishlistIds.has(auctionId);
                return (
                <Link to={`/auction/${auctionId}`} key={auctionId} className={classes.auctionCard}>
                  <div className={classes.cardImageWrapper}>
                    <img src={auction.images?.[0]?.url} alt={auction.title} className={classes.cardImage} />
                    <span className={getStatusBadgeClasses(auction.status)}>
                      {getStatusLabel(auction.status)}
                    </span>
                    <button
                      onClick={(e) => handleWishlist(e, auctionId)}
                      className={`${classes.wishlistButton} ${
                        isWishlisted ? 'text-red-500' : 'text-gray-600 group-hover:text-red-500'
                      }`}
                      title={isWishlisted ? "In Wishlist" : "Add to Wishlist"}
                    >
                      <Heart size={20} className={isWishlisted ? "fill-red-500" : ""} />
                    </button>
                  </div>
                  <div className={classes.cardContent}>
                    <h3 className={classes.cardTitle}>{auction.title}</h3>
                    <div className={classes.bidInfo}>
                      <p className={classes.currentBidLabel}>Current Bid:</p>
                      <p className={classes.currentBidValue}>Rs.{auction.currentPrice}</p>
                    </div>
                    <p className={classes.auctionTimeRemaining}>{getAuctionTimeLabel(auction)}</p>
                    <button className={classes.viewDetailsButton}>View Details</button>
                  </div>
                </Link>
              )})}
            </div>
          )}
          {!loading && !error && auctionsToDisplay.length === 0 && (
            <p className={classes.emptyState}>
              {searchQuery
                ? `No auctions found for "${searchQuery}" in the "${selectedCategory}" category.`
                : `No auctions found for the "${selectedCategory}" category. Check back soon!`}
            </p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};
export default LiveAuctionsFullPage;
