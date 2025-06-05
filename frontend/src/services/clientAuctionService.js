import axios from 'axios';
import { getClientToken } from '../utils/authClient';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getAxiosConfig = () => ({
  headers: { 'x-access-token': getClientToken() }
});

// Fetch active auctions (for clients)
export const getActiveAuctions = async (carrierId = null) => {
  let url = `${API_BASE_URL}/auctions`;
  if (carrierId) {
    url += `?carrier_id=${carrierId}`;
  }
  return axios.get(url, getAxiosConfig());
};

// Fetch details for a single auction (for clients)
export const getAuctionDetails = async (auctionId) => {
  return axios.get(`${API_BASE_URL}/auctions/${auctionId}`, getAxiosConfig());
};

// Submit a bid for a lot
export const submitBid = async (auctionId, lotId, bidAmount) => {
  const payload = { bid_amount: bidAmount };
  return axios.post(`${API_BASE_URL}/auctions/${auctionId}/lots/${lotId}/bid`, payload, getAxiosConfig());
};

// Fetch bids placed by the current client
export const getMyBids = async () => {
  return axios.get(`${API_BASE_URL}/my-bids`, getAxiosConfig());
};

// Fetch lots won by the current client (placeholder - backend endpoint TBD)
export const getMyWins = async () => {
  // This endpoint needs to be created in the backend first (e.g., GET /my-wins)
  // For now, returning a promise that resolves to an empty array or mock data.
  // console.warn('getMyWins service called - backend endpoint /my-wins is pending.');
  // Example: return axios.get(`${API_BASE_URL}/my-wins`, getAxiosConfig());
  return axios.get(`${API_BASE_URL}/my-wins`, getAxiosConfig());
};

// Fetch client's own profile
export const getClientProfile = async () => {
 return axios.get(`${API_BASE_URL}/profile`, getAxiosConfig());
};

export default {
  getActiveAuctions,
  getAuctionDetails,
  submitBid,
  getMyBids,
  getMyWins,
  getClientProfile
};
