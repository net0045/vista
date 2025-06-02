import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Order.css';
import { getCookie, verifyToken, getSecretKey } from './lib/jwtHandler';
import { v4 as uuidv4 } from 'uuid';
import { storeOrder, storeFoodsInOrder, getAllOrdersForUser, getFoodsInOrder } from './api/orderApi';
import { getCurrentMenuId, getFoodIdByNumberAndMenuID } from './api/foodApi';

const weekdays = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];

function isOrderingDisabled() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  return (day === 4 && hour >= 21) || day === 5 || (day === 0 && hour < 15);
}

function getUpcomingWeekdays() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  // Normální výpočet pracovních dnů
  const dates = [];
  let start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (hour >= 21) {
    start.setDate(start.getDate() + 1);
  }

  if (start.getDay() === 6 || start.getDay() === 0) {
    const offset = 8 - start.getDay(); // pondělí
    start.setDate(start.getDate() + offset);
  } else {
    start.setDate(start.getDate() + 1);
  }

  while (start.getDay() >= 1 && start.getDay() <= 5) {
    const dayName = weekdays[start.getDay()];
    const enName = dayNameEN(start.getDay());
    const day = start.getDate();
    const month = start.getMonth() + 1;
    const year = start.getFullYear();

    dates.push({
      label: `${dayName} / ${enName}: ${day}. ${month}. ${year}`,
      date: new Date(start),
    });

    start.setDate(start.getDate() + 1);
  }

  return dates;
}

function dayNameEN(index) {
  const en = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return en[index];
}

async function storeDataToDatabase(order, foodsInOrder) {
  const successOrderStorage = await storeOrder(order);
  if (!successOrderStorage) {
    throw new Error('Chyba při ukládání objednávky.');
  }

  const successFoodsStorage = await storeFoodsInOrder(foodsInOrder);
  if (!successFoodsStorage) {
    throw new Error('Chyba při ukládání jídel v objednávce.');
  }
}

