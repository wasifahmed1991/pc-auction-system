import axios from 'axios';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000') + '/admin/users';

// Function to get the auth token from localStorage
const getAuthToken = () => localStorage.getItem('adminToken');

const getAxiosConfig = () => ({ headers: { 'x-access-token': getAuthToken() } });

export const getAllUsers = async () => {
  return axios.get(API_URL, getAxiosConfig());
};

export const getUserById = async (userId) => {
  return axios.get(`${API_URL}/${userId}`, getAxiosConfig());
};

export const createUser = async (userData) => {
  return axios.post(API_URL, userData, getAxiosConfig());
};

export const updateUser = async (userId, userData) => {
  return axios.put(`${API_URL}/${userId}`, userData, getAxiosConfig());
};

export const deleteUser = async (userId) => {
  return axios.delete(`${API_URL}/${userId}`, getAxiosConfig());
};

export default { getAllUsers, getUserById, createUser, updateUser, deleteUser };
