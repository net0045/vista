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
      // First Excel: objednávky na zítřek
      const rows = data.map(order => {
        const [first, second] = order.FoodsInOrder.sort((a, b) => a.mealNumber - b.mealNumber);

        return {
          //'ID objednávky': order.id,
          //'Datum': order.date,
          'Příjmení': order.user?.surname || '',
          'Číslo Menu 1': first?.mealNumber || '',
          //'Menu 1': first?.food?.item || '',
          'Číslo Menu 2': second?.mealNumber || '',
          //'Menu 2': second?.food?.item || '',
          //'Cena celkem': (first?.food?.cost || 0) + (second?.food?.cost || 0)
        };
      });

      const worksheet1 = XLSX.utils.json_to_sheet(rows);
      const workbook1 = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook1, worksheet1, 'Objednávky');

      const blob1 = XLSX.write(workbook1, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([blob1]), 'objednavky_na_zitrek.xlsx');

      // Druhý Excel: agregace podle uživatelů
      const mapUsersAndOrders = new Map();
      data.forEach(order => {
        const userId = order.user?.id;
        const surname = order.user?.surname || '';
        if (!userId || !surname) return;


        if (!mapUsersAndOrders.has(userId)) {
          mapUsersAndOrders.set(userId, {
            'ID uživatele': userId,
            'Příjmení': surname,
            'Menu 1': 0,
            'Menu 2': 0,
            'Menu 3': 0,
            'Menu 4': 0,
            'Menu 5': 0
          });
        }

        const userRecord = mapUsersAndOrders.get(userId);

        order.FoodsInOrder.forEach(food => {
          const menuKey = `Menu ${food.mealNumber}`;
          if (userRecord[menuKey] !== undefined) {
            userRecord[menuKey]++;
          }
        });
      });

      const rowsByUser = Array.from(mapUsersAndOrders.values());
      const worksheet2 = XLSX.utils.json_to_sheet(rowsByUser);
      const workbook2 = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook2, worksheet2, 'Souhrn');

      const blob2 = XLSX.write(workbook2, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([blob2]), 'souhrn_uzivatelu.xlsx');
    } catch (err) {
      console.error('Chyba při generování Excelu:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="admin-container-export">
      <div className='admin-navigation'>
        <div>
          <button className='admin-backToAccButton' onClick={() => navigate('/account')}>ZPĚT NA ÚČET</button>
        </div>
        <div className="top-bar">
          <button  onClick={goImport}>NAHRÁT EXCEL</button>
          <button  onClick={goExport}>VYGENEROVAT EXCEL</button>

          <button  onClick={goOverview}>SEZNAM OBJEDNÁVEK</button>
        </div>
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
