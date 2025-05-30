import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient.js';

/**
 * Parsuje Excel soubor a uloží data do Supabase.
 * @param {File} file - Excel soubor z <input type="file" />
 * @returns {Promise<string>} - Výsledek operace (nebo chyba).
 */
export const parseAndUploadMenu = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        // Přesnější převod Excel datumu
        const parseExcelDate = (serial) => {
          if (!serial || typeof serial !== 'number') return '';
          const parsed = XLSX.SSF.parse_date_code(serial);
          if (!parsed) return '';
          const date = new Date(parsed.y, parsed.m - 1, parsed.d);
          date.setDate(date.getDate() + 1); // přičtení 1 dne, bo parser jebe 
          return date.toISOString().split('T')[0];
        };

        const mainDishes = [];
        const soups = [];
        const menu = [];

        rows.forEach((row) => {
          const dateRawFrom = row['Od'];
          const dateRawTo = row['Do'];
          const food = row['Jidlo'];
          const foodPrice = row['Cena'];
          const foodAllergens = row['Alergen_Jidlo'];
          const soup = row['Polivka'];
          const soupAllergens = row['Alergen_Polivka'];
          const dayOfWeek = row['Cislo_dne'];

          const dateFrom = parseExcelDate(dateRawFrom);
          const dateTo = parseExcelDate(dateRawTo);

          if (dateFrom && dateTo) {
            menu.push({ dateFrom, dateTo });
          }

          if (food) {
            mainDishes.push({
              item: food,
              cost: parseFloat(foodPrice),
              allergens: foodAllergens,
              issoup: false,
              dayOfWeek,
            });
          }

          if (soup) {
            soups.push({
              item: soup,
              cost: 0,
              allergens: soupAllergens,
              issoup: true,
              dayOfWeek,
            });
          }
        });

        const selectedMenu = menu[0];
        if (!selectedMenu) return reject('Menu není k dispozici v Excelu.');

        const { data: menuInsert, error: menuError } = await supabase
          .from('Menu')
          .insert([{ datefrom: selectedMenu.dateFrom, dateto: selectedMenu.dateTo }])
          .select()
          .single();

        if (menuError) {
          return reject('Chyba při vkládání menu: ' + menuError.message);
        }

        const foodsWithMenuId = [...mainDishes, ...soups].map((f) => ({
          ...f,
          menuid: menuInsert.id,
        }));

        const { error: foodError } = await supabase
          .from('Food')
          .insert(foodsWithMenuId);

        if (foodError) {
          return reject('Chyba při vkládání jídel: ' + foodError.message);
        }

        resolve(`Vloženo ${foodsWithMenuId.length} položek do menu ID ${menuInsert.id}`);
      } catch (err) {
        reject('Chyba při zpracování souboru: ' + err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  });
};