function Order() {
  const navigate = useNavigate();
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [dates, setDates] = useState([]);
  const [checked, setChecked] = useState(false);

  const [emailToken, setEmailToken] = useState('');
  const [user_Id, setUserId] = useState('');
  const [orderingDisabled, setOrderingDisabled] = useState(false);

  const [usedDates, setUsedDates] = useState(new Map());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    setDates(getUpcomingWeekdays());
    setOrderingDisabled(isOrderingDisabled());
  }, []);

  // Kontrola tokenu při načtení
  useEffect(() => {
    const checkToken = async () => {
      const token = getCookie('authToken');
      if (!token) return;

      const payload = await verifyToken(token, getSecretKey());
      if (!payload?.email || !payload?.verified || !payload?.userId) return;

      setEmailToken(payload.email);
      setUserId(payload.userId);

      const orders = await getAllOrdersForUser(payload.userId);

      const mealsPerDate = new Map();

      for (const order of orders) {
        const foods = await getFoodsInOrder(order.id);
        const count = mealsPerDate.get(order.date) || 0;
        mealsPerDate.set(order.date, count + foods.length);
      }

      setUsedDates(mealsPerDate); // např. Map { 'Úterý...': 2, 'Pátek...': 1 }
    };

    checkToken();
  }, []);


  const handleChange1 = (e) => {
    const val = e.target.value;
    if (/^[1-5]?$/.test(val)) {
      setValue1(val);
    }
  };

  const handleChange2 = (e) => {
    const val = e.target.value;
    if (/^[1-5]?$/.test(val)) {
      setValue2(val);
    }
  };

  const handleOrder = async () => {
    const selectedDate = document.querySelector('input[name="day"]:checked');
    if (!selectedDate) return alert("Vyberte datum objednávky.");
    if (!value1) return alert("Zadejte číslo prvního jídla.");
    if (checked && !value2) {
      return alert("Zadejte číslo druhého jídla.");
    }

    const user_email = emailToken;
    const dateText = selectedDate.nextSibling.textContent;
    const orderId = uuidv4();

    const newOrder = {
      id: orderId,
      date: dateText,
      dateOfOrder: new Date(),
      userId: user_Id,
      email: user_email,
      ispaid: false,
      qrText: `${window.location.origin}/qr?id=${orderId}`
    };


    const menuId = await getCurrentMenuId();
    if (!menuId) {
      console.error('Aktuální menu nebylo nalezeno.');
      return alert('Menu nebylo nalezeno.');
    }


    const foodsInOrder = [];

    if (checked) {
      const foodId1 = await getFoodIdByNumberAndMenuID(value1, menuId);
      const foodId2 = await getFoodIdByNumberAndMenuID(value2, menuId);

      if (foodId1 && foodId2) {
        foodsInOrder.push(
          {
            id: uuidv4(),
            foodId: foodId1,
            orderId,
            mealNumber: value1,
          },
          {
            id: uuidv4(),
            foodId: foodId2,
            orderId,
            mealNumber: value2,
          }
        );
      } else {
        return alert('Nepodařilo se načíst jídla podle menu.');
      }
    } else {
      const foodId1 = await getFoodIdByNumberAndMenuID(value1, menuId);
      if (foodId1) {
        foodsInOrder.push({
          id: uuidv4(),
          foodId: foodId1,
          orderId,
          mealNumber: value1,
        });
      } else {
        return alert('Nepodařilo se najít vybrané jídlo.');
      }
    }

    try {
      await storeDataToDatabase(newOrder, foodsInOrder);

      //záznam pro QrView
      const qrViewOrder = {
        id: newOrder.id,
        date: newOrder.date,
        menu1: value1,
        menu2: checked ? value2 : null,
        email: newOrder.email,
      };

      // QR info (pro případné vykreslení QR obsahu i odkazu)
      const qrContent =
        `Objednávka:\nDatum: ${newOrder.date}\n` +
        foodsInOrder.map((item, index) => `Menu ${index + 1}: ${item.mealNumber}\n`).join('') +
        `E-mail: ${newOrder.email}`;

      qrViewOrder.qrContent = qrContent;
      const orders = JSON.parse(localStorage.getItem('orders')) || [];
      localStorage.setItem('orders', JSON.stringify([...orders, qrViewOrder]));

      alert('Objednávka byla uložena.');
      navigate('/myorders');
    } catch (err) {
      console.error('Chyba při ukládání do databáze:', err);
      alert('Ukládání selhalo. Zkuste to prosím znovu.');
    }
  };

  return (
    <>
      <div id='block'>
        <button className='backButton' onClick={() => navigate('/menu')}>ZPĚT / BACK</button>
      </div>

      <div id='page'>
        {orderingDisabled ? (
          <p style={{ fontSize: '18px', color: 'gray', fontStyle: 'italic' }}>
            <br /><br />Objednávky jsou nyní uzavřeny. Zkuste to znovu v neděli po 15:00.<br /><br />
            Orders are currently closed. Try again after Sunday 3 PM.
          </p>
        ) : (
          <>
            <p className='nadpis'>Chcete si objednat dvě jídla?<br />Do you want to order two meals?</p>
            <div id="howManyCheck">
              {usedDates.get(dates.find(d => d.date.toISOString() === selectedDate)?.label) >= 1 ? (
                <p style={{ fontSize: '14px', color: 'gray' }}>
                  Na tento den už máte 1 jídlo, můžete objednat jen jedno další.
                </p>
              ) : (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      name="howMany"
                      onChange={(e) => setChecked(e.target.checked)}
                    />
                    <span style={{ color: '#f17300ff' }}>Ano / Yes</span>
                  </label>
                </>
              )}
            </div>


            <p className='nadpis'>Na jaké datum si chcete jídlo objednat?<br />What date would you like to order food for?</p>
            <div id='whatDateRB'>
              {dates.map((item, index) => {
                const mealCount = usedDates.get(item.label) || 0;
                const isUsed = mealCount >= 2;

                return (
                  <div key={index} className='rb'>
                    {!isUsed ? (
                      <>
                        <input type="radio" name="day" onChange={() => setSelectedDate(item.date.toISOString())}/>
                        <div>
                          <p style={{ fontSize: '18px', color: '#f17300ff', margin: 0 }}>{item.label}</p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <p style={{ fontSize: '18px', color: 'gray', margin: 0 }}>{item.label}</p>
                        <p style={{ color: 'red', fontSize: '15px', marginTop: '4px' }}>Na tento den už máte 2 jídla</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div id='whatMeal'>
              <div className='whatMenu'>
                <p className='nadpis'>Jídlo číslo 1 <br />Meal number 1</p>
                <input type="text" inputMode="numeric" value={value1} onChange={handleChange1} required />
              </div>

              {checked === true && (
                <div className='whatMenu'>
                  <p className='nadpis'>Jídlo číslo 2 <br />Meal number 2</p>
                  <input type="text" inputMode="numeric" value={value2} onChange={handleChange2} required />
                </div>
              )}
            </div>

            <button id='orderButton' onClick={handleOrder}>OBJEDNAT / ORDER</button>
          </>
        )}
      </div>
    </>
  );
}

export default Order;
