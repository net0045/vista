import React, { useState } from 'react';
import './Admin.css'; 
import { useNavigate } from 'react-router-dom';

function ExcelExport() {
  const navigate = useNavigate();
  const [menuFile, setMenuFile] = useState(null);
  const [userFile, setUserFile] = useState(null);

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
    <div className="admin-container-export">
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
          <h3>Vygenerovat denní objednávky (.xlsx)</h3>
          <button className="excelBtnSubmit" onClick={goImport}>
            Generuj
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExcelExport;
