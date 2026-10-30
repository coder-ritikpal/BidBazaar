import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { getAuctionDetailsPageClasses } from '@/styles/features/auctionDetailsPageStyles';
import { getCountdownParts, formatDateTime } from '@/lib/auctionStatus';
import Footer from '@/pages/modules/Footer';
import { toast } from 'react-toastify';
import { Gavel, User, Info, History, CheckCircle } from 'lucide-react';
import { getAuctionDetails, getAuctionBids, bidOnAuction, getUserPublicProfile } from '@/data/api';

const SOCKET_URL =
  import.meta.env.VITE_API_URL_FEATURES ||
  (import.meta.env.PROD ? 'https://bidbazaar-auctions.onrender.com' : 'http://localhost:3002');

const CountdownDisplay = ({ parts, label, classes }) => (
  <div className={classes.countdownContainer}>
    <p className={classes.countdownEndsLabel}>{label}</p>
    <div className={classes.countdownSegmentsWrapper}>
      <div className={classes.countdownSegment}>
        <span className={classes.countdownValue}>{String(parts.days).padStart(2, '0')}</span>
        <span className={classes.countdownLabel}>Days</span>
      </div>
      <div className={classes.countdownSegment}>
        <span className={classes.countdownValue}>{String(parts.hours).padStart(2, '0')}</span>
        <span className={classes.countdownLabel}>Hours</span>
      </div>
      <div className={classes.countdownSegment}>
        <span className={classes.countdownValue}>{String(parts.minutes).padStart(2, '0')}</span>
        <span className={classes.countdownLabel}>Mins</span>
      </div>
      <div className={classes.countdownSegment}>
        <span className={classes.countdownValue}>{String(parts.seconds).padStart(2, '0')}</span>
        <span className={classes.countdownLabel}>Secs</span>
      </div>
    </div>
  </div>
);

