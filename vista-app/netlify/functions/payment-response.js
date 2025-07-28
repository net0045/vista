// netlify/functions/payment-response.js
import crypto from 'crypto';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const formData = new URLSearchParams(event.body);
  const result = Object.fromEntries(formData.entries());

  const {
    MERCHANT_ID,
    ORDER_ID,
    AMOUNT,
    CURRENCY,
    TIMESTAMP,
    RESULT,
    MESSAGE,
    PASREF,
    AUTHCODE,
    SHA1HASH
  } = result;

  const secret = process.env.VITE_GP_APP_SECRET;

  // Realex SHA1 hash ověření
  const toHash = `${TIMESTAMP}.${MERCHANT_ID}.${ORDER_ID}.${AMOUNT}.${CURRENCY}.${RESULT}.${MESSAGE}.${PASREF}.${AUTHCODE}`;
  const firstHash = crypto.createHash("sha1").update(toHash).digest("hex");
  const finalHash = crypto.createHash("sha1").update(`${firstHash}.${secret}`).digest("hex");

  const isValid = SHA1HASH === finalHash;

  if (!isValid) {
    return {
      statusCode: 400,
      body: "Neplatný podpis. Platbu nelze ověřit.",
    };
  }

  // Úspěšná platba?
  if (RESULT === "00") {
    // můžeš aktualizovat DB - orderId je v ORDER_ID
    return {
      statusCode: 302,
      headers: {
        Location: `${process.env.REDIRECT_SUCCESS_URL}?id=${ORDER_ID}`,
      },
      body: "",
    };
  } else {
    return {
      statusCode: 302,
      headers: {
        Location: `${process.env.REDIRECT_FAILURE_URL}?id=${ORDER_ID}`,
      },
      body: "",
    };
  }
}
