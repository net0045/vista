import { supabase } from '../lib/supabaseClient.js';
import xlsx from 'xlsx';
import fs from 'fs';

// Načtení Excel souboru
const workbook = xlsx.readFile('./public/menu.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Funkce pro převod číselného formátu na ISO datum
const parseExcelDate = (serial) => {
    if (!serial || typeof serial !== 'number') return '';
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + serial * 86400000)
        .toISOString()
        .split('T')[0];
};

// Konverze na JSON
const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

// Výsledek uložení
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

    if(dateFrom && dateTo) {
        menu.push({
            dateFrom,
            dateTo,
        });
    }

    if (food) {
        mainDishes.push({
            item: food,
            cost: parseFloat(foodPrice),
            allergens: foodAllergens,
            issoup: false,
            dayOfWeek: dayOfWeek, 
        });
    }

    if (soup) {
        soups.push({
            item: soup,
            cost: 0, 
            allergens: soupAllergens,
            issoup: true,
            dayOfWeek: dayOfWeek,
        });
    }
});

/*fs.writeFileSync('parsedFood.json', JSON.stringify(mainDishes, null, 2));
fs.writeFileSync('parsedSoups.json', JSON.stringify(soups, null, 2));
fs.writeFileSync('parsedMenu.json', JSON.stringify(menu, null, 2));
*/

//Vložení menu z prvního záznamu v listu
const selectedMenu = menu[0];
if (!selectedMenu) {
  console.error('Menu není k dispozici.');
  process.exit(1);
}
const { data: menuInsert, error: menuError } = await supabase
  .from('Menu')
  .insert([{ datefrom: selectedMenu.dateFrom, dateto: selectedMenu.dateTo }])
  .select()
  .single();

if (menuError) {
  console.error('Chyba při vkládání menu:', menuError.message);
  process.exit(1);
}
console.log('Menu vloženo:', menuInsert);


//Spojení jídel a polévek
const foods = [...mainDishes, ...soups];
// Přidání menuId ke každému záznamu
const foodsWithMenuId = foods.map((f) => ({
  ...f,
  menuid: menuInsert.id,
}));

//Vložení jídel do Supabase
const { error: foodError } = await supabase
  .from('Food')
  .insert(foodsWithMenuId);

if (foodError) {
  console.error('Chyba při vkládání jídel/polévek:', foodError.message);
} else {
  console.log(`Vloženo ${foodsWithMenuId.length} položek jídel/polévek.`);
}
