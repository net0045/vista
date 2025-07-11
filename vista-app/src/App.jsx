
import React, { useEffect, useState } from 'react';
import './App.css';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import logo from '/images/logo-vista.png';
import Login from './Login';
import Account from './Account';
import Menu from './Menu';
import MyOrders from './MyOrders';
import Order from './Order';
import QrView from './QrView';
import Verify from './Verify';
import Signin from './Signin';
import ProtectedRoute from './ProtectedRoute';
import { verifyToken, getSecretKey, getCookie } from './lib/jwtHandler';
import Admin from './Admin';


function App() {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

   useEffect(() => {
    const checkToken = async () => {
      const token = getCookie('authToken');

      if (!token) {
        navigate('/login');
        return;
      }

      const payload = await verifyToken(token, getSecretKey());
      if (!payload || !payload.email) {
        console.warn('[JWT] Neplatný token nebo chybějící email.');
        navigate('/login');
        return;
      }

      if (payload.verified !== true) {
        console.log('[JWT] Email není verifikován.');
        navigate('/login');
        return;
      }

      if (!payload.isPassword) {
        console.log('[JWT] Verifikován, ale není zadáno heslo.');
        navigate('/signin');
        return;
      }

      navigate('/account');
    };

    if (location.pathname === '/') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            checkToken();
            return 100;
          }
          return prev + 1;
        });
      }, 20);

      return () => clearInterval(interval);
    }
  }, [location.pathname, navigate]);
   

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="content">
            <div className="logo">
              <img
                src={logo}
                alt="Logo studentské koleje Vista"
                className="logo-image-vista"
              />
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/menu" element={<Menu/>} />
      <Route path="/qr" element={<QrView />} />
      <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
      
      <Route path="/myorders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
      <Route path="/order" element={<ProtectedRoute><Order /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
