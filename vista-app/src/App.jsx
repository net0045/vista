
import React, { useEffect, useState } from 'react';
import './App.css';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import logo from './assets/logo-vista.png';
import Login from './Login';
import Account from './Account';
import Menu from './Menu';
import MyOrders from './MyOrders';
import Order from './Order';
import QrView from './QrView';
import Verify from './Verify';



function App() {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            navigate('/login');
            return 100;
          }
          return prev + 1;
        });
      }, 20);

      return () => clearInterval(interval); // bude se volat jen, pokud jsme byli na '/'
    }
   
    return;
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
      <Route path="/account" element={<Account />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/myorders" element={<MyOrders />} />
      <Route path="/order" element={<Order />} />

      <Route path="/qr" element={<QrView />} />

      <Route path="/verify" element={<Verify />} />

    </Routes>
  );
}

export default App;
