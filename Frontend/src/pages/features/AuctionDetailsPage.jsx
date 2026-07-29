import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { getAuctionDetailsPageClasses } from '@/styles/features/auctionDetailsPageStyles';
import { getCountdownParts } from '@/lib/auctionStatus';
import Footer from '@/pages/modules/Footer';
import { toast } from 'react-toastify';
import { Gavel, User, Info, History } from 'lucide-react';
import { getAuctionDetails, getAuctionBids, bidOnAuction, getUserPublicProfile } from '@/data/api';

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
  const [loadingBids, setLoadingBids] = useState(true);
  const [showAllBids, setShowAllBids] = useState(false); // New state to control bid history display
  const [isBidding, setIsBidding] = useState(false);
  const [mainImage, setMainImage] = useState('');
  const [sellerDisplayName, setSellerDisplayName] = useState(null);
  const SOCKET_URL = import.meta.env.VITE_API_URL_FEATURES || 'http://localhost:3002';

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
      const response = await getAuctionBids(auctionId);
      setBids(response.data.bids || []);
    } catch (err) {
      // Don't show a toast for this, as it's not critical for page load.
      console.error('Failed to load bid history.', err);
    } finally {
      setLoadingBids(false);
    }
  }, [auctionId]);

  useEffect(() => {
    setLoading(true);
    fetchAuction();
    fetchBids();
  }, [fetchAuction, fetchBids]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      socket.emit('join_auction', auctionId);
    });

    socket.on('new_bid', (data) => {
      if (data.auctionId === auctionId) {
        // Update auction price and bid count
        setAuction(prevAuction => {
          if (prevAuction && data.currentPrice > prevAuction.currentPrice) {
            return { ...prevAuction, currentPrice: data.currentPrice, bids: [...(prevAuction.bids || []), data.bid._id] };
          }
          return prevAuction;
        });

        // Add new bid to the top of the history
        setBids(prevBids => [data.bid, ...prevBids]);

        toast.info(`New bid of Rs.${data.bid.amount} placed!`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return () => {
      socket.disconnect();
    };
  }, [auctionId, SOCKET_URL]);

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

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.info('Please log in to place a bid.');
      navigate('/login');
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
  const isOwner = isLoggedIn && user && sellerIdString === user._id;
  const winnerIdString =
    (auction.winnerId && typeof auction.winnerId === 'object' ? auction.winnerId._id : auction.winnerId) || null;
  const isWinner = isLoggedIn && user && auction.status === 'ended' && !!winnerIdString && winnerIdString === user._id;

  const sellerName = sellerDisplayName
    ? sellerDisplayName
    : auction.sellerId?.fullName
      ? `${auction.sellerId.fullName.firstName || ''} ${auction.sellerId.fullName.lastName || ''}`.trim()
      : sellerIdString
        ? `User ${String(sellerIdString).slice(-6)}`
        : 'Unknown seller';

  const winnerName =
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
                <p className={classes.priceLabel}>{auction.status === 'live' ? 'Current Bid' : 'Starting Price'}</p>
                <p className={classes.priceValue}>Rs.{auction.currentPrice}</p>
              </div>
              <div className="text-right">
                <p className={classes.priceLabel}>Bids</p>
                <p className={classes.priceValue}>{auction.bids?.length || 0}</p>
              </div>
            </div>

            {auction.status === 'live' && !isOwner && (
              <form onSubmit={handleBidSubmit} className={classes.bidForm}>
                <div className={classes.bidInputWrapper}>
                  <span className={classes.bidInputCurrency}>Rs.</span>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`e.g., ${minNextBid}`}
                    className={classes.bidInput}
                    disabled={isBidding}
                  />
                </div>
                <button type="submit" className={classes.bidButton} disabled={isBidding}>
                  <Gavel size={20} className="mr-2" />
                  {isBidding ? 'Placing Bid...' : 'Place Bid'}
                </button>
              </form>
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
                  This auction ended on {new Date(auction.endAuctionAt).toLocaleString()}.
                  {winnerName ? (
                    <p className="mt-1">
                      Won by <strong>{winnerName}</strong> with a bid of Rs.{auction.currentPrice}.
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
                    return (
                      <li key={bid._id} className={`${classes.bidItem} ${isHighestBid ? classes.highestBidItem : ''}`}>
                        <div className={classes.bidItemInfo}>
                          <span className={classes.bidderName}>
                            Bidder {String(bid.bidderId).slice(-6)}
                            {isHighestBid && <span className={classes.highestBidBadge}>Highest</span>}
                          </span>
                          <span className={classes.bidTime}>{new Date(bid.createdAt).toLocaleString()}</span>
                        </div>
                        <span className={classes.bidAmount}>Rs.{bid.amount}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className={classes.bidHistoryMessage}>No bids have been placed yet. Be the first!</p>
              )}
              {bids.length > 3 && (
                <button onClick={() => setShowAllBids(!showAllBids)} className={classes.viewAllBidsButton}>
                  {showAllBids ? 'Show Less' : `See All ${bids.length} Bids`}
                </button>
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
