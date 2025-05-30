import formidable from 'formidable';
import fs from 'fs';
import xlsx from 'xlsx';
import { supabase } from '../../src/lib/supabaseClient.js';

export const config = {
  bodyParser: false,
};

export const handler = async (event, context) => {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });

    form.parse(event, async (err, fields, files) => {
      if (err) {
        return resolve({
          statusCode: 500,
          body: JSON.stringify({ message: 'Chyba při parsování formuláře' }),
        });
      }

      try {
        const file = files.file[0];
        const workbook = xlsx.readFile(file.filepath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

        // --- Sem vlož svoji logiku Supabase INSERT ---

        return resolve({
          statusCode: 200,
          body: JSON.stringify({ message: 'Soubor zpracován' }),
        });
      } catch (error) {
        return resolve({
          statusCode: 500,
          body: JSON.stringify({ message: 'Chyba při zpracování souboru', detail: error.message }),
        });
      }
    });
  });
};
