import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, homeFor, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppShell } from './components/AppShell';
import { RequireRole } from './components/Guards';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import OwnerDashboard from './pages/owner/Dashboard';
import OwnerListings from './pages/owner/Listings';
import ListingForm from './pages/owner/ListingForm';
import OwnerRequests from './pages/owner/Requests';
import OwnerWallet from './pages/owner/WalletPage';

import RenterDashboard from './pages/renter/Dashboard';
import RenterSearch from './pages/renter/Search';
import RenterTours from './pages/renter/Tours';
import RenterBookings from './pages/renter/Bookings';

import Rewards from './pages/rewards/Rewards';

import Account from './pages/account/Account';
import Notifications from './pages/notifications/Notifications';
import About from './pages/info/About';
import Help from './pages/info/Help';

import ListingDetail from './pages/shop/ListingDetail';
import Furniture from './pages/shop/Furniture';
import Decor from './pages/shop/Decor';
import Decoration from './pages/shop/Decoration';
import Services from './pages/shop/Services';
import Planner from './pages/shop/Planner';
import Cart from './pages/shop/Cart';
import Orders from './pages/shop/Orders';
import Upgrade from './pages/shop/Upgrade';

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              element={
                <RequireRole>
                  <AppShell />
                </RequireRole>
              }
            >
              {/* Owner (role-gated) */}
              <Route
                path="/owner"
                element={
                  <RequireRole allow={['owner']}>
                    <OwnerDashboard />
                  </RequireRole>
                }
              />
              <Route
                path="/owner/listings"
                element={
                  <RequireRole allow={['owner']}>
                    <OwnerListings />
                  </RequireRole>
                }
              />
              <Route
                path="/owner/listings/new"
                element={
                  <RequireRole allow={['owner']}>
                    <ListingForm />
                  </RequireRole>
                }
              />
              <Route
                path="/owner/listings/:id/edit"
                element={
                  <RequireRole allow={['owner']}>
                    <ListingForm />
                  </RequireRole>
                }
              />
              <Route
                path="/owner/requests"
                element={
                  <RequireRole allow={['owner']}>
                    <OwnerRequests />
                  </RequireRole>
                }
              />
              <Route
                path="/owner/wallet"
                element={
                  <RequireRole allow={['owner']}>
                    <OwnerWallet />
                  </RequireRole>
                }
              />

              {/* Renter (role-gated; guests get bounced to their home) */}
              <Route
                path="/renter"
                element={
                  <RequireRole allow={['renter']}>
                    <RenterDashboard />
                  </RequireRole>
                }
              />
              <Route
                path="/renter/search"
                element={
                  <RequireRole allow={['renter', 'guest']}>
                    <RenterSearch />
                  </RequireRole>
                }
              />
              <Route
                path="/renter/tours"
                element={
                  <RequireRole allow={['renter']}>
                    <RenterTours />
                  </RequireRole>
                }
              />
              <Route
                path="/renter/bookings"
                element={
                  <RequireRole allow={['renter']}>
                    <RenterBookings />
                  </RequireRole>
                }
              />

              {/* Shared — any signed-in role */}
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/furniture" element={<Furniture />} />
              <Route path="/decor" element={<Decor />} />
              <Route path="/decoration" element={<Decoration />} />
              <Route path="/services" element={<Services />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/upgrade" element={<Upgrade />} />
              <Route path="/account" element={<Account />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/about" element={<About />} />
              <Route path="/help" element={<Help />} />
            </Route>

            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
