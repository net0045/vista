import React, { useState } from 'react';
import './Admin.css'; 
import { parseAndUploadMenu } from './scripts/parseMenu';

function Admin() {
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

    setLoading(true);
    setMessage('');

    try {
      const result = await parseAndUploadMenu(file);
      setMessage(`✅ ${result}`);
    } catch (err) {
      setMessage(`❌ ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="excelogo">
        <img src="/images/excel.png" alt="Excel logo" className="account-icon" />
      </div>

      <div className="excelform">
        <input type="file" accept=".xlsx" onChange={handleFileChange} />
        <button className="excelBtnSubmit" onClick={handleUpload} disabled={loading}>
          {loading ? 'Nahrávám...' : 'Nahrát Menu'}
        </button>
        {message && <p style={{ color: 'white', marginTop: '10px' }}>{message}</p>}
      </div>
    </div>
  );
}

export default Admin;
