import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import { getLiveAuctionsSectionStyles } from '@/styles/features/liveAuctionsSectionStyles'; // Corrected import
import { ArrowRight, Heart } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-toastify';
import { useAuctionStore } from "@/store/auctionStore";
import { formatAuctionCountdown, getAuctionStatus as getClientAuctionStatus } from "@/lib/auctionStatus";
import { useDashboardStore } from '@/store/dashboardStore';

const LiveAuctionsSection = ({ selectedCategory }) => {
  const { theme } = useThemeStore();
  const classes = getLiveAuctionsSectionStyles(theme);

  // Zustand auction state
  const auctions = useAuctionStore((state) => state.allAuctions);
  const loading = useAuctionStore((state) => state.loadingAllAuctions);
  const error = useAuctionStore((state) => state.errorAllAuctions);
  const fetchAllAuctions = useAuctionStore((state) => state.fetchAllAuctions);

  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [now, setNow] = useState(Date.now());
  const [displayAuctions, setDisplayAuctions] = useState([]);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();

  const { wishlist, fetchWishlist, addToWishlist } = useDashboardStore();
  const wishlistIds = useMemo(() => new Set((wishlist || []).map((item) => item._id)), [wishlist]);

  useEffect(() => {
    fetchAllAuctions();
  }, [fetchAllAuctions]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const processedAuctions = auctions.map(auction => {
      const status = getClientAuctionStatus(auction, now);
      return { ...auction, status };
    }).filter(auction => auction.status === 'live' || auction.status === 'ended' || auction.status === 'upcoming');

    const live = processedAuctions.filter(a => a.status === 'live').sort((a, b) => new Date(a.endAuctionAt).getTime() - new Date(b.endAuctionAt).getTime());
    const upcoming = processedAuctions.filter(a => a.status === 'upcoming').sort((a, b) => new Date(a.startAuctionAt).getTime() - new Date(b.startAuctionAt).getTime());
    const ended = processedAuctions.filter(a => a.status === 'ended').sort((a, b) => new Date(b.endAuctionAt).getTime() - new Date(a.endAuctionAt).getTime());

    // Display order: Live, then Upcoming, then Ended
    setDisplayAuctions([...live, ...upcoming, ...ended]);
  }, [auctions, now]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchWishlist();
    }
  }, [isLoggedIn, fetchWishlist]);

  const filteredAuctions = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All') {
      return displayAuctions;
    }
    return displayAuctions.filter(auction => auction.category === selectedCategory);
  }, [displayAuctions, selectedCategory]);

  const searchedAndFilteredAuctions = useMemo(() => {
    if (!searchQuery) return filteredAuctions;
    const lowercasedQuery = searchQuery.toLowerCase();
    return filteredAuctions.filter(auction =>
      auction.title.toLowerCase().includes(lowercasedQuery) ||
      (auction.category && auction.category.toLowerCase().includes(lowercasedQuery))
    );
  }, [filteredAuctions, searchQuery]);

  const getAuctionTimeLabel = (auction) => {
    if (auction.status === 'upcoming') {
      return `Starts in ${formatAuctionCountdown(auction.startAuctionAt, now, 'Starting soon')}`;
    }

    if (auction.status === 'live') {
      return `${formatAuctionCountdown(auction.endAuctionAt, now)} remaining`;
    }

    return `Ended on ${new Date(auction.endAuctionAt).toLocaleString()}`;
  };

  const getStatusBadgeClasses = (status) =>
    `${classes.statusBadge} ${
      status === 'live'
        ? 'bg-green-500 text-white'
        : status === 'upcoming'
          ? 'bg-amber-500 text-white'
          : 'bg-red-500 text-white'
    }`;

  const getStatusLabel = (status) => {
    if (status === 'live') return 'Live';
    if (status === 'upcoming') return 'Upcoming';
    return 'Ended';
  };

  const handleWishlist = async (e, auctionId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      toast.info("Please login to add to wishlist");
      navigate('/login');
      return;
    }

    try {
      await addToWishlist(auctionId);
      toast.success("Added to wishlist");
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      if (error.response && error.response.status === 400) {
        toast.info("Item already in wishlist");
      } else {
        toast.error("Failed to add to wishlist");
      }
    }
  };

  return (
    <div className={classes.sectionContainer}>
      <h2 className={classes.sectionTitle}>
        {searchQuery ? (
          `Results for "${searchQuery}"`
        ) : selectedCategory === 'All' ? (
          'Featured Auctions'
        ) : selectedCategory === 'Art' ? (
          <span className={`${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}`}>Auctions in Art</span>
        ) : (
          `Auctions in ${selectedCategory}`
        )}
      </h2>
      {loading && <p className={classes.loadingMessage}>Loading auctions...</p>}
      {error && <p className={classes.errorMessage}>{error}</p>}
      {!loading && !error && searchedAndFilteredAuctions.length === 0 && (
        <div className={classes.emptyState}> {/* Updated empty state message */}
          <p>
            {searchQuery ? `No results for "${searchQuery}"` : `No auctions found for the "${selectedCategory}" category.`}
          </p>
        </div>
      )}

      {!loading && !error && searchedAndFilteredAuctions.length > 0 && (
        <div className={`${classes.auctionGrid} max-[350px]:grid-cols-1`}>
          {searchedAndFilteredAuctions.map((auction) => {
            const auctionId = auction.id || auction._id;
            const isWishlisted = wishlistIds.has(auctionId);
            return (
              <Link to={`/auction/${auctionId}`} key={auctionId} className={`${classes.auctionCard} relative group`}>
                <span className={getStatusBadgeClasses(auction.status)}>
                  {getStatusLabel(auction.status)}
                </span>
                <button
                  onClick={(e) => handleWishlist(e, auctionId)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors z-10"
                  title={isWishlisted ? "In Wishlist" : "Add to Wishlist"}
                >
                  <Heart size={20} className={isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600 hover:text-red-500"} />
                </button>
                <img src={auction.images?.[0]?.url || auction.image} alt={auction.title} className={classes.auctionImage} />
                <h3 className={classes.auctionTitle}>{auction.title}</h3>
                <p className={classes.auctionPrice}>Current Bid: Rs.{auction.currentPrice}</p>
                <p className={classes.auctionTime}>{getAuctionTimeLabel(auction)}</p>
              </Link>
            )})}
        </div>
      )}

      <div className="text-center mt-8">
        <Link to="/auctions" className={classes.seeMoreButton}>
          See All Auctions <ArrowRight className="ml-2 w-5 h-5" />
        </Link>
      </div>
    </div>
  );
};

export default LiveAuctionsSection;
