import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import './Menu.css'
import { useNavigate } from 'react-router-dom'

function Menu() {
  //
  const navigate = useNavigate();

  const navigateBackToAccount = async () => 
  {
    navigate('/account');
  }

  const navigateToOrder = async () => 
  {
    navigate('/order');
  }


  const [data, setData] = useState({ mains: [], soups: [] })
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  useEffect(() => {
    const fetchMenu = async () => {
      // 1. Získání nejnovějšího menu
      const { data: menus, error: menuError } = await supabase
        .from('Menu')
        .select('*')
        .order('datefrom', { ascending: false })
        .limit(1)

      if (menuError || !menus?.length) {
        console.error('Chyba při načítání menu:', menuError)
        return
      }

      const currentMenu = menus[0]

      // 2. Načtení jídel podle menu ID
      const { data: foods, error: foodError } = await supabase
        .from('Food')
        .select('*')
        .eq('menuid', currentMenu.id)
        .order('dayOfWeek', { ascending: true })

      if (foodError) {
        console.error('Chyba při načítání jídel:', foodError)
        return
      }

      const mains = foods.filter(f => !f.issoup)
      const soups = foods.filter(f => f.issoup)

      setDateRange({
        from: currentMenu.datefrom,
        to: currentMenu.dateto
      })

      setData({ mains, soups })
    }

    fetchMenu()
  }, [])

  return (
    <>
      <div id='menu'>
        <button className='button' onClick={navigateBackToAccount}>ZPĚT / BACK</button>
        <button className='button' onClick={navigateToOrder}>OBJEDNAT / ORDER</button>
      </div>

      <div id='dateAndTime'>
        <p className='dateTimeText'>{dateRange.from} - {dateRange.to}</p>
        <p className='dateTimeText'>|</p>
        <p className='dateTimeText'>11:00 - 14:00 a 17:00 - 19:00</p>
      </div>
      <p id='info'>
        Kterékoliv z jídel lze objednat každý den v průběhu týdne. Uvedená cena zahrnuje polévku dle denní nabídky. <br />
        Any of these meals can be ordered everyday during the week. Mentioned prices include the soup of the day.
      </p>
      <p>JÍDLO LZE OBJEDNÁVAT DO 21:00 <br /> FOOD CAN BE ORDERED UNTIL 9:00 PM</p>
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
  )
}

export default Menu;
