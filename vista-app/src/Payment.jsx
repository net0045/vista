import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './Account.css';
import { getCookie, verifyToken, getSecretKey } from './lib/jwtHandler';

function Payment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const id = params.get('id');
    const stat = params.get('status');

    setOrderId(id);
    setStatus(stat);

    if (stat === 'success') {
      setMessage('✅ Platba proběhla úspěšně. Děkujeme!');
    } else if (stat === 'fail') {
      setMessage('❌ Platba byla zamítnuta nebo přerušena.');
    } else {
      setMessage('⚠️ Stav platby není známý.');
    }
  }, [params]);

  return (
    <div className="content">
      <div className="payment-status">
        <h2>Stav platby</h2>
        <p>{message}</p>
        {orderId && <p><strong>ID objednávky:</strong> {orderId}</p>}
        <button className="btn" onClick={() => navigate('/account')}>
          Zpět na účet
        </button>
      </div>
    </div>
  );
}

export default Payment;
