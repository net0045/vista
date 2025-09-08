import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Order.css';
import { getCookie, verifyToken, getSecretKey } from './lib/jwtHandler';
import { createPaymentApiCall } from './api/paymentApi';
import { v4 as uuidv4 } from 'uuid';
import { storeOrder, storeFoodsInOrder, getAllOrdersForUser, getFoodsInOrder, checkUnpaidOrders, } from './api/orderApi';
import { fetchCurrentWeekMenuWithFoods, getCurrentMenuId, getFoodIdByNumberAndMenuID, getPriceOfTheOrder } from './api/foodApi';
import { listSpecialDatesInRange } from './api/adminApi';

const weekdays = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
const dayNameEN = (day) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];

function isOrderingDisabled() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  return (day === 4 && hour >= 21) || day === 5 || day === 6 || (day === 0 && hour < 15);
}

// YYYY-MM-DD
const toYMD = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Pondělí objednacího týdne (So/Ne ⇒ příští pondělí, jinak aktuální pondělí)
function getOrderWeekStart(base = new Date()) {
  const d = new Date(base);
  const day = d.getDay(); // 0=Ne..6=So
  const monday = new Date(d);

  if (day === 6) {          // sobota
    monday.setDate(d.getDate() + 2);
  } else if (day === 0) {   // neděle
    monday.setDate(d.getDate() + 1);
  } else {                  // Po–Pá
    monday.setDate(d.getDate() - ((day + 6) % 7));
  }
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getOrderWeekRange(base = new Date()) {
  const monday = getOrderWeekStart(base);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);
  return { monday, friday };
}

