import React, { useState } from 'react';
import './Admin.css'; 
import { useNavigate } from 'react-router-dom';
import { parseAndUploadMenu } from './scripts/parseMenu';
import { uploadUsersFromExcel } from './scripts/uploadUsersFromExcel';

function AdminOverview() {
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
      <div className="top-bar">
        <button  onClick={goImport}>NAHRÁT EXCEL</button>
        <button  onClick={goExport}>VYGENEROVAT EXCEL</button>
        <button  onClick={goStorno}>STORNO OBJEDNÁVEK</button>
        <button  onClick={goOverview}>SEZNAM OBJEDNÁVEK</button>
      </div>


      <div className="logo-wrapper">
        <img src="/images/excel.png" alt="Excel logo" className="excel-logo" />
      </div>

      <div className="content-row">
        <div className="excelform">
          <h3>Nahrát menu (.xlsx)</h3>
          <input type="file" accept=".xlsx" onChange={handleMenuChange} />
          <button className="excelBtnSubmit" onClick={handleUploadMenu} disabled={loading}>
            {loading ? 'Nahrávám...' : 'Nahrát Menu'}
          </button>
        </div>

        <div className="excelform">
          <h3>Nahrát seznam uživatelů (.xlsx)</h3>
          <input type="file" accept=".xlsx" onChange={handleUserChange} />
          <button className="excelBtnSubmit" onClick={handleUploadUsers} disabled={loading}>
            {loading ? 'Nahrávám...' : 'Nahrát E-maily'}
          </button>
        </div>
      </div>

      {message && <p style={{ color: 'black', marginTop: '20px' }}>{message}</p>}
    </div>
  );
}

export default AdminOverview;
