import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import './Order.css'; 
import { useNavigate } from 'react-router-dom'

const weekdays = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];

function getUpcomingWeekdays() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = neděle, 1 = pondělí, ..., 6 = sobota
  const dates = [];

  let start = new Date(today);
  start.setHours(0, 0, 0, 0);

  //Pokud je 21:00, tak odstraňujeme možnost objednat hned na další den
  const currentTime = today.getHours();
  if (currentTime >= 21) {
    start.setDate(today.getDate() + 1); 
  }

  if (dayOfWeek === 6 || dayOfWeek === 0) {
    // Sobota nebo neděle → začneme od pondělí příštího týdne
    const offset = 8 - dayOfWeek;
    start.setDate(start.getDate() + offset);
  } else {
    // Jinak začni od zítřka
    start.setDate(start.getDate() + 1);
  }

  while (start.getDay() >= 1 && start.getDay() <= 5) { // pondělí až pátek
    const dayName = weekdays[start.getDay()];
    const enName = dayNameEN(start.getDay());
    const day = start.getDate();
    const month = start.getMonth() + 1;
    const year = start.getFullYear();

    dates.push({
      label: `${dayName} / ${enName}: ${day}. ${month}. ${year}`,
      date: new Date(start),
    });

    // Další den
    start.setDate(start.getDate() + 1);
  }

  return dates;
}

function dayNameEN(index) {
  const en = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return en[index];
}


//funkce ORDER a vzhled stránky
function Order() {

  const navigate = useNavigate();

  const navigateToMenu = async () => {
    navigate('/menu');
  }

  //proměnné uchovávající číslo objednaného jídla
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');

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

  const [dates, setDates] = useState([]);

  useEffect(() => {
    setDates(getUpcomingWeekdays());
  }, []);

  //checkBox na rozhodnutí jestli chce uživatel jedno nebo dvě jídla
  const [checked, setChecked] = useState(false);    
    
    return (
      <>
        <div id='block'>
          <button className='backButton' onClick={navigateToMenu}>ZPĚT / BACK</button>
        </div>

        <div id='page'>
          <p className='nadpis'>Chcete si objednat dvě jídla?<br />Do you want to order two meals?</p>
          <div id='howManyCheck'>
            <input style={{marginLeft: '20px'}} type="checkbox" name='howMany' onChange={(e) => setChecked(e.target.checked)}/> <p style={{fontSize: '18px'}}>Ano / Yes</p>
          </div>

          <p className='nadpis'>Na jaké datum si chcete jídlo objednat?<br />What date would you like to order food for?</p>
          <div id='whatDateRB'>
            {dates.map((item, index) => (
            <div key={index} className='rb'>
              <input type="radio" name='day' />
              <p style={{ fontSize: '18px' }}>{item.label}</p>
            </div>))}
          </div>

          <div id='whatMeal'>
            <div className='whatMenu'>
              <p className='nadpis'>Jídlo číslo 1 <br />Meal number 1</p>
              <input type="text" inputMode="numeric" value={value1} onChange={handleChange1} required/>
            </div>

            {checked === true && (
              <div className='whatMenu'>
                <p className='nadpis'>Jídlo číslo 2 <br />Meal number 2</p>
                <input type="text" inputMode="numeric" value={value2} onChange={handleChange2} required/>
              </div>
            )}
          </div>
          
          <button id='orderButton'>OBJEDNAT / ORDER</button>



        </div>
      </>
    );
}

export default Order;