import { supabase } from '../lib/supabaseClient'
import { Food } from '../types/Food'; 

export async function getAllFoods(): Promise<Food[]> {
    const { data, error } = await supabase.from('Food').select('*');
    if (error) throw error;
    return data;
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