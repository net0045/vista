import React, { useState } from 'react';
import './Admin.css'; 
import { useNavigate } from 'react-router-dom';

function Admin() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Prosím vyber soubor.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/.netlify/functions/parseMenu', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        setMessage(`✅ ${result.message || 'Soubor úspěšně zpracován'}`);
      } else {
        setMessage(`❌ Chyba: ${result.message}`);
      }
    } catch (err) {
      setMessage('❌ Chyba při odesílání souboru');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content">
      <div className="logo">
        <img
          src="/images/excel.png"
          alt="Excel logo"
          className="account-icon"
        />
      </div>

      <div className="form-excel">
        <input type="file" accept=".xlsx" onChange={handleFileChange} />
        <button className="submit-button-excel" onClick={handleUpload} disabled={loading}>
          {loading ? 'Nahrávám...' : 'Nahrát Menu'}
        </button>
        {message && <p style={{ color: 'white', marginTop: '10px' }}>{message}</p>}
      </div>
    </div>
  );
}

export default Admin;
