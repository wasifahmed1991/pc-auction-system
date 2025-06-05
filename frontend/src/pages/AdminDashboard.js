import React from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Added Link
import axios from 'axios';

function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    delete axios.defaults.headers.common['x-access-token'];
    navigate('/admin/login');
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, Admin!</p>
      <p><Link to='/admin/users'>Manage Users</Link></p>
      <p><Link to='/admin/carriers'>Manage Carriers</Link></p>
      <p><Link to='/admin/auctions'>Manage Auctions</Link></p>
      {/* Future: Add links to User Management, Auction Management etc. */}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default AdminDashboard;
