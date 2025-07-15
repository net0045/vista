import React, { useState } from 'react';
import './Admin.css'; 
import { useNavigate } from 'react-router-dom';
import { getTomorrowOrders } from './api/adminApi';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

function ExcelExport() {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);

  const goImport = () => navigate('/admin/import');
  const goExport = () => navigate('/admin/export');
  const goOverview = () => navigate('/admin/overview');
  const goStorno = () => navigate('/admin/storno');

  const handleGenerateExcel = async () => {
    setGenerating(true);
    try {
      const data = await getTomorrowOrders();

      const rows = data.map(order => {
        const [first, second] = order.FoodsInOrder.sort((a, b) => a.mealNumber - b.mealNumber);

        return {
          'ID objednávky': order.id,
          'Datum': order.date,
          'Příjmení': order.user?.surname || '',
          'Číslo Menu 1': first?.mealNumber || '',
          'Menu 1': first?.food?.item || '',
          'Číslo Menu 2': second?.mealNumber || '',
          'Menu 2': second?.food?.item || '',
          'Cena celkem': (first?.food?.cost || 0) + (second?.food?.cost || 0)
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Objednávky');

      const blob = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([blob]), 'objednavky_na_zitrek.xlsx');
    } catch (err) {
      console.error('Chyba při generování Excelu:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="admin-container-export">
      <div className="top-bar">
        <button onClick={goImport}>NAHRÁT EXCEL</button>
        <button onClick={goExport}>VYGENEROVAT EXCEL</button>
        <button onClick={goStorno}>STORNO OBJEDNÁVEK</button>
        <button onClick={goOverview}>SEZNAM OBJEDNÁVEK</button>
      </div>

      <div className="logo-wrapper">
        <img src="/images/excel.png" alt="Excel logo" className="excel-logo" />
      </div>

      <div className="content-row">
        <div className="excelform">
          <h3>Vygenerovat objednávky na zítřek (.xlsx)</h3>
          <button className="excelBtnSubmit" onClick={handleGenerateExcel} disabled={generating}>
            {generating ? 'Generuji...' : 'Generuj'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExcelExport;
