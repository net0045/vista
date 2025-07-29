export const createPaymentApiCall = async (orderId, amount, currency) => {
  try {
    console.log("Creating payment for order:", orderId, "Amount:", amount, "Currency:", currency);
    const res = await fetch("/.netlify/functions/realex-hash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amount, // Change to amount when ready
            currency: currency, // pokud support nastaví CZK, pak změň
            orderId: orderId,//newOrder.id,
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


