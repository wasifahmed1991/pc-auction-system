import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isClientAuthenticated } from '../../utils/authClient';

const ClientProtectedRoute = () => {
  if (!isClientAuthenticated()) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to='/login' replace />;
  }

  return <Outlet />; // Render the child route/component
};

export default ClientProtectedRoute;
