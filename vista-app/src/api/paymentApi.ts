export const createPaymentApiCall = async (currency, amount, orderId) => {
  try {
    const res = await fetch("/.netlify/functions/createPayment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount,
        currency,
        orderId 
      })
    });

    if (!res.ok) {
      throw new Error(`Chyba při volání backendu: ${res.status}`);
    }

    return await res.json(); // očekáváme { redirectUrl }
  } catch (err) {
    console.error("Chyba v createPayment:", err);
    throw err;
  }
};
