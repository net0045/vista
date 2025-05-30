import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Order.css';

const weekdays = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];

function isOrderingDisabled() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  return (day === 4 && hour >= 21) || day === 5 || day === 6 || (day === 0 && hour < 15);
}

function getUpcomingWeekdays() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  // Zakázané období: čtvrtek 21:00 až neděle 15:00
  const isAfterThursday21 = (day === 4 && hour >= 21) || day === 5 || day === 6 || (day === 0 && hour < 15);
  if (isAfterThursday21) {
    return [{
      label: 'Objednávky jsou nyní uzavřeny. Zkuste to znovu v neděli po 15:00.',
      date: null,
      disabled: true
    }];
  }

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

function Order() {
  const navigate = useNavigate();
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [dates, setDates] = useState([]);
  const [checked, setChecked] = useState(false);
  const orderingDisabled = isOrderingDisabled();

  useEffect(() => {
    setDates(getUpcomingWeekdays());
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

  const handleOrder = () => {
    const selectedDate = document.querySelector('input[name="day"]:checked');
    if (!selectedDate) return alert("Vyberte datum objednávky.");
    if (!value1) return alert("Zadejte aspoň jedno číslo jídla.");

    const email = 'weber.dan@email.cz';
    const dateText = selectedDate.nextSibling.textContent;

    const orderId = Date.now(); // jednoduché unikátní ID


    const newOrder = {
      id: orderId,
      date: dateText,
      menu1: value1,
      menu2: checked ? value2 : null,
      email: email,
    };
    const qrContent = `Objednávka:\nDatum: ${newOrder.date}\nMenu 1: ${newOrder.menu1}\n${newOrder.menu2 ? `Menu 2: ${newOrder.menu2}\n` : ''}E-mail: ${newOrder.email}`;

    newOrder.qrText = `https://ephemeral-kleicha-80352a.netlify.app/qr?id=${orderId}`;

    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    localStorage.setItem('orders', JSON.stringify([...orders, newOrder]));

    alert('Objednávka byla uložena.');
    navigate('/myorders');
  };

  return (
    <>
      <div id='block'>
        <button className='backButton' onClick={() => navigate('/menu')}>ZPĚT / BACK</button>
      </div>

      <div id='page'>
        <p className='nadpis'>Chcete si objednat dvě jídla?<br />Do you want to order two meals?</p>
        <div id='howManyCheck'>
          <input style={{marginLeft: '20px'}} type="checkbox" name='howMany' onChange={(e) => setChecked(e.target.checked)} /> <p style={{fontSize: '18px'}}>Ano / Yes</p>
        </div>

        <p className='nadpis'>Na jaké datum si chcete jídlo objednat?<br />What date would you like to order food for?</p>
        <div id='whatDateRB'>
          {dates.length === 1 && dates[0].disabled ? (
            <p style={{ fontSize: '18px', fontStyle: 'italic', color: 'gray' }}>{dates[0].label}</p>
            ) : (
              dates.map((item, index) => (
                <div key={index} className='rb'>
                  <input type="radio" name='day' />
                  <p style={{ fontSize: '18px' }}>{item.label}</p>
                </div>
              ))
            )}
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

        <button id='orderButton' onClick={handleOrder} disabled={orderingDisabled} style={orderingDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>OBJEDNAT / ORDER</button>
      </div>
    </>
  );
}

export default Order;
