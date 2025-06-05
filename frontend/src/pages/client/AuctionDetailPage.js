import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAuctionDetails, submitBid } from '../../services/clientAuctionService';
import { getClientInfo } from '../../utils/authClient';
import CountdownTimer from '../../components/common/CountdownTimer';
import './AuctionDetailPage.css'; // Specific styles

function AuctionDetailPage() {
  const { auctionId } = useParams();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bidAmounts, setBidAmounts] = useState({}); // Store bid amounts for each lot_id
  const [bidMessages, setBidMessages] = useState({}); // Store success/error messages for each lot_id

  const clientInfo = getClientInfo();
  const canBid = clientInfo && (clientInfo.deposit_status === 'on_file' || clientInfo.deposit_status === 'cleared');

  const fetchAuctionData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAuctionDetails(auctionId);
      setAuction(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch auction details.');
      console.error('Fetch auction details error:', err);
    }
    setLoading(false);
  }, [auctionId]);

  useEffect(() => {
    fetchAuctionData();
  }, [fetchAuctionData]);

  const handleBidChange = (lotId, amount) => {
    setBidAmounts(prev => ({ ...prev, [lotId]: amount }));
    setBidMessages(prev => ({...prev, [lotId]: ''})); // Clear previous message on new input
  };

  const handleBidSubmit = async (lotId) => {
    if (!canBid) {
      setBidMessages(prev => ({...prev, [lotId]: {type: 'error', text: 'Bidding disabled due to deposit status.'}}));
      return;
    }
    const amount = bidAmounts[lotId];
    if (!amount || parseFloat(amount) <= 0) {
      setBidMessages(prev => ({...prev, [lotId]: {type: 'error', text: 'Please enter a valid bid amount.'}}));
      return;
    }

    const confirmBid = window.confirm(`Are you sure you want to bid ${amount} USD for Lot #${auction?.lots.find(l=>l.lot_id === lotId)?.lot_identifier || lotId}? You cannot modify bids once submitted.`);
    if (confirmBid) {
      try {
        setBidMessages(prev => ({...prev, [lotId]: {type: 'loading', text: 'Submitting bid...'}}));
        const response = await submitBid(auctionId, lotId, parseFloat(amount));
        setBidMessages(prev => ({...prev, [lotId]: {type: 'success', text: response.data.message || 'Bid submitted successfully!'}}));
        // Optionally clear bid input or give other feedback
        // Consider refetching auction data or bids if necessary
      } catch (err) {
        setBidMessages(prev => ({...prev, [lotId]: {type: 'error', text: err.response?.data?.message || 'Failed to submit bid.'}}));
        console.error('Submit bid error:', err);
      }
    }
  };

  if (loading) return <p className='loading-message'>Loading auction details...</p>;
  if (error) return <p className='error-message'>{error}</p>;
  if (!auction) return <p>Auction not found.</p>;

  return (
    <div className='auction-detail-page'>
      <div className='auction-header-details'>
        <h2>{auction.name}</h2>
        <p><strong>Carrier:</strong> {auction.carrier_name}</p>
        <p><strong>Auction Ends:</strong> {new Date(auction.end_time).toLocaleString()}</p>
        <CountdownTimer endTime={auction.end_time} />
        {auction.grading_guide && <div className='grading-guide-full'><strong>Grading Guide:</strong> <pre>{auction.grading_guide}</pre></div>}
        {!canBid && <p className='bid-warning'>Your deposit status is '{clientInfo?.deposit_status}'. Bidding is disabled. Please contact support.</p>}
      </div>

      <h3>Lots in this Auction</h3>
      <div className='lots-grid'>
        {auction.lots && auction.lots.length > 0 ? auction.lots.map(lot => (
          <div key={lot.lot_id} className='lot-card'>
            <h4>Lot #{lot.lot_identifier} - {lot.device_name}</h4>
            {lot.image_url && <img src={lot.image_url} alt={lot.device_name} className='lot-image' onError={(e) => e.target.style.display='none'}/>}
            <p><strong>Details:</strong> {lot.device_details}</p>
            <p><strong>Condition:</strong> {lot.condition}</p>
            <p><strong>Quantity:</strong> {lot.quantity}</p>
            {lot.min_bid > 0 && <p><strong>Minimum Bid:</strong> ${lot.min_bid.toFixed(2)}</p>}

            {new Date(auction.end_time) > new Date() && auction.status === 'active' && (
              <div className='bid-form'>
                <input
                  type='number'
                  placeholder='Your Bid (USD)'
                  value={bidAmounts[lot.lot_id] || ''}
                  onChange={(e) => handleBidChange(lot.lot_id, e.target.value)}
                  disabled={!canBid || new Date(auction.end_time) <= new Date()}
                  min={lot.min_bid > 0 ? lot.min_bid : '0.01'}
                  step='0.01'
                />
                <button
                  onClick={() => handleBidSubmit(lot.lot_id)}
                  disabled={!canBid || new Date(auction.end_time) <= new Date() || bidMessages[lot.lot_id]?.type === 'loading'}
                >
                  {bidMessages[lot.lot_id]?.type === 'loading' ? 'Submitting...' : 'Submit Bid'}
                </button>
                {bidMessages[lot.lot_id] && <p className={`bid-message ${bidMessages[lot.lot_id].type}`}>{bidMessages[lot.lot_id].text}</p>}
              </div>
            )}
             {new Date(auction.end_time) <= new Date() && <p className='auction-ended-message'>This auction has ended.</p>}
          </div>
        )) : <p>No lots found for this auction.</p>}
      </div>
      <Link to='/dashboard/auctions' className='back-link'>Back to Auctions List</Link>
    </div>
  );
}
export default AuctionDetailPage;
