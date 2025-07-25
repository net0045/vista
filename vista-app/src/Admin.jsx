import React, { useState } from 'react';
import './Admin.css'; 
import { useNavigate } from 'react-router-dom';
import { parseAndUploadMenu } from './scripts/parseMenu';
import { uploadUsersFromExcel } from './scripts/uploadUsersFromExcel';

function Admin() {
  const navigate = useNavigate();
  const [menuFile, setMenuFile] = useState(null);
  const [userFile, setUserFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMenuChange = (e) => {
    setMenuFile(e.target.files[0]);
  };

  const handleUserChange = (e) => {
    setUserFile(e.target.files[0]);
  };

  const handleUploadMenu = async () => {
    if (!menuFile) {
      setMessage('Prosím vyber soubor s menu.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await parseAndUploadMenu(menuFile);
      setMessage(`✅ Menu: ${result}`);
    } catch (err) {
      setMessage(`❌ Menu: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadUsers = async () => {
    if (!userFile) {
      setMessage('Prosím vyber soubor s uživateli.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await uploadUsersFromExcel(userFile);
      setMessage(`✅ Uživatele: ${result}`);
    } catch (err) {
      setMessage(`❌ Uživatele: ${err}`);
    } finally {
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
    <div className="admin-container">
      <div className='admin-navigation'>
        <div>
          <button className='admin-backToAccButton' onClick={() => navigate('/account')}>ZPĚT NA ÚČET</button>
        </div>
        <div className="top-bar">
          <button  onClick={goImport}>NAHRÁT EXCEL</button>
          <button  onClick={goExport}>VYGENEROVAT EXCEL</button>
          <button  onClick={goStorno}>STORNO OBJEDNÁVEK</button>
          <button  onClick={goOverview}>SEZNAM OBJEDNÁVEK</button>
        </div>
      </div>

      <div className="logo-wrapper">
        <img src="/images/excel.png" alt="Excel logo" className="excel-logo" />
      </div>

      <div className="content-row">
        Na této URL bude login Form pro adminy
      </div>

      {message && <p style={{ color: 'black', marginTop: '20px' }}>{message}</p>}
    </div>
  );
}

export default Admin;
