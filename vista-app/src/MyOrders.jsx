import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import './MyOrders.css';
import { useNavigate } from 'react-router-dom';
import { getCookie, verifyToken, getSecretKey } from './lib/jwtHandler';
import { getPaidOrdersForUser, getFoodsInOrder, checkUnpaidOrders, listUnpaidOrders } from './api/orderApi';

function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasUnpaidOrder, setHasUnpaidOrder] = useState(false);
  const [showUnpaidOrders, setShowUnpaidOrders] = useState(false);
  const [showUnpaidModal, setShowUnpaidModal] = useState(false);


  const [totalSpent, setTotalSpent] = useState(0);

  const getFoodCost = (food) =>
    Number((food?.food && food.food.cost != null ? food.food.cost : food?.cost) || 0);

  const formatCzk = (amount) =>
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(amount);

  useEffect(() => {
  const fetchData = async () => {
    try {
      const token = getCookie('authToken');
      if (!token) return;

      const payload = await verifyToken(token, getSecretKey());
      if (!payload?.userId || !payload?.email) return;

      setEmail(payload.email);

      // 1) flag + modal na nezaplacené
      const unpaidFlag = await checkUnpaidOrders(payload.userId);
      setHasUnpaidOrder(unpaidFlag);
      setShowUnpaidModal(unpaidFlag);

      // 2) ZAPLACENÉ objednávky + jejich jídla
      const paidOrders = await getPaidOrdersForUser(payload.userId);
      const ordersWithFoods = await Promise.all(
        paidOrders.map(async (order) => {
          const foods = await getFoodsInOrder(order.id);
          return { ...order, foods };
        })
      );
      setOrders(ordersWithFoods);

      // 3) NEZAPLACENÉ objednávky – seznam + jejich jídla
      const unpaidList = await listUnpaidOrders(payload.userId);
      const unpaidWithFoods = await Promise.all(
        (unpaidList || []).map(async (order) => {
          const foods = await getFoodsInOrder(order.id);
          return { ...order, foods };
        })
      );
      setUnpaidOrders(unpaidWithFoods);

      // 4) Celková částka = zaplacené + nezaplacené
      const totalPaid = ordersWithFoods.reduce(
        (sum, o) => sum + (o.foods || []).reduce((s, f) => s + getFoodCost(f), 0),
        0
      );
      setTotalSpent(totalPaid);
    } catch (err) {
      console.error('Chyba při načítání objednávek:', err);
    } finally {
      setLoading(false);
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
          {showUnpaidModal && (
            <div className="modal-backdrop">
              <div className="modal">
                <p className="modal-text">
                  ⚠️ Máš neuhrazenou objednávku. ⚠️<br />
                  Zajdi prosím vyřešit <strong>osobně na recepci</strong>.
                </p>
                <button className="modal-button" onClick={() => setShowUnpaidModal(false)}>Zavřít</button>
              </div>
            </div>
          )}
          {hasUnpaidOrder && (
            <div className="unpaid-alert">
              <p>
                ⚠️ <strong>Neuhrazené objednávky</strong> ⚠️ <br />
                Zajdi prosím zaplatit/zrušit objednávku osobně na <strong>recepci</strong>.
              </p>

              <button
                className="toggle-orders-button"
                onClick={() => setShowUnpaidOrders(prev => !prev)}
              >
                {showUnpaidOrders ? 'Skrýt objednávky' : 'Zobrazit objednávky'}
              </button>

              {showUnpaidOrders && (
                <div className="unpaid-orders-list">
                  {unpaidOrders.map((order) => (
                    <div key={order.id} className="unpaid-order-item">
                      <p><strong>ID:</strong> {order.id}</p>
                      <p><strong>Den:</strong> {order.date}</p>
                      <p><strong>Datum vytvoření:</strong> {new Date(order.dateOfOrder).toLocaleString('cs-CZ')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <p>Celkem za tento týden: <br /><strong>{formatCzk(totalSpent)}</strong></p>

          <p id='warningText'>
            NEZAŠKRTÁVEJTE VYZVEDNUTO!<br />
            Přišli byste tím o objednávku.<br /><br />
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
              <p className='emptyText'>Nemáš zaplacené žádné objednávky.</p>
              <p className='emptyText'>Zkontroluj týdenní menu a vyber si gáblik.</p>
              <button id='menuButton' onClick={() => navigate('/menu')}><b>MENU</b></button>
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
                  <p className='orderTitle'>ID objednávky: {order.id}</p>
                  <p className='orderDate'>
                    <span className='highlight'>Datum: </span>{order.date}
                  </p>
                  {order.foods.map((food, idx) => (
                    <p key={idx} className='orderMeal'>
                      <span className='highlight'>{idx + 1}.Menu: {food.mealNumber}</span>
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
