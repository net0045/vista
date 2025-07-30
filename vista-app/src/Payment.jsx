import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './Payment.css';
import { getCookie, verifyToken, getSecretKey } from './lib/jwtHandler';

import { removeOrderAndFoodsInOrderByOrderId, setOrderPaidById } from './api/adminApi';

function Payment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [message, setMessage] = useState('');
  const [messageENG, setMessageENG] = useState('');
  const [info, setInfo] = useState('');
  const [infoENG, setInfoENG] = useState('');
  const [success, setSuccess] = useState('');



  useEffect(() => {
    const id = params.get('id');
    const stat = params.get('status');

    setOrderId(id);
    setStatus(stat);

    if (stat === 'success') {
      setSuccess('✅');
      setMessage('Platba proběhla úspěšně. Děkujeme!');
      setMessageENG('The payment was successful. Thank you!');
      setInfo('Objednávku máte v MOJE OBJEDNÁVKY');
      setInfoENG('You can find your order in MY ORDERS');
      const markAsPaid = async () => {
        try {
          await setOrderPaidById(id);
          alert('Platba byla úspěšně zpracována. Děkujeme za objednávku!');
        } catch (err) {
          console.error('Chyba při aktualizaci objednávky:', err);
        }
      };
      markAsPaid();
    } else if (stat === 'fail') {
      setSuccess('❌');
      setMessage('Platba byla zamítnuta nebo přerušena.');
      setMessageENG('The payment was declined or interrupted.');
      setInfo('ZKUSTE TO PROSÍM ZNOVU');
      setInfoENG('PLEASE TRY AGAIN');
      const removeOrder = async () => {
        try {
          await removeOrderAndFoodsInOrderByOrderId(id);
          alert('Objednávka byla zrušena kvůli neúspěšné platbě.');
        } catch (err) {
          console.error('Chyba při rušení objednávky:', err);
        }
      };
      removeOrder();
    } else {
      setSuccess('⚠️');
      setMessage('Stav platby není známý.');
      setMessageENG('The payment status is unknown.');
    }
  }, [params]);

  return (
    <div className="content">
      <div className="payment-status">
        <h2>Stav platby <br /> Payment status</h2>
        <div className='no-yes'>{success}</div>
        <p>{message}</p>
        <p className='eng-message'>{messageENG}</p>
        <p className='info'>{info}</p>
        <p className='info eng-message'>{infoENG}</p>
        {orderId && <p><strong>ID objednávky:</strong> {orderId}</p>}
        <button className="btn" onClick={() => navigate('/account')}>Zpět na účet / Back to account</button>
      </div>
    </div>
  );
}

export default Payment;
