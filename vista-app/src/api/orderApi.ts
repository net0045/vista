import { supabase } from '../lib/supabaseClient'
import { OrderObject } from '../types/order'
import { FoodsInOrder } from '../types/FoodsInOrder';


export const storeOrder = async (order: any) => {
    const orderObject: OrderObject = {
        id: order.id,
        userId: order.userId,
        date: order.date,
        dateOfOrder: order.dateOfOrder,
        ispaid: order.ispaid
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
        orderId: food.orderId
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