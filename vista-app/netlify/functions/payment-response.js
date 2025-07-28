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
    TIMESTAMP,
    RESULT,
    MESSAGE,
    PASREF,
    CARDTYPE,
    SHA1HASH
  } = result;

  const SECRET = process.env.VITE_GP_APP_SECRET;

  // Dle oficiální dokumentace Realex pro response:
  const toHash = `${TIMESTAMP}.${MERCHANT_ID}.${ORDER_ID}.${RESULT}.${MESSAGE}.${PASREF}.${CARDTYPE}`;
  const firstHash = crypto.createHash("sha1").update(toHash).digest("hex");
  const finalHash = crypto.createHash("sha1").update(`${firstHash}.${SECRET}`).digest("hex");

  console.log("🔐 HPP Response Verification:");
  console.log("→ toHash:", toHash);
  console.log("→ firstHash:", firstHash);
  console.log("→ finalHash:", finalHash);
  console.log("→ SHA1HASH from gateway:", SHA1HASH);

  const isValid = SHA1HASH.toLowerCase() === finalHash.toLowerCase();

  if (!isValid) {
    return {
      statusCode: 400,
      body: "❌ Neplatný podpis (hash).",
    };
  }


  const successUrl = process.env.REDIRECT_SUCCESS_URL || `${event.headers.origin || 'https://example.com'}/success`;
  const failUrl = process.env.REDIRECT_FAILURE_URL || `${event.headers.origin || 'https://example.com'}/fail`;

  if (RESULT === "00") {
    console.log("🎉 Platba úspěšná. Redirecting to:", successUrl);
    return {
      statusCode: 302,
      headers: {
        Location: `${successUrl}?id=${ORDER_ID}`,
      },
      body: "",
    };
  } else {
    console.log("⚠️ Platba zamítnuta. Redirecting to:", failUrl);
    return {
      statusCode: 302,
      headers: {
        Location: `${failUrl}?id=${ORDER_ID}`,
      },
      body: "",
    };
  }
}
