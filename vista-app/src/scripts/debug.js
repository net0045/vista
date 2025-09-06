// src/scripts/debug.js
import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const weekdays = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
const dayNameEN = (day) => ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][day];

/** YYYY-MM-DD */
const toYMD = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/** Vrátí začátek týdne (neděle 00:00:00.000) a konec (pátek 23:59:59.999) pro dané "dnes" */
function getThisWeekRange(base = new Date()) {
  const d = new Date(base);
  const day = d.getDay(); // 0=ne, ... 6=so

  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day); // jdeme na neděli
  sunday.setHours(0, 0, 0, 0);

  const friday = new Date(sunday);
  friday.setDate(sunday.getDate() + 5 - 1); // pátek = neděle + 5 dní - 1? ne, opravíme níže
  // korekce: neděle(0) -> pátek je +5 dny (0..5 = ne..pá)
  friday.setDate(sunday.getDate() + 5);
  friday.setHours(23, 59, 59, 999);

  return { sunday, friday };
}

/**
 * Načte blokované dny v aktuálním týdnu (ne–pá) z tabulky SpecialDates.
 * Očekává sloupec `date` typu text s hodnotou ve formátu YYYY-MM-DD.
 * Vrací Set(['YYYY-MM-DD', ...]) pro rychlé členství.
 */
async function loadBlockedDatesThisWeek() {
  const { sunday, friday } = getThisWeekRange(new Date());
  const from = toYMD(sunday);
  const to = toYMD(friday);

  const { data, error } = await supabase
    .from('SpecialDates')
    .select('date')
    .gte('date', from)
    .lte('date', to);

  if (error) {
    console.error('❌ Supabase error při načítání SpecialDates:', error);
    return new Set();
  }
  const list = (data || []).map(r => r.date);
  return new Set(list);
}

/** Uzavření objednávek dle pravidel (čt 21:00+, pá, so, ne < 15:00) */
function isOrderingClosedNow(inputDay, inputHour) {
  return (inputDay === 4 && inputHour >= 21) || inputDay === 5 || inputDay === 6 || (inputDay === 0 && inputHour < 15);
}

/**
 * Vrátí pracovní dny (po–pá) s aplikovanými pravidly + odstraněné blokované dny.
 * @param {number} maxDays - max počet pracovních dní
 * @param {number} inputDay - 0..6 (aktuální den)
 * @param {number} inputHour - 0..23 (aktuální hodina)
 * @param {Set<string>} blockedYMD - set dat 'YYYY-MM-DD' v rámci aktuálního týdne
 * @returns {Array<{label:string,date:Date, ymd:string, blocked?:boolean}>}
 */
export function getUpcomingWeekdays(maxDays, inputDay, inputHour, blockedYMD = new Set()) {
  if (isOrderingClosedNow(inputDay, inputHour)) {
    return [];
  }

  const now = new Date();
  const diff = inputDay - now.getDay();
  now.setDate(now.getDate() + diff);
  now.setHours(inputHour, 0, 0, 0);

  const dates = [];
  let dayOffset = 1;

  if (inputHour >= 21) {
    maxDays = maxDays - now.getDay() - 1;
  } else {
    maxDays = maxDays - now.getDay();
  }

  while (dates.length < maxDays) {
    const future = new Date(now);
    future.setDate(now.getDate() + dayOffset);
    future.setHours(0, 0, 0, 0);
    const day = future.getDay();

    const isTooLate =
      (inputDay === 1 && inputHour >= 21 && day === 2) ||
      (inputDay === 2 && inputHour >= 21 && day === 3) ||
      (inputDay === 3 && inputHour >= 21 && day === 4) ||
      (inputDay === 0 && inputHour >= 21 && day === 1);

    if (day >= 1 && day <= 5 && !isTooLate) {
      const ymd = toYMD(future);
      const blocked = blockedYMD.has(ymd);

      // Pokud je den blokovaný, tak ho nepřidáme do výsledku.
      if (!blocked) {
        dates.push({
          label: `${weekdays[day]} / ${dayNameEN(day)}: ${future.getDate()}. ${future.getMonth() + 1}. ${future.getFullYear()}`,
          date: future,
          ymd,
        });
      }
    }

    dayOffset++;
  }

  return dates;
}

/** ----------------------------- DEBUG RUN ----------------------------- */

console.log('✅ Debug funkce spuštěna');

const runDebug = async () => {
  // Simulace: pondělí 20:00 (objednávky otevřené)
  const inputDay = 1;
  const inputHour = 20;

  // 1) Načti blokované dny pro aktuální týden (ne–pá)
  const blocked = await loadBlockedDatesThisWeek();
  console.log('Blokované dny (YYYY-MM-DD) tento týden:', [...blocked]);

  // 2) Generuj dostupné pracovní dny s ohledem na blokované dny
  const upcomingWeekdays = getUpcomingWeekdays(5, inputDay, inputHour, blocked);
  console.log('Nadcházející dostupné pracovní dny:', upcomingWeekdays);

  // Pokud chceš rychlý test bez DB, můžeš si to nasimulovat takto:
  // const fakeBlocked = new Set(['2025-09-09', '2025-09-11']);
  // const test = getUpcomingWeekdays(5, inputDay, inputHour, fakeBlocked);
  // console.log('TEST (fakeBlocked):', test);
};

runDebug();
