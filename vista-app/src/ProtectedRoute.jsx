import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getCookie, verifyToken, getSecretKey } from './lib/jwtHandler';

function ProtectedRoute({ children }) {
  const [authorized, setAuthorized] = useState(null); // null = loading

  useEffect(() => {
    const checkToken = async () => {
      const token = getCookie('authToken');
      if (!token) {
        setAuthorized(false);
        return;
      }

      const payload = await verifyToken(token, getSecretKey());
      if (!payload || !payload.verified || !payload.isPassword) {
        setAuthorized(false);
        return;
      }

      setAuthorized(true);
    };

    checkToken();
  }, []);

  if (authorized === null) return <div>Načítání...</div>;
  if (!authorized) return <Navigate to="/login" replace />;

  return children;
}

export default ProtectedRoute;
