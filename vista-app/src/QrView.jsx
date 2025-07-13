import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getOrderById, getFoodsInOrder, updateFoodPickedToTrue} from './api/orderApi';
import { getUserById} from './api/userApi';
import './QrView.css';

function QrView() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const orderIdURL = query.get('id');

  const [status, setStatus] = useState('loading');
  const [order, setOrder] = useState(null);
  const [user, setUser] = useState(null);
  const [pickedMenus, setPickedMenus] = useState({ menu1: false, menu2: false });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderData = await getOrderById(orderIdURL);
        const foods = await getFoodsInOrder(orderIdURL);
        const userData = await getUserById(orderData?.userId);
        setUser(userData);

        if (!orderData) {
          setStatus('notfound');
          return;
        } 
        
        if(foods.length === 0) {
          setStatus('used');
          return;
        }
        
        const combinedOrder = {
          ...orderData,
          foods,
        };

        setOrder(combinedOrder);

        if (foods.length === 2) {
          const picked1 = foods[0]?.picked || false;
          const picked2 = foods[1]?.picked || false;
          const allPicked =  picked1 && picked2;
          setPickedMenus({ menu1: picked1, menu2: picked2 });
          setStatus(allPicked ? 'used' : 'valid');
        }
        else {
          const picked1 = foods[0]?.picked || false;
          setPickedMenus({ menu1: picked1 });
          setStatus(picked1 ? 'used' : 'valid');
          
        }       

      } catch (error) {
        console.error('Chyba při načítání objednávky:', error);
        setStatus('notfound');
      }
    };

    if (orderIdURL) fetchOrder();
  }, [orderIdURL]);

  useEffect(() => {
    if (status === 'valid') {
      const audio = new Audio('/success.mp3');
      audio.play().catch(e => {
        console.warn('Nepodařilo se přehrát zvuk:', e);
      });
    }
  }, [status]);

  const handleCheckboxChange = async (menuKey) => {
  // Zjisti index jídla (menu1 = 0, menu2 = 1)
  const index = menuKey === 'menu1' ? 0 : 1;
  const foodInOrder = order.foods[index];
  if (!foodInOrder) return;

  try {
    // Aktualizuj v databázi
    await updateFoodPickedToTrue(foodInOrder.id);

    // Aktualizuj lokální stav
    const updated = { ...pickedMenus, [menuKey]: true };
    setPickedMenus(updated);

    const allPicked = order.foods.length === 1
      ? updated.menu1
      : updated.menu1 && updated.menu2;

    if (allPicked) {
      setStatus('used');
    }
  } catch (err) {
    console.error('Chyba při aktualizaci jídla:', err);
  }
};

  if (status === 'loading') return null;

  if (status === 'notfound') {
    return (
      <div className="qrCard">
        <h2>Objednávka nenalezena</h2>
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
          <p><strong>Menu {order?.foods[0].mealNumber}:</strong></p>
          <label>
            <input
              type="checkbox"
              onChange={() => handleCheckboxChange('menu1')}
            />
            Vyzvednuto
          </label>
        </div>
      )}

      {!pickedMenus.menu2 && order?.foods[1] && (
        <div className="menuSection">
          <p><strong>Menu {order?.foods[1].mealNumber}:</strong></p>
          <label>
            <input
              type="checkbox"
              onChange={() => handleCheckboxChange('menu2')}
            />
            Vyzvednuto
          </label>
        </div>
      )}
      <p><strong>Jméno:</strong> {user.surname}</p>
      <p><strong>Email:</strong> {user.email}</p>

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
