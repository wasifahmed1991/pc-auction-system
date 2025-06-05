import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AuctionForm from '../../components/admin/AuctionForm';
import { getAuctionById, updateAuction } from '../../services/adminAuctionService';
import LotListDisplay from '../../components/admin/LotListDisplay'; // Will create this next

function AuctionEditPage() {
  const { auctionId } = useParams();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');

  useEffect(() => {
    const fetchAuction = async () => {
      try { const response = await getAuctionById(auctionId); setInitialData(response.data); } catch (err) { setError('Failed to fetch auction data.'); console.error(err); }
      setLoading(false);
    }; fetchAuction();
  }, [auctionId]);

  const handleSubmit = (auctionData) => updateAuction(auctionId, auctionData);

  if (loading) return <p>Loading auction data...</p>;
  if (error) return <p style={{color: 'red'}}>{error}</p>;
  if (!initialData) return <p>Auction not found.</p>;

  return (<div><AuctionForm onSubmit={handleSubmit} initialData={initialData} isEditMode={true} /> <hr/> <LotListDisplay lots={initialData.lots || []} auctionId={auctionId} /> <Link to={`/admin/auctions/${auctionId}/upload-lots`} className='button-link' style={{marginTop: '20px'}}>Upload/Replace Lots for this Auction</Link> </div>);
}
export default AuctionEditPage;
