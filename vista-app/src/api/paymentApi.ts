import { supabase } from '../lib/supabaseClient'


export const createPaymentApiCall = async (orderId, amount, currency) => {
  try {
    const res = await fetch("/.netlify/functions/realex-hash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amount, 
            currency: currency, 
            orderId: orderId,
          }),
        });

    if (!res.ok) {
      throw new Error(`Chyba při volání backendu: ${res.status}`);
    }

    return await res; 
  } catch (err) {
    console.error("Chyba v createPayment:", err);
    throw err;
  }
};

export const changePaymentStatus = async (orderId) => {
  try {
    const { data, error } = await supabase
      .from('Order')
      .update({ isPaid: true })
      .eq('id', orderId)
      .select();

    if (error) {
      console.error('Chyba při aktualizaci stavu platby:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Chyba v changePaymentStatus:", err);
    throw err;
  }
}



