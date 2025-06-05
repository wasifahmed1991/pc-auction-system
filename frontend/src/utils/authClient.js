import axios from 'axios';

const CLIENT_TOKEN_KEY = 'clientToken';
const CLIENT_USER_INFO_KEY = 'clientUserInfo';

export const loginClient = async (email, password) => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const response = await axios.post(`${API_URL}/login`, { email, password });
  if (response.data.token && response.data.user) {
    localStorage.setItem(CLIENT_TOKEN_KEY, response.data.token);
    localStorage.setItem(CLIENT_USER_INFO_KEY, JSON.stringify(response.data.user));
    axios.defaults.headers.common['x-access-token'] = response.data.token; // Set for subsequent requests
    return response.data;
  } else {
    throw new Error(response.data.message || 'Login failed');
  }
};

export const logoutClient = () => {
  localStorage.removeItem(CLIENT_TOKEN_KEY);
  localStorage.removeItem(CLIENT_USER_INFO_KEY);
  delete axios.defaults.headers.common['x-access-token'];
};

export const getClientToken = () => localStorage.getItem(CLIENT_TOKEN_KEY);

export const getClientInfo = () => {
  const userInfo = localStorage.getItem(CLIENT_USER_INFO_KEY);
  return userInfo ? JSON.parse(userInfo) : null;
};

export const isClientAuthenticated = () => !!getClientToken();