const AuctionDetailsPage = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const classes = getAuctionDetailsPageClasses(theme);
  const { isLoggedIn, user } = useAuthStore();

  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
  const [bidAmount, setBidAmount] = useState('');
  const [bids, setBids] = useState([]);
  const [bidPagination, setBidPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [bidPage, setBidPage] = useState(1);
  const [loadingBids, setLoadingBids] = useState(true);
  const [showAllBids, setShowAllBids] = useState(false); // New state to control bid history display
  const [isBidding, setIsBidding] = useState(false);
  const [mainImage, setMainImage] = useState('');
  const [sellerDisplayName, setSellerDisplayName] = useState(null);
  const [winnerDisplayName, setWinnerDisplayName] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false); // New state for socket real-time flash
  const fetchAuction = useCallback(async () => {
    try {
      const response = await getAuctionDetails(auctionId);
      const fetchedAuction = response.data.auction;
      setAuction(fetchedAuction);
      if (fetchedAuction.images && fetchedAuction.images.length > 0) {
        setMainImage(fetchedAuction.images[0].url);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load auction details. It might have ended or does not exist.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  const fetchBids = useCallback(async () => {
    if (!auctionId) return;
    setLoadingBids(true);
    try {
      const response = await getAuctionBids(auctionId, bidPage);
      setBids(response.data.bids || []);
      setBidPagination(response.data.pagination || { page: bidPage, limit: 50, total: 0, totalPages: 0 });
    } catch (err) {
      // Don't show a toast for this, as it's not critical for page load.
      console.error('Failed to load bid history.', err);
    } finally {
      setLoadingBids(false);
    }
  }, [auctionId, bidPage]);

  useEffect(() => {
    setBidPage(1);
    setShowAllBids(false);
  }, [auctionId]);

  useEffect(() => {
    setLoading(true);
    fetchAuction();
    fetchBids();
  }, [fetchAuction, fetchBids]);

  useEffect(() => {
    if (!auctionId || !SOCKET_URL) return;

    const sanitizedAuctionId = String(auctionId).trim();

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      socket.emit('join_auction', sanitizedAuctionId);
    });

    socket.on('new_bid', (data) => {
      if (data && String(data.auctionId) === sanitizedAuctionId) {
        // Update auction price and trigger visual flash
        setAuction((prevAuction) => {
          if (!prevAuction) return prevAuction;
          setIsFlashing(true);
          setTimeout(() => setIsFlashing(false), 1000);
          const currentTotalBids = typeof prevAuction.totalBids === 'number'
            ? prevAuction.totalBids
            : (Array.isArray(prevAuction.bids) ? prevAuction.bids.length : 0);
          return {
            ...prevAuction,
            currentPrice: Number(data.currentPrice) || prevAuction.currentPrice,
            totalBids: typeof data.totalBids === 'number' ? data.totalBids : currentTotalBids + 1,
          };
        });

        // Add new bid to the top of the history without duplicates
        const formattedBid = {
          ...data.bid,
          isSelf: false,
          bidderLabel: data.bid?.bidderLabel || 'Bidder',
        };

        setBids((prevBids) => {
          if (data.bid?._id && prevBids.some((b) => String(b._id) === String(data.bid._id))) {
            return prevBids;
          }
          return [formattedBid, ...prevBids];
        });

        // The history endpoint applies the viewer-specific "You" label without
        // sending bidder IDs over the public socket event.
        getAuctionBids(sanitizedAuctionId)
          .then((response) => {
            const refreshedBids = response.data.bids || [];
            setBidPage(1);
            setBids(refreshedBids);
            setBidPagination(response.data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
            const latestBid = refreshedBids.find((bid) => String(bid._id) === String(data.bid?._id));
            if (latestBid && !latestBid.isSelf) {
              toast.info(`New bid of Rs.${latestBid.amount} placed by ${latestBid.bidderLabel}!`);
            }
          })
          .catch((err) => console.error('Failed to refresh bid history after a new bid.', err));
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return () => {
      socket.emit('leave_auction', sanitizedAuctionId);
      socket.disconnect();
    };
  }, [auctionId]);

  useEffect(() => {
    if (!auction || (auction.status !== 'live' && auction.status !== 'upcoming')) return;

    const updateCountdown = () => {
      const targetDate = auction.status === 'live' ? auction.endAuctionAt : auction.startAuctionAt;
      const parts = getCountdownParts(targetDate);
      setCountdown(parts);
      if (parts.isOver) {
        fetchAuction();
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [auction, fetchAuction, fetchBids]);

  useEffect(() => {
    let isMounted = true;

    const resolveSellerName = async () => {
      if (!auction) {
        if (isMounted) setSellerDisplayName(null);
        return;
      }

      if (auction.sellerId?.fullName) {
        const name = `${auction.sellerId.fullName.firstName || ''} ${auction.sellerId.fullName.lastName || ''}`.trim();
        if (isMounted) setSellerDisplayName(name || null);
        return;
      }

      const sellerId = auction.sellerId && typeof auction.sellerId === 'object' ? auction.sellerId._id : auction.sellerId;
      if (!sellerId) {
        if (isMounted) setSellerDisplayName(null);
        return;
      }

      try {
        const response = await getUserPublicProfile(sellerId);
        const fullName = response.data?.user?.fullName;
        const name = fullName ? `${fullName.firstName || ''} ${fullName.lastName || ''}`.trim() : null;
        if (isMounted) setSellerDisplayName(name || null);
      } catch (err) {
        console.error('Failed to resolve seller name', err);
        if (isMounted) setSellerDisplayName(null);
      }
    };

    resolveSellerName();

    return () => {
      isMounted = false;
    };
  }, [auction]);

  useEffect(() => {
    let isMounted = true;

    const resolveWinnerName = async () => {
      if (!auction || auction.status !== 'ended') {
        if (isMounted) setWinnerDisplayName(null);
        return;
      }

      if (auction.winnerId?.fullName) {
        const name = `${auction.winnerId.fullName.firstName || ''} ${auction.winnerId.fullName.lastName || ''}`.trim();
        if (isMounted) setWinnerDisplayName(name || null);
        return;
      }

      const winnerId = auction.winnerId && typeof auction.winnerId === 'object'
        ? (auction.winnerId._id || auction.winnerId.id)
        : auction.winnerId;

      if (!winnerId) {
        if (isMounted) setWinnerDisplayName(null);
        return;
      }

      try {
        const response = await getUserPublicProfile(winnerId);
        const fullName = response.data?.user?.fullName;
        const name = fullName ? `${fullName.firstName || ''} ${fullName.lastName || ''}`.trim() : null;
        if (isMounted) setWinnerDisplayName(name || null);
      } catch (err) {
        console.error('Failed to resolve winner name', err);
        if (isMounted) setWinnerDisplayName(null);
      }
    };

    resolveWinnerName();

    return () => {
      isMounted = false;
    };
  }, [auction]);

  const currentUserId = String(user?._id || user?.id || '');
  const isHighestBidder = Boolean(
    isLoggedIn && currentUserId && bids.length > 0 && bids[0].isSelf
  );

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.info('Please log in to place a bid.');
      navigate('/login');
      return;
    }

    if (isHighestBidder) {
      toast.info('You are already the highest bidder. You must wait until another user outbids you.');
      return;
    }

    const bidValue = parseFloat(bidAmount);
    if (isNaN(bidValue) || bidValue <= auction.currentPrice) {
      toast.error(`Your bid must be higher than the current price of Rs.${auction.currentPrice}.`);
      return;
    }

    if (bidValue % 10 !== 0) {
      toast.error("Bid amount must be in multiples of 10.");
      return;
    }

    setIsBidding(true);
    try {
      await bidOnAuction(auctionId, bidValue);
      toast.success('Bid placed successfully!');
      setBidAmount('');
      // Instantly refresh auction details and bid history so this tab updates without delay
      fetchAuction();
      fetchBids();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place bid. Please try again.');
    } finally {
      setIsBidding(false);
    }
  };

  if (loading) {
    return <div className={classes.loadingState}>Loading Auction...</div>;
  }

  if (error) {
    return <div className={classes.errorState}>{error}</div>;
  }

  if (!auction) {
    return <div className={classes.errorState}>Auction not found.</div>;
  }

  const sellerIdString =
    (auction.sellerId && typeof auction.sellerId === 'object' ? auction.sellerId._id : auction.sellerId) || null;
  const isOwner = Boolean(isLoggedIn && currentUserId && sellerIdString && String(sellerIdString) === currentUserId);
  const winnerIdString =
    (auction.winnerId && typeof auction.winnerId === 'object' ? auction.winnerId._id : auction.winnerId) || null;
  const isWinner = Boolean(isLoggedIn && currentUserId && auction.status === 'ended' && winnerIdString && String(winnerIdString) === currentUserId);

  const sellerName = sellerDisplayName
    ? sellerDisplayName
    : auction.sellerId?.fullName
      ? `${auction.sellerId.fullName.firstName || ''} ${auction.sellerId.fullName.lastName || ''}`.trim()
      : sellerIdString
        ? `User ${String(sellerIdString).slice(-6)}`
        : 'Unknown seller';

  const winnerName = winnerDisplayName
    ? winnerDisplayName
    :
    auction.winnerId?.fullName
      ? `${auction.winnerId.fullName.firstName || ''} ${auction.winnerId.fullName.lastName || ''}`.trim()
      : winnerIdString ? `User ${String(winnerIdString).slice(-6)}` : null;

  const minNextBid = Math.ceil((auction.currentPrice + 1) / 10) * 10;

  return (
    <div className={classes.pageWrapper}>
      <main className={classes.mainContent}>
        <div className={classes.gridContainer}>
          {/* Image Section */}
          <div className={classes.imageSection}>
            <div className={classes.mainImageWrapper}>
              <img src={mainImage} alt={auction.title} className={classes.mainImage} />
            </div>
            <div className={classes.thumbnailContainer}>
              {auction.images.map((image, index) => (
                <button
                  key={image.id || index}
                  onClick={() => setMainImage(image.url)}
                  className={`${classes.thumbnailButton} ${mainImage === image.url ? classes.thumbnailActive : ''}`}
                >
                  <img src={image.thumbnailUrl || image.url} alt={`Thumbnail ${index + 1}`} className={classes.thumbnailImage} />
                </button>
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className={classes.detailsSection}>
            <span className={classes.categoryLabel}>{auction.category}</span>
            <h1 className={classes.title}>{auction.title}</h1>

            <div className={classes.statusTimeWrapper}>
              <span
                className={`${classes.statusBadge} ${classes[`status${auction.status}`]}`}
                style={auction.status === 'ended' ? { backgroundColor: '#ef4444', color: 'white' } : {}}
              >
                {auction.status}
              </span>
            </div>

            {(auction.status === 'live' || auction.status === 'upcoming') && !countdown.isOver && (
              <CountdownDisplay
                parts={countdown}
                label={auction.status === 'live' ? 'Auction Ends In' : 'Auction Starts In'}
                classes={classes}
              />
            )}

            <div className={classes.priceSection}>
              <div className="flex-1">
                <p className={classes.priceLabel}>{auction.status === 'live' ? 'Current Bid' : auction.status === 'ended' ? 'Winning Bid' : 'Starting Price'}</p>
                <p className={`${classes.priceValue} ${isFlashing ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] scale-110 transition-all duration-300' : 'transition-all duration-500'}`}>
                  Rs.{auction.currentPrice}
                </p>
              </div>
              <div className="text-right">
                <p className={classes.priceLabel}>Bids</p>
                <p className={classes.priceValue}>{auction.totalBids ?? auction.bids?.length ?? 0}</p>
              </div>
            </div>

            {auction.status === 'live' && !isOwner && (
              <>
                {isHighestBidder && (
                  <div className="mb-3 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <CheckCircle size={18} className="mr-2 shrink-0 text-emerald-400" />
                    You are currently the highest bidder!
                  </div>
                )}
                <form onSubmit={handleBidSubmit} className={classes.bidForm}>
                  <div className={classes.bidInputWrapper}>
                    <span className={classes.bidInputCurrency}>Rs.</span>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={isHighestBidder ? "You hold the highest bid" : `e.g., ${minNextBid}`}
                      className={classes.bidInput}
                      disabled={isBidding || isHighestBidder}
                    />
                  </div>
                  <button
                    type="submit"
                    className={`${classes.bidButton} ${isHighestBidder ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={isBidding || isHighestBidder}
                    title={isHighestBidder ? "You are already the highest bidder" : "Place Bid"}
                  >
                    <Gavel size={20} className="mr-2" />
                    {isBidding ? 'Placing Bid...' : isHighestBidder ? 'Highest Bidder' : 'Place Bid'}
                  </button>
                </form>
              </>
            )}

            {auction.status === 'live' && isOwner && (
              <div className={classes.ownerMessage}>
                <Info size={18} className="mr-2" />
                You cannot bid on your own auction.
              </div>
            )}

            {auction.status === 'upcoming' && (
              <div className={classes.upcomingMessage}>
                Bidding will start soon. Add to your wishlist to get notified!
              </div>
            )}

            {auction.status === 'ended' && (
              isWinner ? (
                <div className={classes.winnerMessage}>
                  <h2 className={classes.winnerTitle}>🎉 You Won! 🎉</h2>
                  <p className={classes.winnerText}>
                    Congratulations! This item is now yours. An order has been created for you.
                  </p>
                  <Link to="/orders" className={classes.winnerLink}>
                    Go to My Orders
                  </Link>
                </div>
              ) : (
                <div className={classes.endedMessage}>
                  This auction ended on {formatDateTime(auction.endAuctionAt)}.
                  {winnerName ? (
                    <p className="mt-1">
                      Won by <strong>{winnerName}</strong> with a bid of Rs.{auction.currentPrice}.
                    </p>

                  ) : (auction.totalBids > 0 || (auction.bids && auction.bids.length > 0)) ? (
                    <p className="mt-1 text-amber-300">
                      Finalizing winner... Please refresh in a moment.
                    </p>
                  ) : (
                    <p className="mt-1">This auction ended without a winner.</p>
                  )}
                </div>
              )
            )}

            <div className={classes.descriptionSection}>
              <h2 className={classes.sectionTitle}>Description</h2>
              <p className={classes.descriptionText}>{auction.description}</p>
            </div>

            <div className={classes.specsSection}>
              <h2 className={classes.sectionTitle}>Specifications</h2>
              <div className={classes.specsGrid}>
                {auction.condition && (
                  <div className={classes.specItem}>
                    <span className={classes.specLabel}>Condition</span>
                    <span className={classes.specValue}>{auction.condition}</span>
                  </div>
                )}
                {auction.color && (
                  <div className={classes.specItem}>
                    <span className={classes.specLabel}>Color</span>
                    <span className={classes.specValue}>{auction.color}</span>
                  </div>
                )}
                {auction.material && (
                  <div className={classes.specItem}>
                    <span className={classes.specLabel}>Material</span>
                    <span className={classes.specValue}>{auction.material}</span>
                  </div>
                )}
                <div className={classes.specItem}>
                  <span className={classes.specLabel}>Brand</span>
                  <span className={classes.specValue}>{auction.brand || 'N/A'}</span>
                </div>
                {auction.size && (
                  <div className={classes.specItem}>
                    <span className={classes.specLabel}>Size</span>
                    <span className={classes.specValue}>{auction.size} {auction.sizeUnit}</span>
                  </div>
                )}
                {auction.weight && (
                  <div className={classes.specItem}>
                    <span className={classes.specLabel}>Weight</span>
                    <span className={classes.specValue}>{auction.weight} {auction.weightUnit}</span>
                  </div>
                )}
              </div>
            </div>

            <div className={classes.bidHistorySection}>
              <h2 className={classes.sectionTitle}>
                <History size={18} className="mr-2 inline-block" />
                Bid History
              </h2>
              {loadingBids ? (
                <p className={classes.bidHistoryMessage}>Loading bid history...</p>
              ) : bids.length > 0 ? (
                <ul className={`${classes.bidList} ${showAllBids ? classes.bidListExpanded : ''}`}>
                  {(showAllBids ? bids : bids.slice(0, 3)).map((bid, index) => {
                    // Check if this bid is the highest (most recent) among the displayed ones
                    const isHighestBid = index === 0;
                    const isUserOwnBid = Boolean(bid.isSelf);
                    const label = isUserOwnBid ? 'You' : (bid.bidderLabel || 'Bidder');
                    return (
                      <li key={bid._id || `${index}-${bid.amount}`} className={`${classes.bidItem} ${isHighestBid ? classes.highestBidItem : ''}`}>
                        <div className={classes.bidItemInfo}>
                          <span className={classes.bidderName}>
                            {label}
                            {isUserOwnBid && (
                              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400 font-semibold border border-purple-500/30">
                                You
                              </span>
                            )}
                            {isHighestBid && <span className={classes.highestBidBadge}>Highest</span>}
                          </span>
                          <span className={classes.bidTime}>{formatDateTime(bid.createdAt, { includeSeconds: true })}</span>
                        </div>
                        <span className={classes.bidAmount}>Rs.{bid.amount}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className={classes.bidHistoryMessage}>No bids have been placed yet. Be the first!</p>
              )}
              {bidPagination.total > 3 && (
                <button
                  onClick={() => {
                    setShowAllBids(!showAllBids);
                    if (showAllBids) setBidPage(1);
                  }}
                  className={classes.viewAllBidsButton}
                >
                  {showAllBids ? 'Show Less' : `See All ${bidPagination.total} Bids`}
                </button>
              )}
              {showAllBids && bidPagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={bidPage <= 1}
                    onClick={() => setBidPage((current) => Math.max(1, current - 1))}
                    className="rounded border px-3 py-1 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span>Page {bidPagination.page} of {bidPagination.totalPages}</span>
                  <button
                    type="button"
                    disabled={bidPage >= bidPagination.totalPages}
                    onClick={() => setBidPage((current) => Math.min(bidPagination.totalPages, current + 1))}
                    className="rounded border px-3 py-1 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            <div className={classes.sellerInfoSection}>
              <h2 className={classes.sectionTitle}>Seller Information</h2>
              <div className="flex items-center">
                <User size={20} className="mr-3 text-gray-500" />
                <p>Sold by: {sellerName}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AuctionDetailsPage;
