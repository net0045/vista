import { supabase } from '../lib/supabaseClient'
import { Food } from '../types/Food'; 

export async function getAllFoods(): Promise<Food[]> {
    const { data, error } = await supabase.from('Food').select('*');
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