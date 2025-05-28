import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import './MyOrders.css';
import { useNavigate } from 'react-router-dom';

function extractLine(text, lineNumber) {
  const lines = text.split('\n');
  return lines[lineNumber] || '';
}

function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("orders")) || [];
    setOrders(stored);
  }, []);

  return (
    <>
      <div id='myOrders'>
        <div id='back'>
          <button id='backButton' onClick={() => navigate('/account')}>ZPĚT / BACK</button>
          <p id='email'>weber.dan@email.cz</p>
        </div>
        <br />
        <div id='orders'>
          <p id='warningText'>QR KÓD LZE NASKENOVAT POUZE JEDNOU!<br/>(Ochrana proti zneužití)</p>
          {orders.length === 0 ? (
            <div className="emptySection">
              <p className='emptyText'>Asi nemáš hlad, bo tu nic nemáš</p>
              <p className='emptyText'>Zkus zčekovat týdenní meníčko, třeba si vybereš nějakej gábl</p>
              <button id='menuButton' onClick={() => navigate('/menu')}>MENU</button>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className='order'>
                <QRCodeCanvas className='qrCode' value={order.qrText} size={160} level="H" />
                <div className='orderInfo'>
                  <p className='orderTitle'>Objednávka:</p>
                  <p className='orderDate'>Datum: <span className='highlight'>{order.date}</span></p>
                  <p className='orderMeal'>Menu 1: <span className='highlight'>{order.menu1}</span></p>
                  {order.menu2 && (
                    <p className='orderMeal'>Menu 2: <span className='highlight'>{order.menu2}</span></p>
                  )}
                  <p className='orderEmail'>E-mail: <span className='highlight'>{order.email}</span></p>
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
