import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import './MyOrders.css'
import { useNavigate } from 'react-router-dom'

function MyOrders() {
  const navigate = useNavigate();

  const navigateBackToAccount = async () => {
    navigate('/account');
  }
  
  return (
    <>
      <div id='myOrders'>
        <div id='back'>
          <button id='backButton' onClick={navigateBackToAccount}>ZPĚT / BACK</button>
          <p id='email'>weber.dan@email.cz</p>
        </div>
        <br />
        <div id='orders'>
          <div className='order'>
            <p className='orderText'>Segedinský guláš podávaný s houskovým knedlíkem / Traditional Hungarian goulash with pork meat and sauerkraut served with bread dumplings</p>
            <img className='qrCode' src="./qr_code.jpg" alt="" />
          </div>
        </div>
        <div id='orders'>
          <div className='order'>
            <p className='orderText'>Krůtí steak po staročesku s jasmínovou rýží / Old-czech style turkey breast with jasmine rice</p>
            <img className='qrCode' src="./qr_code.jpg" alt="" />
          </div>
        </div>
      </div>
    </>
  )
}

export default MyOrders
