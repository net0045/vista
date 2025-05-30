// netlify/functions/parseMenu.js
import { supabase } from '../../src/lib/supabaseClient.js';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import formidable from 'formidable';

export const config = {
  bodyParser: false,
};

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  const form = formidable({ multiples: false });

  return new Promise((resolve, reject) => {
    form.parse(event, async (err, fields, files) => {
      if (err) {
        resolve({
          statusCode: 500,
          body: JSON.stringify({ message: 'Formulář nešel zpracovat', detail: err.message }),
        });
        return;
      }

      const file = files.file;
      if (!file || !file.filepath) {
        resolve({
          statusCode: 400,
          body: JSON.stringify({ message: 'Chybí soubor' }),
        });
        return;
      }

      try {
        const workbook = xlsx.readFile(file.filepath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const parseExcelDate = (serial) => {
          if (!serial || typeof serial !== 'number') return '';
          const excelEpoch = new Date(1899, 11, 30);
          return new Date(excelEpoch.getTime() + serial * 86400000).toISOString().split('T')[0];
        };

        const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
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
          resolve({
            statusCode: 400,
            body: JSON.stringify({ message: 'Menu nenalezeno v Excelu' }),
          });
          return;
        }

        const { data: menuInsert, error: menuError } = await supabase
          .from('Menu')
          .insert([{ datefrom: selectedMenu.dateFrom, dateto: selectedMenu.dateTo }])
          .select()
          .single();

        if (menuError) {
          resolve({
            statusCode: 500,
            body: JSON.stringify({ message: 'Chyba pri vkládání menu', detail: menuError.message }),
          });
          return;
        }

        const foods = [...mainDishes, ...soups].map((f) => ({
          ...f,
          menuid: menuInsert.id,
        }));

        const { error: foodError } = await supabase.from('Food').insert(foods);

        if (foodError) {
          resolve({
            statusCode: 500,
            body: JSON.stringify({ message: 'Chyba pri vkládání polozek', detail: foodError.message }),
          });
          return;
        }

        resolve({
          statusCode: 200,
          body: JSON.stringify({
            message: `Vloženo ${foods.length} polozek, menuId: ${menuInsert.id}`,
          }),
        });
      } catch (e) {
        resolve({
          statusCode: 500,
          body: JSON.stringify({ message: 'Chyba pri zpracování Excelu', error: e.message }),
        });
      }
    });
  });
}