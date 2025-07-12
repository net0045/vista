import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import './QrView.css';

function QrView() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const id = query.get('id');

  const [status, setStatus] = useState('loading');
  const [order, setOrder] = useState(null);
  const [pickedMenus, setPickedMenus] = useState({ menu1: false, menu2: false });

  useEffect(() => {
    const fetchOrder = async () => {
      // Načti objednávku z databáze podle ID
      const { data, error } = await supabase
        .from('Orders') // <- Změň na svůj název tabulky
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Chyba při načítání objednávky:', error);
        setStatus('notfound');
        return;
      }

      setOrder(data);

      const allPicked = data.menu2 ? data.picked_menu1 && data.picked_menu2 : data.picked_menu1;
      setPickedMenus({
        menu1: data.picked_menu1,
        menu2: data.picked_menu2,
      });
      setStatus(allPicked ? 'used' : 'valid');
    };

    fetchOrder();
  }, [id]);

  const handleCheckboxChange = async (menuKey) => {
    const updated = { ...pickedMenus, [menuKey]: true };

    // Ulož do databáze, že bylo vyzvednuto
    const { error } = await supabase
      .from('Orders')
      .update({
        [`picked_${menuKey}`]: true,
      })
      .eq('id', id);

    if (error) {
      console.error('Chyba při aktualizaci:', error);
      return;
    }

    setPickedMenus(updated);

    const allPicked = order?.menu2 ? updated.menu1 && updated.menu2 : updated.menu1;
    if (allPicked) {
      setStatus('used');
    }
  };

  if (status === 'loading') return null;

  if (status === 'notfound') {
    return (
      <div className="qrCard">
        <h2>Objednávka nenalezena</h2>
        <img src="/images/nuh.png" alt="Nenalezeno" className="orderImage" />
        <p>Zkuste QR kód naskenovat znovu.</p>
      </div>
    );
  }

  if (status === 'used') {
    return (
      <div className="qrCard">
        <h2>✅ Objednávka byla již vyzvednuta</h2>
        <p><strong>--------{order?.surname}--------</strong></p>
        <img src="/images/collected.png" alt="Potvrzeno" className="orderImage" />
        <p><strong>Date:</strong> {order?.date}</p>
        <p><strong>Email:</strong> {order?.email}</p>
      </div>
    );
  }

  return (
    <div className="qrCard">
      <h2>✅ Potvrzení objednávky</h2>
      <p><strong>--------{order?.surname}--------</strong></p>
      <img src="/images/success.png" alt="Potvrzeno" className="orderImage" />
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
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default QrView;
