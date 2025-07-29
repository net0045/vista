import { supabase } from '../lib/supabaseClient'
import { Food } from '../types/Food'; 

export async function getAllFoods(): Promise<Food[]> {
    const { data, error } = await supabase.from('Food').select('*');
    if (error) throw error;
    return data;
}

export const getFoodIdByNumberAndMenuID = async (number: number, menuId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('Food')
    .select('id')
    .eq('dayOfWeek', number)
    .eq('menuid', menuId)
    .eq('issoup', false)
    .limit(1)
    .single();

  if (error) {
    console.error('Chyba při získávání ID jídla:', error.message);
  }
  return data ? data.id : null;
};


export const getCurrentMenuId = async (): Promise<string | null> => {
  const now = new Date();
  const day = now.getDay(); // 0 = neděle
  const hour = now.getHours();

  // Pokud je neděle odpoledne (15:00+), posuňme se na pondělí následujícího týdne
  if (day === 0 && hour >= 15) {
    now.setDate(now.getDate() + 1); // pondělí
  }

  // Najdi pondělí aktuálního týdne
  const currentDay = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((currentDay + 6) % 7));

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const dateFrom = monday.toISOString().split('T')[0];
  const dateTo = friday.toISOString().split('T')[0];

  const { data: menus, error } = await supabase
    .from('Menu')
    .select('id')
    .eq('datefrom', dateFrom)
    .eq('dateto', dateTo)
    .limit(1);

  if (error) {
    console.error('Chyba při získávání aktuálního menu:', error.message);
    return null;
  }

  if (!menus || menus.length === 0) {
    console.warn('Nebylo nalezeno žádné aktivní menu pro tento týden.');
    return null;
  }

  return menus[0].id;
};


export async function fetchCurrentWeekMenuWithFoods() {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = neděle
  const currentHour = now.getHours();

  // Posun na pondělí následujícího týdne, pokud je neděle po 15:00
  if (currentDay === 0 && currentHour >= 15) {
    now.setDate(now.getDate() + 1);
  }

  // Nalezení pondělí aktuálního týdne
  const day = now.getDay(); 
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  
  //Ošetření pro pátek
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const fromDate = monday.toISOString().split('T')[0];
  const toDate = friday.toISOString().split('T')[0];

  // Načti menu pro tento rozsah
  const { data: menus, error: menuError } = await supabase
    .from('Menu')
    .select('*')
    .eq('datefrom', fromDate)
    .eq('dateto', toDate)
    .limit(1);

  if (menuError || !menus?.length) {
    console.error('Chyba při hledání aktuálního menu:', menuError);
    throw new Error('Aktuální menu nenalezeno');
  }

  const currentMenu = menus[0];

  const { data: foods, error: foodError } = await supabase
    .from('Food')
    .select('*')
    .eq('menuid', currentMenu.id)
    .order('dayOfWeek', { ascending: true });

  if (foodError) {
    console.error('Chyba při načítání jídel:', foodError);
    throw new Error('Nepodařilo se načíst jídla');
  }

  const mains = foods.filter(f => !f.issoup);
  const soups = foods.filter(f => f.issoup);

  return {
    dateRange: {
      from: currentMenu.datefrom,
      to: currentMenu.dateto
    },
    data: {
      mains,
      soups
    }
  };
}

export async function fetchAllergens() {
  const { data, error } = await supabase
    .from('Allergen')
    .select('*')
    .order('number', { ascending: true }); 

  if (error) throw error;
  return data;
}

export async function getPriceOfTheOrder(foodsInOrder) {
  if (!foodsInOrder || foodsInOrder.length === 0) {
    return 0;
  }
  const foodIds = foodsInOrder.map(food => food.foodId);
  const { data, error } = await supabase
    .from('Food')
    .select('cost')
    .in('id', foodIds);

  if (error) {
    console.error('Chyba při získávání cen jídel:', error.message);
    throw error;
  }

  const totalPrice = data.reduce((sum, food) => sum + food.cost, 0);
  return totalPrice*100; //V haléřích
}

export async function fetchMenuWithFoods() {
  // Získání nejnovějšího menu
  const { data: menus, error: menuError } = await supabase
    .from('Menu')
    .select('*')
    .order('datefrom', { ascending: false })
    .limit(1);

  if (menuError || !menus?.length) {
    console.error('Chyba při načítání menu:', menuError);
    throw new Error('Nepodařilo se načíst menu');
  }

  const currentMenu = menus[0];

  // Načtení jídel podle menu ID
  const { data: foods, error: foodError } = await supabase
    .from('Food')
    .select('*')
    .eq('menuid', currentMenu.id)
    .order('dayOfWeek', { ascending: true });

  if (foodError) {
    console.error('Chyba při načítání jídel:', foodError);
    throw new Error('Nepodařilo se načíst jídla');
  }

  const mains = foods.filter(f => !f.issoup);
  const soups = foods.filter(f => f.issoup);

  return {
    dateRange: {
      from: currentMenu.datefrom,
      to: currentMenu.dateto
    },
    data: {
      mains,
      soups
    }
  };
}
