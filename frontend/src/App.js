import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import './App.css';

function App() {
  // Placeholder for checking auth status
  const isAdminAuthenticated = () => !!localStorage.getItem('adminToken');

  return (
    <Router>
      <div className='App'>
        <Routes>
          <Route path='/' element={<Navigate to='/admin/login' />} />
          <Route path='/admin/login' element={<AdminLogin />} />
          <Route path='/admin/dashboard' element={isAdminAuthenticated() ? <AdminDashboard /> : <Navigate to='/admin/login' />} />
          <Route path='/admin/users' element={isAdminAuthenticated() ? <UserListPage /> : <Navigate to='/admin/login' />} />
          <Route path='/admin/users/new' element={isAdminAuthenticated() ? <UserCreatePage /> : <Navigate to='/admin/login' />} />
          <Route path='/admin/users/edit/:userId' element={isAdminAuthenticated() ? <UserEditPage /> : <Navigate to='/admin/login' />} />
          <Route path='/admin/carriers' element={isAdminAuthenticated() ? <CarrierListPage /> : <Navigate to='/admin/login' />} />
          <Route path='/admin/auctions' element={isAdminAuthenticated() ? <AuctionListPage /> : <Navigate to='/admin/login' />} />
          <Route path='/admin/auctions/new' element={isAdminAuthenticated() ? <AuctionCreatePage /> : <Navigate to='/admin/login' />} />
          <Route path='/admin/auctions/edit/:auctionId' element={isAdminAuthenticated() ? <AuctionEditPage /> : <Navigate to='/admin/login' />} />
          <Route path='/admin/auctions/:auctionId/upload-lots' element={isAdminAuthenticated() ? <LotUploadPage /> : <Navigate to='/admin/login' />} />
          {/* Add other admin routes here, protected similarly */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
