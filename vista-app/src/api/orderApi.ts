import { supabase } from '../lib/supabaseClient'
import { OrderObject } from '../types/order'
import { FoodsInOrder } from '../types/FoodsInOrder';

export const getOrderById = async (orderId) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data;
};

export const updateFoodPickedToTrue = async (foodInOrderId) => {
  const { error } = await supabase
    .from('FoodsInOrder')
    .update({ picked: true })
    .eq('id', foodInOrderId);

  if (error) throw error;
};



export const getFoodsInOrder = async (orderId: string) => {
    try {
        const { data, error } = await supabase
            .from('FoodsInOrder')
            .select('*')
            .eq('orderId', orderId);

        if (error) {
            throw error;
        }

        return data;
    } catch (err) {
        console.error('Chyba při načítání objednávek uživatele:', err);
        return [];
    }
};

export const getPaidOrdersForUser = async (userId: string) => {
    try {
        const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('userId', userId)       // správné jméno sloupce
        .eq('ispaid', true)         // pouze zaplacené objednávky (volitelné)

        if (error) {
        throw error;
        }

        return data;
    } catch (err) {
        console.error('Chyba při načítání zaplacených objednávek uživatele:', err);
        return [];
    }
};

export const getAllOrdersForUser = async (userId: string) => {
    try {
        const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('userId', userId)       // správné jméno sloupce
        //.eq('ispaid', true)         // pouze zaplacené objednávky (volitelné)

        if (error) {
        throw error;
        }

        return data;
    } catch (err) {
        console.error('Chyba při načítání objednávek uživatele:', err);
        return [];
    }
};

export const storeOrder = async (order: any) => {
    const orderObject: OrderObject = {
        id: order.id,
        userId: order.userId,
        date: order.date,
        dateOfOrder: order.dateOfOrder,
        ispaid: order.ispaid,
        qrText: order.qrText,
    };

    try {
        const { data, error } = await supabase
        .from('orders')
        .insert([orderObject])
        .select();
    
        if (error) {
        throw error;
        }
    
        return data;
    } catch (error) {
        console.error('Error storing order:', error);
        throw error;
    }
}

export const storeFoodsInOrder = async (foodsInOrder: any[]) => {
    const foodsInOrderObjects: FoodsInOrder[] = foodsInOrder.map(food => ({
        id: food.id,
        foodId: food.foodId,
        orderId: food.orderId,
        mealNumber: food.mealNumber,
        picked: false,
    }));
    try {
        const { data, error } = await supabase
            .from('FoodsInOrder')
            .insert(foodsInOrderObjects)
            .select();

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error storing foods in order:', error);
        throw error;
    }
}

