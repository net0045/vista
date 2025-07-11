import { useEffect, useState } from 'react'
import './Menu.css'
import { useNavigate } from 'react-router-dom'
import { getCookie, verifyToken, getSecretKey } from './lib/jwtHandler';
import { fetchCurrentWeekMenuWithFoods, fetchAllergens } from './api/foodApi'; 

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
  const [allergens, setAllergens] = useState([]);
  const [loading, setLoading] = useState(true);

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
        const currentDay = now.getDay();
        const currentHour = now.getHours();

        let baseDate = new Date(now);

        if (currentDay === 0 && currentHour >= 15) {
          baseDate.setDate(baseDate.getDate() + 1);
        }

        const day = baseDate.getDay();
        const monday = new Date(baseDate);
        monday.setDate(baseDate.getDate() - ((day + 6) % 7));
        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);

        const from = monday.toISOString().split('T')[0];
        const to = friday.toISOString().split('T')[0];

        const { data } = await fetchCurrentWeekMenuWithFoods();
        const allergensData = await fetchAllergens();

        setDateRange({ from, to });
        setData(data);
        setAllergens(allergensData);
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false); 
      }
    };

    loadMenu();
  }, []);

  if (loading) {
    return (
      <div className="loadingSection">
        <p className='loadingText'>Načítám menu...</p>
        <img src="images/loading.gif" alt="Načítání..." className="loading-img" />
      </div>
    );
  }

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

      <p id='info'>Kterékoliv z jídel lze objednat každý den v průběhu týdne. Uvedená cena obsahuje polévku dle denní nabídky.<br/><span style={{fontStyle: 'italic'}}>Any of these meals can be ordered everyday during the week. Mentioned prices include the soup of the day.</span></p>

      <p className='nadpis'>Hlavní chody / Main courses</p>
      <div className='mainCourses'>
        {data.mains.map((meal, index) => (
          <div className={`option ${index === data.mains.length - 1 ? 'lastOption' : ''}`} key={meal.id}>
            <p className='number'>{index + 1}.</p>
            <div className='meal'>
              <p className='mealDescription'>
                {meal.item}
                {meal.allergens && meal.allergens.trim() !== '' && (
                  <span style={{ fontStyle: 'italic', color: '#777' }}> ({meal.allergens})</span>
                )}
              </p>
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
            <p className='soupDescription'>
              {soup.item}
              {soup.allergens && soup.allergens.trim() !== '' && (
                <span style={{ fontStyle: 'italic', color: '#777' }}> ({soup.allergens})</span>
              )}
            </p>
          </div>
        ))}
      </div>
     {allergens.length > 0 && (
      <div id="allergens" className="allergens">
        <h3 className="allergen-heading">Alergeny</h3>
        <div className="allergen-list">
          {allergens.map((a, i) => (
            <span key={a.number}>
              <strong>{a.number}</strong> – {a.name}{i !== allergens.length - 1 && ', '}
            </span>
          ))}
        </div>

        <h3 className="allergen-heading">Allergens</h3>
        <div className="allergen-list allergen-list-en">
          {allergens.map((a, i) => (
            <span key={a.number}>
              <strong>{a.number}</strong> – <em>{a.eng_name}</em>{i !== allergens.length - 1 && ', '}
            </span>
          ))}
        </div>
      </div>
    )}
    </>
  );
}

export default Menu;