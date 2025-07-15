import React, { useState } from 'react';
import './Admin.css'; 
import { useNavigate } from 'react-router-dom';
import { removeOrderAndFoodsInOrderByOrderId } from './api/adminApi';

function StornoOrders() {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStorno = async () => {
    if (!orderId) {
      setMessage('❌ Zadej ID objednávky!');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await removeOrderAndFoodsInOrderByOrderId(orderId);
      setMessage('✅ Objednávka byla úspěšně smazána.');
      setOrderId('');
      setLoading(false);
    } catch (error) {
      setMessage(`❌ Chyba: Objednávka se nezrušila! Zkontrolujte prosím ID znovu`);
      setLoading(false);
    }
  };

  const goImport = () => {
    navigate('/admin/import');
  };

  const goExport = () => {
    navigate('/admin/export');
  };

  const goOverview = () => {
    navigate('/admin/overview');
  };

  const goStorno = () => {
    navigate('/admin/storno');
  };

  return (
    <div className="admin-container-storno">
      <div className="top-bar">
        <button  onClick={goImport}>NAHRÁT EXCEL</button>
        <button  onClick={goExport}>VYGENEROVAT EXCEL</button>
        <button  onClick={goStorno}>STORNO OBJEDNÁVEK</button>
        <button  onClick={goOverview}>SEZNAM OBJEDNÁVEK</button>
      </div>


      <div className="content-row">
        <div className="storno-order-div">
            <h1>Storno objednávek</h1>
            <p>Do inputu zadejte ID objednávky.</p>
            <input
                className="stornoInput"
                placeholder="Identifikační číslo objednávky"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
            />
            <button
                className="stornoBtn"
                onClick={handleStorno}
                disabled={loading}
            >
                {loading ? 'Stornuji...' : 'Storno objednávky'}
            </button>
            {message && <p style={{ marginTop: '10px' }}>{message}</p>}
        </div>
        
      </div>

    </div>
  );
}

export default StornoOrders;
