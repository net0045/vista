import React, { useEffect, useState } from 'react';
import { getAllFoods } from '../src/api/foodApi'; // Adjust the import path as necessary

import './App.css';

function Test(){
    const [foods, setFoods] = useState([]);

    useEffect(() => {
      getAllFoods().then(setFoods).catch(console.error);
    }, []);
  
    return <>{foods.map((f) => <div style={{ background: 'lightyellow', padding: '2rem', color: 'black' }} key={f.id}>{f.item}</div>)}</>;
}

export default Test