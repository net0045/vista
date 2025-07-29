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


