import React, { useEffect, useState } from 'react';
import './App.css';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Login from './Login';
import Account from './Account';

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
    // pokud nejsme na '/', nic se nevrací a není co rušit
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
                src="./src/assets/logo-vista.png"
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
    </Routes>
  );
}

export default App;
