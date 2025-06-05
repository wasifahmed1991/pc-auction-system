import React from 'react';
import { Link } from 'react-router-dom'; // Added Link import
function LotListDisplay({ lots, auctionId }) {
  if (!lots || lots.length === 0) return <p>No lots found for this auction. <Link to={`/admin/auctions/${auctionId}/upload-lots`}>Upload lots now.</Link></p>;
  return (<div><h3>Lots in this Auction ({lots.length})</h3><table className='data-table'><thead><tr><th>Lot ID</th><th>Device</th><th>Condition</th><th>Qty</th><th>Min Bid</th></tr></thead><tbody>
    {lots.map(lot => (<tr key={lot.lot_id}><td>{lot.lot_identifier}</td><td>{lot.device_name}</td><td>{lot.condition}</td><td>{lot.quantity}</td><td>{lot.min_bid}</td></tr>))}
  </tbody></table></div>);
}
export default LotListDisplay;
