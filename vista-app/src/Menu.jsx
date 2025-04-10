import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import './Menu.css'

function Menu() {
  const [data, setData] = useState({})
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  useEffect(() => {
    fetch('/menu.xlsx')
      .then(res => res.arrayBuffer())
      .then(arrayBuffer => {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]

        const fromDate = sheet['B1']?.v || ''
        const toDate = sheet['B2']?.v || ''

        const menuItem1 = sheet['B5']?.v || ''
        const menuItem2 = sheet['B6']?.v || ''
        const menuItem3 = sheet['B7']?.v || ''
        const menuItem4 = sheet['B8']?.v || ''
        const menuItem5 = sheet['B9']?.v || ''

        const soup1 = sheet['B11']?.v || ''
        const soup2 = sheet['B12']?.v || ''
        const soup3 = sheet['B13']?.v || ''
        const soup4 = sheet['B14']?.v || ''
        const soup5 = sheet['B15']?.v || ''

        setDateRange({ from: fromDate, to: toDate })
        setData({ menuItem1, menuItem2, menuItem3, menuItem4, menuItem5, soup1, soup2, soup3, soup4, soup5 })
        
      })
      .catch(err => {
        console.error('Chyba při načítání Excelu:', err)
      })
  }, [])

  return (
    <>
      <div id='menu'>
        <p className='text'>VISTA</p>
        <p className='text'>Objednání obědů</p>
      </div>

      <div id='dateAndTime'>
        <p className='dateTimeText'>{dateRange.from} - {dateRange.to}</p>
        <p className='dateTimeText'>|</p>
        <p className='dateTimeText'>11:00 - 14:00 a 17:00 - 19:00</p>
      </div>
      

      <p id='info'>
        Kterékoliv z jídel lze objednat každý den v průběhu týdne. Uvedená cena zahrnuje polévku dle denní nabídky. <br /> Any of these meals can be ordered everyday during the week. Mantioned prices include the soup of the day.
      </p>

      <p className='nadpis'>Hlavní chody / Main courses</p>
      <div className='mainCourses'>
        <div className='option'>
          <p className='number'>1.</p>
          <div className='meal'>
            <p className='mealDescription'>{data.menuItem1}</p>
          </div>
          <p className='price'>80Kč</p>
        </div>
        <div className='option'>
        <p className='number'>2.</p>
          <div className='meal'>
            <p className='mealDescription'>{data.menuItem2}</p>
          </div>
          <p className='price'>95Kč</p>
        </div>
        <div className='option'>
        <p className='number'>3.</p>
          <div className='meal'>
            <p className='mealDescription'>{data.menuItem3}</p>
          </div>
          <p className='price'>95Kč</p>
        </div>
        <div className='option'>
        <p className='number'>4.</p>
          <div className='meal'>
            <p className='mealDescription'>{data.menuItem4}</p>
          </div>
          <p className='price'>150Kč</p>
        </div>
        <div className='option lastOption' >
        <p className='number'>5.</p>
          <div className='meal'>
            <p className='mealDescription'>{data.menuItem5}</p>
          </div>
          <p className='price'>150Kč</p>
        </div>
      </div>

      <p className='nadpis'>Polévky / Soups</p>
      <div className='soups'>
        <div className='soupOption'>
          <p className='soupDay'>Pondělí / Monday</p>
          <p className='soupDescription'>{data.soup1}</p>
        </div>
        <div className='soupOption'>
          <p className='soupDay'>Úterý / Tuesday</p>
          <p className='soupDescription'>{data.soup2}</p>
        </div>
        <div className='soupOption'>
          <p className='soupDay'>Středa / Wednesday</p>
          <p className='soupDescription'>{data.soup3}</p>
        </div>
        <div className='soupOption'>
          <p className='soupDay'>Čtvrtek / Thursday</p>
          <p className='soupDescription'>{data.soup4}</p>
        </div>
        <div className='soupOption lastOption'>
          <p className='soupDay'>Pátek / Friday</p>
          <p className='soupDescription'>{data.soup5}</p>
        </div>
      </div>
    </>
  )
}

export default Menu
