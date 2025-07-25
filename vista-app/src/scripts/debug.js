// src/scripts/debug.js

import dotenv from 'dotenv';
dotenv.config();

const weekdays = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];

const dayNameEN = (day) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];

function isOrderingDisabled(day, hour) {
  return (
    (day === 4 && hour >= 21) || // čtvrtek od 21:00
    day === 5 ||                 // pátek
    day === 6 ||                 // sobota
    (day === 0 && hour < 15)     // neděle do 15:00
  );
}

/**
 * Vrátí pracovní dny pro daný den a hodinu dle pravidel
 * @param {number} maxDays - Kolik pracovních dní chceme získat
 * @param {number} inputDay - Den v týdnu (0 = neděle ... 6 = sobota)
 * @param {number} inputHour - Hodina (0–23)
 * @returns {Array}
 */
export const getUpcomingWeekdays = (maxDays, inputDay, inputHour) => {
  if (isOrderingDisabled(inputDay, inputHour)) {
    return [];
  }

  const now = new Date();
  const diff = inputDay - now.getDay();
  now.setDate(now.getDate() + diff);
  now.setHours(inputHour, 0, 0, 0);

  const dates = [];
  let dayOffset = 1;

  if(inputHour >= 21) {
     maxDays = maxDays - now.getDay() - 1; // Pro neděli 5, pro pondělí 4 atd.
  }
  else{
    maxDays = maxDays - now.getDay(); // Pro neděli 5, pro pondělí 4 atd.
  }

   

  while (dates.length < maxDays) {
    const future = new Date(now);
    future.setDate(now.getDate() + dayOffset);
    const day = future.getDay();

    const isTooLate =
      (inputDay === 1 && inputHour >= 21 && day === 2) || // pondělí po 21:00 → vynechat úterý
      (inputDay === 2 && inputHour >= 21 && day === 3) || // úterý po 21:00 → vynechat středu
      (inputDay === 3 && inputHour >= 21 && day === 4) || // středa po 21:00 → vynechat čtvrtek
      (inputDay === 0 && inputHour >= 21 && day === 1);   // neděle po 21:00 → vynechat pondělí

    if (day >= 1 && day <= 5 && !isTooLate) {
      dates.push({
        label: `${weekdays[day]} / ${dayNameEN(day)}: ${future.getDate()}. ${future.getMonth() + 1}. ${future.getFullYear()}`,
        date: future,
      });
    }

    dayOffset++;
  }

  return dates;
};


console.log('✅ Debug funkce spuštěna');
const runDebug = async () => {
  const upcomingWeekdays = getUpcomingWeekdays(5, 1, 20);
  console.log('Nadcházející pracovní dny:', upcomingWeekdays);

  //Zde spust funkci pro debugování
  // Například: const upcomingWeekdays = getUpcomingWeekdays(5, 0, 16);  console.log('Nadcházející pracovní dny:', upcomingWeekdays);
};

runDebug();
