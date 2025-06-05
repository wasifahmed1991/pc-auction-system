import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyBids } from '../../services/clientAuctionService';
import './MyBidsPage.css'; // Specific styles

function MyBidsPage() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBids = async () => {
      setLoading(true);
      try {
        const response = await getMyBids();
        setBids(response.data.bids || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch your bids.');
        console.error('Fetch my bids error:', err);
      }
      setLoading(false);
    };
    fetchBids();
  }, []);

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'winning': return 'status-winning';
      case 'outbid': return 'status-outbid';
      case 'active': return 'status-active';
      case 'lost': return 'status-lost';
      default: return '';
    }
  };

  if (loading) return <p className='loading-message'>Loading your bids...</p>;
  if (error) return <p className='error-message'>{error}</p>;

  return (
    <div className='my-bids-page'>
      <h2>My Bids</h2>
      {bids.length === 0 ? (
        <p>You haven't placed any bids yet. <Link to='/dashboard/auctions'>Browse auctions</Link> to get started!</p>
      ) : (
        <div className='bids-list'>
          {bids.map(bid => (
            <div key={bid.bid_id} className='bid-card'>
              <h4>Lot #{bid.lot_info.lot_identifier} - {bid.lot_info.device_name}</h4>
              <p><strong>Auction:</strong> <Link to={`/dashboard/auctions/${bid.lot_info.auction_id}`}>{bid.lot_info.auction_name}</Link></p>
              <p><strong>Your Bid:</strong> ${bid.bid_amount.toFixed(2)}</p>
              <p><strong>Bid Placed:</strong> {new Date(bid.bid_time).toLocaleString()}</p>
              <p><strong>Auction Ends:</strong> {new Date(bid.lot_info.auction_end_time).toLocaleString()}</p>
              <p><strong>Auction Status:</strong> <span className={`auction-status ${bid.lot_info.auction_status?.toLowerCase()}`}>{bid.lot_info.auction_status}</span></p>
              <p><strong>Bid Status:</strong> <span className={`bid-status ${getStatusClass(bid.status)}`}>{bid.status}</span></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyBidsPage;
