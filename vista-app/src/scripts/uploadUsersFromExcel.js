import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';

export const uploadUsersFromExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const emails = rows.flat().filter(email => typeof email === 'string' && email.includes('@'))
          .map(email => email.trim().toLowerCase());

        if (emails.length === 0) return reject('Žádné platné e-maily nenalezeny.');

        // Získání všech e-mailů z DB
        const { data: dbUsers, error: fetchError } = await supabase.from('User').select('email');
        if (fetchError) throw fetchError;

        const dbEmails = dbUsers.map(u => u.email.trim().toLowerCase());

        const toAdd = emails.filter(e => !dbEmails.includes(e));
        const toDelete = dbEmails.filter(e => !emails.includes(e));

        // Přidání nových
        if (toAdd.length > 0) {
          const insertData = toAdd.map(email => ({
            email,
            verified: false,
            password: '',
          }));
          const { error: insertError } = await supabase.from('User').insert(insertData);
          if (insertError) throw insertError;
        }

        // Mazání chybějících
        if (toDelete.length > 0) {
          const { error: deleteError } = await supabase.from('User')
            .delete()
            .in('email', toDelete);
          if (deleteError) throw deleteError;
        }

        resolve(`Hotovo: Přidáno ${toAdd.length}, odstraněno ${toDelete.length}.`);
      } catch (err) {
        reject(err.message || 'Chyba při zpracování souboru.');
      }
    };

    reader.onerror = () => reject('Chyba při čtení souboru.');
    reader.readAsArrayBuffer(file);
  });
};
