import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { getClientInfo, logoutClient, isClientAuthenticated } from '../../utils/authClient';
import './ClientDashboard.css'; // Specific styles for client dashboard

function ClientDashboardPage() {
  const navigate = useNavigate();
  const clientInfo = getClientInfo();

  React.useEffect(() => {
    if (!isClientAuthenticated()) {
      navigate('/login'); // Redirect if not authenticated (e.g. direct navigation)
    }
  }, [navigate]);

  const handleLogout = () => {
    logoutClient();
    navigate('/login');
  };

  if (!clientInfo) {
    // This case should ideally be handled by the useEffect redirect,
    // but as a fallback or if auth status changes:
    return <p>Loading user information or redirecting...</p>;
  }

  return (
    <div className='client-dashboard'>
      <header className='dashboard-header'>
        <div className='logo-area'>
          <h1>PhonesCanada Auctions</h1>
        </div>
        <nav className='dashboard-nav'>
          <Link to='/dashboard/auctions'>📦 Auctions</Link>
          <Link to='/dashboard/my-bids'>📜 My Bids</Link>
          <Link to='/dashboard/my-wins'>🏆 My Wins</Link>
          <Link to='/dashboard/grading-guide'>📘 Grading Guide</Link>
          <Link to='/dashboard/support'>💬 Contact Support</Link>
        </nav>
        <div className='user-profile-area'>
          <span>Welcome, {clientInfo.company_name || clientInfo.email}!</span>
          <span className='deposit-status'>Deposit: {clientInfo.deposit_status}</span>
          <button onClick={handleLogout} className='logout-button'>Logout</button>
        </div>
      </header>
      <main className='dashboard-content'>
        {clientInfo.deposit_status !== 'on_file' && clientInfo.deposit_status !== 'cleared' && (
           <div className='warning-banner'>
             Your account has a deposit status of '{clientInfo.deposit_status}'. You may browse auctions, but bidding is disabled until your deposit is 'on_file' or 'cleared'. Please contact support.
           </div>
        )}
        <Outlet /> {/* This is where nested route components will render */}
      </main>
      <footer className='dashboard-footer'>
        <p>&copy; {new Date().getFullYear()} PhonesCanada Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default ClientDashboardPage;