//Functional filter of the upcoming weekdays ->  later use this function in the Order component
function getUpcomingWeekdays() {
  const now = new Date();
  const inputDay = now.getDay(); // 0 = neděle, ..., 6 = sobota
  const inputHour = now.getHours();
  const dates = [];

  if (isOrderingDisabled()) {
    return [];
  }
  let maxDays = 5; // max 5 pracovních dní (po–pá)
  let dayOffset = 1;

  // Snížení počtu dní podle pozdní hodiny
  if (inputHour >= 21) {
    maxDays = maxDays - inputDay - 1;
  } else {
    maxDays = maxDays - inputDay;
  }

  // Pokud je už moc pozdě – omez zobrazené dny
  while (dates.length < maxDays) {
    const future = new Date(now);
    future.setDate(now.getDate() + dayOffset);
    future.setHours(0, 0, 0, 0);
    const day = future.getDay();

    const isTooLate =
      (inputDay === 1 && inputHour >= 21 && day === 2) || // pondělí po 21:00 → vynechat úterý
      (inputDay === 2 && inputHour >= 21 && day === 3) || // úterý po 21:00 → vynechat středu
      (inputDay === 3 && inputHour >= 21 && day === 4) || // středa po 21:00 → vynechat čtvrtek
      (inputDay === 0 && inputHour >= 21 && day === 1);   // neděle po 21:00 → vynechat pondělí

    if (day >= 1 && day <= 5 && !isTooLate) {
      dates.push({
        label: `${weekdays[day]} / ${dayNameEN(day)}: ${future.getDate()}. ${future.getMonth() + 1}. ${future.getFullYear()}`,
        date: future,
      });
    }

    dayOffset++;
  }

  return dates;
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
  const [loading, setLoading] = useState(true);
  const [blockedSet, setBlockedSet] = useState(new Set());

  const [surnameToken, setSurnameToken] = useState('');
  const [emailToken, setEmailToken] = useState('');
  const [user_Id, setUserId] = useState('');
  const [orderingDisabled, setOrderingDisabled] = useState(false);

  const [usedDates, setUsedDates] = useState(new Map());
  const [selectedDate, setSelectedDate] = useState(null);

  const [canOrderTwoMeals, setCanOrderTwoMeals] = useState(true);

  const [showUnpaidModal, setShowUnpaidModal] = useState(false);

  const [priceByMeal, setPriceByMeal] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);

  const formatCzk = (amount) =>
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(amount);



  useEffect(() => {
    (async () => {
      try {

        const { data } = await fetchCurrentWeekMenuWithFoods();
        const map = {};
        (data?.mains || []).forEach((meal, idx) => {
          map[idx + 1] = Number(meal?.cost) || 0; // číslo menu = index + 1
        });
        setPriceByMeal(map);
      } catch (e) {
        console.error('Nešlo načíst ceny menu:', e);
        setPriceByMeal({});
      }
    })();
  }, []);

  // 3) NAČTI BLOKOVANÉ DNY PRO OBJEDNACÍ TÝDEN (Po–Pá)
  useEffect(() => {
    (async () => {
      try {
        const { monday, friday } = getOrderWeekRange(new Date());
        const fromYmd = toYMD(monday);
        const toYmd = toYMD(friday);

        // očekává [{ date: 'YYYY-MM-DD' }, ...]
        const rows = await listSpecialDatesInRange(fromYmd, toYmd);
        const blocked = new Set((rows ?? []).map(r => r.date));
        setBlockedSet(blocked);
      } catch (e) {
        console.error('Nepodařilo se načíst SpecialDates:', e);
        setBlockedSet(new Set());
      }
    })();
  }, []);

  // 4) Pojistka: pokud by byl vybraný blokovaný den, zruš ho
  useEffect(() => {
    if (!selectedDate) return;
    const iso = selectedDate; // ukládáš ISO .toISOString()
    const isBlocked = blockedSet.has(toYMD(new Date(iso)));
    if (isBlocked) setSelectedDate(null);
  }, [blockedSet, selectedDate]);


  useEffect(() => {
    if (!selectedDate) return;
    const label = dates.find(d => d.date.toISOString() === selectedDate)?.label;
    if (!label) return;

    const mealsAlready = usedDates.get(label) || 0;
    setCanOrderTwoMeals(mealsAlready === 0);
    if (mealsAlready >= 1) {
      setChecked(false);
      recomputeTotal(value1, value2, false);
    }
  }, [selectedDate, usedDates]);


  useEffect(() => {
    setDates(getUpcomingWeekdays());
    setOrderingDisabled(isOrderingDisabled()); // dočasně povoleno
    //setOrderingDisabled(false); // povolit objednávky kdykoliv
  }, []);

  useEffect(() => {

    if (!selectedDate) return;

    const label = dates.find(d => d.date.toISOString() === selectedDate)?.label;
    if (!label) return;

    const mealsAlready = usedDates.get(label) || 0;
    setCanOrderTwoMeals(mealsAlready === 0);
    if (mealsAlready >= 1) setChecked(false); // automaticky zruší zaškrtnutí, pokud by tam zůstalo

  }, [selectedDate, usedDates]);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = getCookie('authToken');
        if (!token) return;

        const payload = await verifyToken(token, getSecretKey());
        if (!payload?.email || !payload?.verified || !payload?.userId || !payload?.surname) return;

        setEmailToken(payload.email);
        setUserId(payload.userId);
        setSurnameToken(payload.surname);

        const orders = await getAllOrdersForUser(payload.userId);

        const unpaid = await checkUnpaidOrders(payload.userId);
        setShowUnpaidModal(unpaid);

        const mealsPerDate = new Map();

        for (const order of orders) {
          const foods = await getFoodsInOrder(order.id);
          const count = mealsPerDate.get(order.date) || 0;
          mealsPerDate.set(order.date, count + foods.length);
        }

        setUsedDates(mealsPerDate);
      } catch (err) {
        console.error('Chyba při kontrole tokenu nebo načítání objednávek:', err);
      } finally {
        setLoading(false); // ← tady nastavíš, že je vše hotové
      }
    };

    checkToken();
  }, []);



  const handleChange1 = (e) => {
    const val = e.target.value;
    if (/^[1-5]?$/.test(val)) {
      setValue1(val);
      recomputeTotal(val, value2, checked);
    }
  };

  const handleChange2 = (e) => {
    const val = e.target.value;
    if (/^[1-5]?$/.test(val)) {
      setValue2(val);
      recomputeTotal(value1, val, checked);
    }
  };

  const recomputeTotal = (v1, v2, twoMeals) => {
    const n1 = Number(v1);
    const n2 = Number(v2);
    let total = 0;

    if (priceByMeal[n1]) total += priceByMeal[n1];
    if (twoMeals && priceByMeal[n2]) total += priceByMeal[n2];

    setTotalPrice(total);
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
    const user_surname = surnameToken;

    const newOrder = {
      id: orderId,
      date: dateText,
      dateOfOrder: new Date(),
      userId: user_Id,
      email: user_email,
      surname: user_surname,
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
          { id: uuidv4(), foodId: foodId1, orderId, mealNumber: value1 },
          { id: uuidv4(), foodId: foodId2, orderId, mealNumber: value2 }
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
      const orderPrice = await getPriceOfTheOrder(foodsInOrder); //Předtím tam bylo = 12000

      if (orderPrice === 0) {
        alert('Nastala neočekávaná chyba s hodnotou objednávky. Prosím, zkuste to znovu a případně kontaktujte podporu.');
        navigate('/account');
      }

      // Realex očekává částku v centech – převedeme (např. 170 Kč = 17000)

      // --- Realex HPP platba ---
      try {
        const orderId = `${newOrder.id}`; // unikátní ID objednávky
        //const orderId = `ORD${Date.now()}`; // unikátní ID objednávky
        const res = await createPaymentApiCall(orderId, `${orderPrice}`, 'CZK');
        const data = await res.json();

        // vytvoření formuláře
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "https://pay.sandbox.realexpayments.com/pay";

        const fields = {
          MERCHANT_ID: data.merchantId,
          ACCOUNT: data.account,
          ORDER_ID: data.orderId,
          AMOUNT: data.amount,
          CURRENCY: data.currency,
          TIMESTAMP: data.timestamp,
          SHA1HASH: data.sha1hash,
          AUTO_SETTLE_FLAG: 1,
          COMMENT1: "Vista app objednávka", // volitelné
          MERCHANT_RESPONSE_URL: `${window.location.origin}/.netlify/functions/payment-response`
        };

        Object.entries(fields).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        return; // stop – přesměrování
      } catch (err) {
        console.error("Chyba při přípravě platby:", err);
        alert("Nepodařilo se přesměrovat na platbu.");
      }


    } catch (err) {
      console.error('Chyba při ukládání do databáze:', err);
      alert('Ukládání selhalo. Zkuste to prosím znovu.');
    }
  };

  if (loading) {
    return (
      <div className="loadingSection">
        <p className="loadingText">Vše se připravuje...</p>
        <img src="images/loading.gif" alt="Načítání..." className="loading-img" />
      </div>
    );
  }

  return (
    <>
      <div id='block'>
        <button className='backButton' onClick={() => navigate('/menu')}>ZPĚT / BACK</button>
      </div>

      <div id='page'>
        {showUnpaidModal && (
          <div className="modal-backdrop">
            <div className="modal">
              <p className="modal-text">
                ⚠️<strong> Máš neuhrazenou objednávku. </strong>⚠️<br />
                ID nalezneš na stránce <strong>Moje objednávky</strong>.<br />
                Zajdi prosím vyřešit osobně na recepci.
              </p>
              <button className="modal-button" onClick={() => setShowUnpaidModal(false)}>Zavřít</button>
            </div>
          </div>
        )}
        {orderingDisabled ? (
          <p style={{ fontSize: '18px', color: 'gray', fontStyle: 'italic' }}>
            <br /><br />Objednávky jsou nyní uzavřeny. Zkuste to znovu v neděli po 15:00.<br /><br />
            Orders are currently closed. Try again after Sunday 3 PM.
          </p>
        ) : (
          <>
            <p className='nadpis'>Chcete si objednat dvě jídla?<br /><span style={{ fontStyle: 'italic', fontWeight: 'normal' }}>Do you want to order two meals?</span></p>
            <div id="howManyCheck">
              {selectedDate && !canOrderTwoMeals ? (
                <p style={{ fontSize: '14px', color: 'gray' }}>
                  Na tento den už máte 1 jídlo, můžete objednat jen jedno další. <br />
                  <span style={{ fontStyle: 'italic', fontWeight: 'normal' }}>You already have 1 meal for this day, you can order only one more.</span>
                </p>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    name="howMany"
                    checked={checked}
                    disabled={!canOrderTwoMeals}
                    onChange={(e) => {
                      setChecked(e.target.checked);
                      recomputeTotal(value1, value2, e.target.checked);
                    }}
                  />
                  <span style={{ color: '#f17300ff' }}>Ano / Yes</span>
                </label>
              )}
            </div>


            <p className='nadpis'>Na jaké datum si chcete jídlo objednat?<br /><span style={{ fontStyle: 'italic', fontWeight: 'normal' }}>What date would you like to order food for?</span></p>
            <div id='whatDateRB'>
              {dates.map((item, index) => {
                const mealCount = usedDates.get(item.label) || 0;
                const isUsed = mealCount >= 2;

                const ymd = toYMD(item.date);
                const isBlocked = blockedSet.has(ymd);
                const disabled = isUsed || isBlocked;

                return (
                  <div key={index}>
                    {!disabled ? (
                      <label className='rb'>
                        <input
                          type="radio"
                          name="day"
                          value={item.date.toISOString()}               // ⬅️ přidané
                          onChange={() => setSelectedDate(item.date.toISOString())}
                          style={{ margin: 0 }}
                        />
                        <p style={{ fontSize: '18px', color: '#f17300ff', margin: 0 }}>{item.label}</p>
                      </label>
                    ) : (
                      <div className='rb' style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <p style={{ fontSize: '18px', color: 'gray', margin: 0 }}>{item.label}</p>
                        <p style={{ color: 'red', fontSize: '15px', marginTop: '4px' }}>
                          {isBlocked
                            ? <>Tento den je zablokován (speciální den).<br /><span style={{ fontStyle: 'italic', fontWeight: 'normal' }}>This day is blocked (special day).</span></>
                            : <>Na tento den už máte 2 jídla.<br /><span style={{ fontStyle: 'italic', fontWeight: 'normal' }}>You already have 2 meals for this day.</span></>
                          }
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div id='whatMeal'>
              <div className='whatMenu'>
                <p className='nadpis'>Jídlo číslo 1 <br /> <span style={{ fontStyle: 'italic', fontWeight: 'normal' }}>Meal number 1</span></p>
                <input type="text" inputMode="numeric" value={value1} onChange={handleChange1} required />
              </div>

              <div className={`second-meal-container ${checked ? 'show' : ''}`}>
                <div className='whatMenu'>
                  <p className='nadpis'>Jídlo číslo 2 <br /><span style={{ fontStyle: 'italic', fontWeight: 'normal' }}>Meal number 2</span></p>
                  <input type="text" inputMode="numeric" value={value2} onChange={handleChange2} required />
                </div>
              </div>
            </div>

            <p className='nadpis' style={{ marginTop: '30px' }}>Cena / Price: <strong>{formatCzk(totalPrice)}</strong></p>

            <button id='orderButton' onClick={handleOrder}>OBJEDNAT / ORDER</button>
          </>
        )}
      </div>
    </>
  );
}

export default Order;
