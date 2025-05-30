import { supabase } from '../../src/lib/supabaseClient.js';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

export const handler = async function () {
  try {
    // Cesta k souboru při buildu na serveru
    const filePath = path.resolve('public/menu.xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const parseExcelDate = (serial) => {
      if (!serial || typeof serial !== 'number') return '';
      const excelEpoch = new Date(1899, 11, 30);
      return new Date(excelEpoch.getTime() + serial * 86400000)
        .toISOString()
        .split('T')[0];
    };

    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    const mainDishes = [];
    const soups = [];
    const menu = [];

    rows.forEach((row) => {
      const dateFrom = parseExcelDate(row['Od']);
      const dateTo = parseExcelDate(row['Do']);

      if (dateFrom && dateTo) {
        menu.push({ dateFrom, dateTo });
      }

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
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Menu není k dispozici.' }),
      };
    }

    const { data: menuInsert, error: menuError } = await supabase
      .from('Menu')
      .insert([{ datefrom: selectedMenu.dateFrom, dateto: selectedMenu.dateTo }])
      .select()
      .single();

    if (menuError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Chyba při vkládání menu', detail: menuError.message }),
      };
    }

    const foods = [...mainDishes, ...soups].map((f) => ({
      ...f,
      menuid: menuInsert.id,
    }));

    const { error: foodError } = await supabase.from('Food').insert(foods);

    if (foodError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Chyba při vkládání jídel/polévek', detail: foodError.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Úspěšně vloženo ${foods.length} položek jídel/polévek.`,
        menuId: menuInsert.id,
      }),
    };
  } catch (err) {
    console.error('Fatal error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Chyba při parsování Excelu', error: err.message }),
    };
  }
};
