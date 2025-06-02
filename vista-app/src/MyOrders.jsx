import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import './MyOrders.css';
import { useNavigate } from 'react-router-dom';
import { getCookie, verifyToken, getSecretKey } from './lib/jwtHandler';
import { getAllOrdersForUser, getFoodsInOrder } from './api/orderApi';

function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchData = async () => {
    try {
      const token = getCookie('authToken');
      if (!token) return;

      const payload = await verifyToken(token, getSecretKey());
      if (!payload?.userId || !payload?.email) return;

      setEmail(payload.email);

      const realOrders = await getAllOrdersForUser(payload.userId); //TODO PAK ZMĚNIT NA ZAPLACENÉ OBJEDNÁVKY

      const ordersWithFoods = await Promise.all(
        realOrders.map(async (order) => {
          const foods = await getFoodsInOrder(order.id);
          return { ...order, foods };
        })
      );

      setOrders(ordersWithFoods);
    } catch (err) {
      console.error('Chyba při načítání objednávek:', err);
    } finally {
      setLoading(false); // 🟢 načítání dokončeno
    }
  };

  fetchData();
}, []);

  return (
    <>
      <div id='myOrders'>
        <div id='back'>
          <button id='backButton' onClick={() => navigate('/account')}>ZPĚT / BACK</button>
          <p id='email'>{email}</p>
        </div>
        <br />
        <div id='orders'>
          <p id='warningText'>
            NEZAŠKRTÁVEJTE VYZVEDNUTO!<br />
            Přišli byste tím o objednávku<br /><br />
            DO NOT CHECK "VYZVEDNUTO"!<br />
            You would lose your order.
          </p>

          {loading ? (
            <div className="loadingSection">
              <p className='loadingText'>Načítám objednávky...</p>
              <img src="images/loading.gif" alt="Načítání..." className="loading-img" />
            </div>
          ) : orders.length === 0 ? (
            <div className="emptySection">
              <p className='emptyText'>Asi nemáš hlad, bo tu nic nemáš</p>
              <p className='emptyText'>Zkus zčekovat týdenní meníčko, třeba si vybereš nějakej gáblik</p>
              <button id='menuButton' onClick={() => navigate('/menu')}>MENU</button>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className='order'>
                <QRCodeCanvas
                  className='qrCode'
                  value={`${window.location.origin}/qr?id=${order.id}`}
                  size={160}
                  level="H"
                />
                <div className='orderInfo'>
                  <p className='orderTitle'>Objednávka:</p>
                  <p className='orderDate'>
                    <span className='highlight'>Datum: </span>{order.date}
                  </p>
                  {order.foods.map((food, idx) => (
                    <p key={idx} className='orderMeal'>
                      <span className='highlight'>Menu {idx + 1}: {food.mealNumber}</span>
                    </p>
                  ))}
                  <p className='orderEmail'>
                    <span className='highlight'>E-mail: </span>{email}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default MyOrders;