import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Admin components
import AdminLogin from './components/auth/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import UserListPage from './pages/admin/UserListPage';
import UserCreatePage from './pages/admin/UserCreatePage';
import UserEditPage from './pages/admin/UserEditPage';
import CarrierListPage from './pages/admin/CarrierListPage';
import AuctionListPage from './pages/admin/AuctionListPage';
import AuctionCreatePage from './pages/admin/AuctionCreatePage';
import AuctionEditPage from './pages/admin/AuctionEditPage';
import LotUploadPage from './pages/admin/LotUploadPage';

// Client components
import ClientLoginPage from './pages/client/ClientLoginPage';
import ClientDashboardPage from './pages/client/ClientDashboardPage';
import ClientProtectedRoute from './components/auth/ClientProtectedRoute';
import ClientAuctionBrowsePageActual from './pages/client/AuctionBrowsePage';
import ClientAuctionDetailPageActual from './pages/client/AuctionDetailPage';
import ClientMyBidsPageActual from './pages/client/MyBidsPage';
import ClientMyWinsPageActual from './pages/client/MyWinsPage';
// Placeholder for actual client content pages (will be added in later steps)
const ClientGradingGuidePage = () => <div>Grading Guide Page (under /dashboard/grading-guide)</div>;
const ClientSupportPage = () => <div>Contact Support Page (under /dashboard/support)</div>;

function App() {
  // Admin auth check (remains the same)
  const isAdminAuthenticated = () => !!localStorage.getItem('adminToken');
  // Client auth check (from new utility)
  const isClientAuthenticated = () => !!localStorage.getItem('clientToken');


  return (
    <Router>
      <Routes>
        {/* Client Routes */}
        <Route path='/login' element={<ClientLoginPage />} />
        <Route path='/dashboard' element={<ClientProtectedRoute />}>
          {/* ClientDashboardPage has an <Outlet/> for these nested routes */}
          <Route element={<ClientDashboardPage />}> {/* Layout component for dashboard views */}
            <Route index element={<Navigate to='auctions' replace />} /> { /* Default to auctions view */}
            <Route path='auctions' element={<ClientAuctionBrowsePageActual />} />
            <Route path='auctions/:auctionId' element={<ClientAuctionDetailPageActual />} />
            <Route path='my-bids' element={<ClientMyBidsPageActual />} />
            <Route path='my-wins' element={<ClientMyWinsPageActual />} />
            <Route path='grading-guide' element={<ClientGradingGuidePage />} />
            <Route path='support' element={<ClientSupportPage />} />
            {/* Add more client-specific nested routes here, e.g., /dashboard/auctions/:id */}
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route path='/admin/login' element={<AdminLogin />} />
        {/* Protected Admin Routes */}
        <Route path='/admin/dashboard' element={isAdminAuthenticated() ? <AdminDashboard /> : <Navigate to='/admin/login' />} />
        <Route path='/admin/users' element={isAdminAuthenticated() ? <UserListPage /> : <Navigate to='/admin/login' />} />
        <Route path='/admin/users/new' element={isAdminAuthenticated() ? <UserCreatePage /> : <Navigate to='/admin/login' />} />
        <Route path='/admin/users/edit/:userId' element={isAdminAuthenticated() ? <UserEditPage /> : <Navigate to='/admin/login' />} />
        <Route path='/admin/carriers' element={isAdminAuthenticated() ? <CarrierListPage /> : <Navigate to='/admin/login' />} />
        <Route path='/admin/auctions' element={isAdminAuthenticated() ? <AuctionListPage /> : <Navigate to='/admin/login' />} />
        <Route path='/admin/auctions/new' element={isAdminAuthenticated() ? <AuctionCreatePage /> : <Navigate to='/admin/login' />} />
        <Route path='/admin/auctions/edit/:auctionId' element={isAdminAuthenticated() ? <AuctionEditPage /> : <Navigate to='/admin/login' />} />
        <Route path='/admin/auctions/:auctionId/upload-lots' element={isAdminAuthenticated() ? <LotUploadPage /> : <Navigate to='/admin/login' />} />

        {/* Fallback / Default Route */}
        {/* If client is auth, go to /dashboard, else to /login (client login) */}
        <Route path='/' element={<Navigate to={isClientAuthenticated() ? '/dashboard' : '/login'} />} />
        {/* Or, a more generic landing page could be used here */}

        {/* Catch-all for undefined routes (optional) */}
        <Route path='*' element={<div>Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;
