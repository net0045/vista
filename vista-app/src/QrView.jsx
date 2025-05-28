import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './QrView.css';

function QrView() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const id = query.get('id');

  const [status, setStatus] = useState('loading');
  const [order, setOrder] = useState(null);

  const todayKey = `used-${id}-${new Date().toISOString().slice(0, 10)}`;

  // Najdeme objednávku a zjistíme, jestli byla použita
  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const found = orders.find(o => o.id.toString() === id);

    if (!found) {
      setStatus('notfound');
      return;
    }

    setOrder(found);

    const alreadyUsedToday = localStorage.getItem(todayKey);
    if (alreadyUsedToday) {
      setStatus('used');
    } else {
      setStatus('valid'); // použijeme až v dalším kroku
    }
  }, [id]);

  // Označíme QR jako použité AŽ PO zobrazení
  useEffect(() => {
    if (status === 'valid') {
      localStorage.setItem(todayKey, 'true');
    }
  }, [status, todayKey]);

  // Různé stavy výstupu
  if (status === 'loading') return null;

  if (status === 'notfound') {
    return (
      <div className="qrCard">
        <h2>Objednávka nenalezena</h2>
        <p>Zkontrolujte prosím QR kód.</p>
      </div>
    );
  }

  if (status === 'used') {
    return (
      <div className="qrCard">
        <h2>⚠️ NUH UH</h2>
        <img src="/images/used.png" alt="Potvrzeno" className="orderImage"/>
        <p><strong>Datum:</strong> {order?.date}</p>
        <p className="warningText">QR kód je možné ověřit pouze jednou denně.</p>
      </div>
    );
  }

  return (
    <div className="qrCard">
      <h2>✅ Potvrzení objednávky</h2>
      <img src="/images/success.png" alt="Potvrzeno" className="orderImage"/>
      <p><strong>Datum:</strong> {order?.date}</p>
      <p><strong>Menu 1:</strong> {order?.menu1}</p>
      {order?.menu2 && <p><strong>Menu 2:</strong> {order.menu2}</p>}
      <p><strong>E-mail:</strong> {order?.email}</p>
    </div>
  );
}

export default QrView;
