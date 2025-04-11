import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import './MyOrders.css'

function MyOrders() {
  
  return (
    <>
      <div id='myOrders'>
        <div id='back'>
          <button id='backButton'>ZPĚT / BACK</button>
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
