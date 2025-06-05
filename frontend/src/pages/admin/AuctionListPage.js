import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllAuctions, deleteAuction } from '../../services/adminAuctionService';
import '../../styles/TableStyles.css';

function AuctionListPage() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAuctions = async () => {
    setLoading(true); setError('');
    try {
      const response = await getAllAuctions();
      setAuctions(response.data.auctions);
    } catch (err) { setError(err.response?.data?.message || 'Failed to fetch auctions.'); console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchAuctions(); }, []);

  const handleDelete = async (auctionId) => {
    if (window.confirm('Are you sure you want to delete this auction and all its lots?')) {
      try {
        await deleteAuction(auctionId);
        fetchAuctions();
      } catch (err) { setError(err.response?.data?.message || 'Failed to delete auction.'); console.error(err); }
    }
  };

  if (loading) return <p>Loading auctions...</p>;

  return (
    <div className='page-container'>
      <h2>Auction Management</h2>
      {error && <p className='error-message' style={{color: 'red'}}>{error}</p>}
      <Link to='/admin/auctions/new' className='button-link'>Create New Auction</Link>
      <table className='data-table'>
        <thead><tr><th>Name</th><th>Carrier</th><th>End Time</th><th>Status</th><th>Visible</th><th>Lots</th><th>Actions</th></tr></thead>
        <tbody>
          {auctions && auctions.length > 0 ? auctions.map(auc => (
            <tr key={auc.auction_id}>
              <td>{auc.name}</td><td>{auc.carrier_name}</td><td>{new Date(auc.end_time).toLocaleString()}</td>
              <td>{auc.status}</td><td>{auc.is_visible ? 'Yes' : 'No'}</td><td>{auc.lot_count}</td>
              <td>
                <Link to={`/admin/auctions/edit/${auc.auction_id}`} className='action-link edit-link'>Edit/View Lots</Link>
                <Link to={`/admin/auctions/${auc.auction_id}/upload-lots`} className='action-link'>Upload Lots</Link>
                <button onClick={() => handleDelete(auc.auction_id)} className='action-link delete-link'>Delete</button>
              </td>
            </tr>
          )) : (<tr><td colSpan='7'>No auctions found.</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}
export default AuctionListPage;
