import React from 'react';
import AuctionForm from '../../components/admin/AuctionForm';
import { createAuction } from '../../services/adminAuctionService';
function AuctionCreatePage() { return <AuctionForm onSubmit={createAuction} />; }
export default AuctionCreatePage;
