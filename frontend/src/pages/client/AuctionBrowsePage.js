import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getActiveAuctions } from '../../services/clientAuctionService';
import './AuctionBrowsePage.css'; // Specific styles

function AuctionBrowsePage() {
  const [auctionsByCarrier, setAuctionsByCarrier] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCarrierTab, setActiveCarrierTab] = useState('');

  useEffect(() => {
    const fetchAuctions = async () => {
      setLoading(true);
      try {
        const response = await getActiveAuctions();
        if (response.data && response.data.auctions_by_carrier) {
          setAuctionsByCarrier(response.data.auctions_by_carrier);
          // Set the first carrier as active tab if available
          const carriers = Object.keys(response.data.auctions_by_carrier);
          if (carriers.length > 0) {
            setActiveCarrierTab(carriers[0]);
          }
        } else {
          setError('No auction data found in expected format.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch auctions.');
        console.error('Fetch auctions error:', err);
      }
      setLoading(false);
    };
    fetchAuctions();
  }, []);

  if (loading) return <p className='loading-message'>Loading auctions...</p>;
  if (error) return <p className='error-message'>{error}</p>;

  const carrierNames = Object.keys(auctionsByCarrier);

  return (
    <div className='auction-browse-page'>
      <h2>Active Auctions</h2>
      {carrierNames.length === 0 ? (
        <p>No active auctions available at the moment. Please check back later.</p>
      ) : (
        <div className='carrier-tabs'>
          {carrierNames.map(carrierName => (
            <button
              key={carrierName}
              className={`tab-button ${activeCarrierTab === carrierName ? 'active' : ''}`}
              onClick={() => setActiveCarrierTab(carrierName)}>
              {carrierName} ({auctionsByCarrier[carrierName].auctions.length})
            </button>
          ))}
        </div>
      )}

      {activeCarrierTab && auctionsByCarrier[activeCarrierTab] && (
        <div className='auction-list'>
          <h3>{activeCarrierTab} Auctions</h3>
          {auctionsByCarrier[activeCarrierTab].auctions.length === 0 ? (
            <p>No auctions currently active for this carrier.</p>
          ) : (auctionsByCarrier[activeCarrierTab].auctions.map(auction => (
            <div key={auction.auction_id} className='auction-item-card'>
              <h4>{auction.name}</h4>
              <p>Ends: {new Date(auction.end_time).toLocaleString()}</p>
              <p>Lots: {auction.lot_count}</p>
              {auction.grading_guide && <p className='grading-guide-preview'>Grading: {auction.grading_guide.substring(0,50)}...</p>}
              <Link to={`/dashboard/auctions/${auction.auction_id}`} className='view-auction-link'>View Details & Bid</Link>
            </div>
          )))}
        </div>
      )}
    </div>
  );
}

export default AuctionBrowsePage;
