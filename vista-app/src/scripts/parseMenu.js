// utils/parseMenu.js
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';

export const parseAndUploadMenu = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        const parseExcelDate = (serial) => {
          if (!serial || typeof serial !== 'number') return '';
          const excelEpoch = new Date(1899, 11, 30);
          return new Date(excelEpoch.getTime() + serial * 86400000).toISOString().split('T')[0];
        };

        const mainDishes = [], soups = [], menu = [];

        rows.forEach((row) => {
          const dateFrom = parseExcelDate(row['Od']);
          const dateTo = parseExcelDate(row['Do']);
          if (dateFrom && dateTo) menu.push({ dateFrom, dateTo });

          if (row['Jidlo']) {
            mainDishes.push({
              item: row['Jidlo'],
              cost: parseFloat(row['Cena']),
              allergens: row['Alergen_Jidlo'],
              issoup: false,
              dayOfWeek: row['Cislo_dne'],
            });
          }
          if (row['Polivka']) {
            soups.push({
              item: row['Polivka'],
              cost: 0,
              allergens: row['Alergen_Polivka'],
              issoup: true,
              dayOfWeek: row['Cislo_dne'],
            });
          }
        });

        const selectedMenu = menu[0];
        if (!selectedMenu) {
          return reject('Menu nenalezeno v Excelu');
        }

        const { data: menuInsert, error: menuError } = await supabase
          .from('Menu')
          .insert([{ datefrom: selectedMenu.dateFrom, dateto: selectedMenu.dateTo }])
          .select()
          .single();

        if (menuError) return reject('Chyba při vkládání menu: ' + menuError.message);

        const foods = [...mainDishes, ...soups].map((f) => ({
          ...f,
          menuid: menuInsert.id,
        }));

        const { error: foodError } = await supabase.from('Food').insert(foods);

        if (foodError) return reject('Chyba při vkládání položek: ' + foodError.message);

        return resolve(`Vloženo ${foods.length} položek, menu ID ${menuInsert.id}`);
      } catch (err) {
        return reject('Chyba při zpracování souboru: ' + err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  });
};
