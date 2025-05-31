import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import './Menu.css'
import { useNavigate } from 'react-router-dom'
import { getCookie, verifyToken, getSecretKey } from './lib/jwtHandler';
import { fetchMenuWithFoods } from './api/foodApi'; 

function formatDateCz(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

function Menu() {
  const navigate = useNavigate();

  const navigateBackToAccount = () => navigate('/account');
  const navigateToOrder = () => navigate('/order');

  const [tokenOk, setTokenOk] = useState(false);
  const [data, setData] = useState({ mains: [], soups: [] });
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

 useEffect(() => {
    const checkToken = async () => {
      const token = getCookie('authToken');
      if (!token) return;

      const payload = await verifyToken(token, getSecretKey());
      if (payload?.email && payload.verified === true && payload.isPassword) {
        setTokenOk(true);
      }
    };

    checkToken();
  }, []);

  useEffect(() => {
  const loadMenu = async () => {
    try {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = neděle
      const currentHour = now.getHours();

      let baseDate = new Date(now);
      
      // Pokud je neděle a čas >= 15:00 → příští týden
      if (currentDay === 0 && currentHour >= 15) {
        baseDate.setDate(baseDate.getDate() + 1); // posuň na pondělí příštího týdne
      }

      // Zjisti pondělí daného týdne
      const day = baseDate.getDay(); // 0 = neděle, 1 = pondělí, ...
      const monday = new Date(baseDate);
      monday.setDate(baseDate.getDate() - ((day + 6) % 7)); // posun na pondělí

      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4); // posun na pátek

      const from = monday.toISOString().split('T')[0];
      const to = friday.toISOString().split('T')[0];

      const { data } = await fetchMenuWithFoods();
      setDateRange({ from, to });
      setData(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  loadMenu();
}, []);

  return (
    <>
      <div id='menu'>
        {tokenOk && (
          <>
            <button className='button' onClick={navigateBackToAccount}>
              ZPĚT / BACK
            </button>
            <button className='button' onClick={navigateToOrder}>
              OBJEDNAT / ORDER
            </button>
          </>
        )}
      </div>

      <div id='dateAndTime'>
        <p className='dateTimeText'>
          {formatDateCz(dateRange.from)} - {formatDateCz(dateRange.to)}
        </p>
        <p className='dateTimeText'>|</p>
        <p className='dateTimeText'>11:00 - 14:00 a 17:00 - 19:00</p>
      </div>

      <p id='info'>Kterékoliv z jídel lze objednat každý den v průběhu týdne. Uvedená cena obsahuje polévku dle denní nabídky.<br/>Any of these meals can be ordered everyday during the week. Mentioned prices include the soup of the day.</p>

      <p className='nadpis'>Hlavní chody / Main courses</p>
      <div className='mainCourses'>
        {data.mains.map((meal, index) => (
          <div className={`option ${index === data.mains.length - 1 ? 'lastOption' : ''}`} key={meal.id}>
            <p className='number'>{index + 1}.</p>
            <div className='meal'>
              <p className='mealDescription'>{meal.item}</p>
            </div>
            <p className='price'>{meal.cost}Kč</p>
          </div>
        ))}
      </div>

      <p className='nadpis'>Polévky / Soups</p>
      <div className='soups'>
        {data.soups.map((soup, index) => (
          <div className={`soupOption ${index === data.soups.length - 1 ? 'lastOption' : ''}`} key={soup.id}>
            <p className='soupDay'>
              {['Pondělí / Monday', 'Úterý / Tuesday', 'Středa / Wednesday', 'Čtvrtek / Thursday', 'Pátek / Friday'][index] || 'Další den'}
            </p>
            <p className='soupDescription'>{soup.item}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export default Menu;