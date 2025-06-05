import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ADMIN_AUCTIONS_URL = `${API_BASE_URL}/admin/auctions`;
const ADMIN_CARRIERS_URL = `${API_BASE_URL}/admin/carriers`;

const getAuthToken = () => localStorage.getItem('adminToken');
const getAxiosConfig = () => ({ headers: { 'x-access-token': getAuthToken() } });

// --- Carrier Methods ---
export const getAllCarriers = async () => axios.get(ADMIN_CARRIERS_URL, getAxiosConfig());
export const createCarrier = async (carrierData) => axios.post(ADMIN_CARRIERS_URL, carrierData, getAxiosConfig());

// --- Auction Methods ---
export const getAllAuctions = async () => axios.get(ADMIN_AUCTIONS_URL, getAxiosConfig());
export const getAuctionById = async (auctionId) => axios.get(`${ADMIN_AUCTIONS_URL}/${auctionId}`, getAxiosConfig());
export const createAuction = async (auctionData) => axios.post(ADMIN_AUCTIONS_URL, auctionData, getAxiosConfig());
export const updateAuction = async (auctionId, auctionData) => axios.put(`${ADMIN_AUCTIONS_URL}/${auctionId}`, auctionData, getAxiosConfig());
export const deleteAuction = async (auctionId) => axios.delete(`${ADMIN_AUCTIONS_URL}/${auctionId}`, getAxiosConfig());
export const uploadLotsFile = async (auctionId, formData) => {
  const config = { headers: { 'x-access-token': getAuthToken(), 'Content-Type': 'multipart/form-data' } };
  return axios.post(`${ADMIN_AUCTIONS_URL}/${auctionId}/upload_lots`, formData, config);
};

export default { getAllCarriers, createCarrier, getAllAuctions, getAuctionById, createAuction, updateAuction, deleteAuction, uploadLotsFile };
