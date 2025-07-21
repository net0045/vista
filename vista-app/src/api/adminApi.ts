import { supabase } from '../lib/supabaseClient'
import { Food } from '../types/Food'; 

export async function getAllFoods(): Promise<Food[]> {
    const { data, error } = await supabase.from('Food').select('*');
    if (error) throw error;
    return data;
}


export async function getTomorrowOrders(): Promise<any[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      date,
      user:User (
        id,
        surname
      ),
      FoodsInOrder (
        mealNumber,
        food:Food (
          item,
          cost
        )
      )
    `);

  if (error) throw error;

  // Získání zítřejšího data
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = `${tomorrow.getDate()}. ${tomorrow.getMonth() + 1}. ${tomorrow.getFullYear()}`;

  // Porovnání s koncem stringu
  const filtered = (data || []).filter((order) =>
    order.date?.trim().endsWith(dateStr)
  );

  return filtered;
}


export async function getOverviewData(): Promise<any[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      date,
      dateOfOrder,
      user:User (
        surname,
        email
      ),
      FoodsInOrder (
        mealNumber,
        picked,
        food:Food (
          cost
        )
      )
    `)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}


export async function removeOrderAndFoodsInOrderByOrderId(orderId: string): Promise<void> {
  // 1. Smazat foodInOrder záznamy
  const { error: foodError } = await supabase
    .from('FoodsInOrder')
    .delete()
    .eq('orderId', orderId);

  if (foodError) {
    throw new Error(`Chyba při mazání jídel v objednávce: ${foodError.message}`);
  }

  // 2. Smazat samotnou objednávku
  const { error: orderError } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (orderError) {
    throw new Error(`Chyba při mazání objednávky: ${orderError.message}`);
  }
}