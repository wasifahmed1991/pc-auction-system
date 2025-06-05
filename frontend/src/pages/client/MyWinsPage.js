import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyWins } from '../../services/clientAuctionService';
import './MyWinsPage.css'; // Specific styles

function MyWinsPage() {
  const [wins, setWins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWins = async () => {
      setLoading(true);
      try {
        const response = await getMyWins();
        setWins(response.data.wins || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch your wins.');
        console.error('Fetch my wins error:', err);
      }
      setLoading(false);
    };
    fetchWins();
  }, []);

  if (loading) return <p className='loading-message'>Loading your won items...</p>;
  if (error) return <p className='error-message'>{error}</p>;

  return (
    <div className='my-wins-page'>
      <h2>My Wins 🏆</h2>
      {wins.length === 0 ? (
        <p>You haven't won any items yet. Keep bidding!</p>
      ) : (
        <div className='wins-list'>
          {wins.map((win, index) => (
            <div key={index} className='win-card'> {/* Assuming no unique win_id from backend for now, use index or ideally a proper ID */}
              <h4>Lot #{win.lot_identifier} - {win.device_name}</h4>
              {win.image_url && <img src={win.image_url} alt={win.device_name} className='win-lot-image' onError={(e) => e.target.style.display='none'}/>}
              <p><strong>Auction:</strong> {win.auction_name}</p>
              <p><strong>Auction Ended:</strong> {new Date(win.auction_end_time).toLocaleString()}</p>
              <p><strong>Winning Bid:</strong> ${win.winning_amount.toFixed(2)}</p>
              <p><strong>Awarded On:</strong> {new Date(win.awarded_at).toLocaleString()}</p>
              <button className='invoice-button' onClick={() => alert('Invoice download for Lot ' + win.lot_identifier + ' not yet implemented.')}>Download Invoice (Placeholder)</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyWinsPage;
