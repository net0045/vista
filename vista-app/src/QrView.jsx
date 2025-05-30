import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './QrView.css';

function QrView() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const id = query.get('id');

  const [status, setStatus] = useState('loading');
  const [order, setOrder] = useState(null);
  const [pickedMenus, setPickedMenus] = useState({ menu1: false, menu2: false });

  const menu1Key = `picked-${id}-menu1`;
  const menu2Key = `picked-${id}-menu2`;

  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const found = orders.find(o => o.id.toString() === id);

    if (!found) {
      setStatus('notfound');
      return;
    }

    setOrder(found);

    const picked1 = localStorage.getItem(menu1Key) === 'true';
    const picked2 = localStorage.getItem(menu2Key) === 'true';

    setPickedMenus({ menu1: picked1, menu2: picked2 });

    const allPicked = !found.menu2 ? picked1 : picked1 && picked2;
    setStatus(allPicked ? 'used' : 'valid');
  }, [id]);

  useEffect(() => {
    if (status === 'valid') {
      const audio = new Audio('/success.mp3');
      audio.play().catch(e => {
        console.warn('Nepodařilo se přehrát zvuk:', e);
      });
    }
  }, [status]);

  const handleCheckboxChange = (menuKey) => {
    const updated = { ...pickedMenus, [menuKey]: true };
    localStorage.setItem(`picked-${id}-${menuKey}`, 'true');
    setPickedMenus(updated);

    const allPicked = !order?.menu2 ? updated.menu1 : updated.menu1 && updated.menu2;
    if (allPicked) {
      setStatus('used');
    }
  };

  if (status === 'loading') return null;

  if (status === 'notfound') {
    return (
      <div className="qrCard">
        <h2>Order not found</h2>
        <img src="/images/nuh.png" alt="Confirmed" className="orderImage" />
        <p>Zkuste QR kód naskenovat znovu.</p>
      </div>
    );
  }

  if (status === 'used') {
    return (
      <div className="qrCard">
        <h2>✅ Objednávka byla již vyzvednuta</h2>
        <img src="/images/collected.png" alt="Confirmed" className="orderImage" />
        <p><strong>Date:</strong> {order?.date}</p>
      </div>
    );
  }

  return (
    <div className="qrCard">
      <h2>✅ Potvrzení objednávky</h2>
      <img src="/images/success.png" alt="Confirmed" className="orderImage" />
      <p><strong>Date:</strong> {order?.date}</p>

      {!pickedMenus.menu1 && (
        <div className="menuSection">
          <p><strong>{order?.menu1}</strong></p>
          <label>
            <input
              type="checkbox"
              onChange={() => handleCheckboxChange('menu1')}
            />
            Vyzvednuto
          </label>
        </div>
      )}

      {!pickedMenus.menu2 && order?.menu2 && (
        <div className="menuSection">
          <p><strong>{order?.menu2}</strong></p>
          <label>
            <input
              type="checkbox"
              onChange={() => handleCheckboxChange('menu2')}
            />
            Vyzvednuto
          </label>
        </div>
      )}

      <p><strong>Email:</strong> {order?.email}</p>

      <div className="rainContainer">
        {Array.from({ length: 20 }).map((_, i) => (
          <img
            key={i}
            src="/images/approved.png"
            alt=""
            className="rainDrop"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default QrView;
