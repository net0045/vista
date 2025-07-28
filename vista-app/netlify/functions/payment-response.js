// netlify/functions/payment-response.js
import crypto from 'crypto';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const formData = new URLSearchParams(event.body);
  const result = Object.fromEntries(formData.entries());

  // Vytažení potřebných polí
  const {
    MERCHANT_ID,
    ORDER_ID,
    AMOUNT,
    TIMESTAMP,
    RESULT,
    MESSAGE,
    PASREF,
    AUTHCODE,
    SHA1HASH
  } = result;

  // HPP neposílá CURRENCY zpět → doplníme ručně:
  const CURRENCY = 'CZK';

  // Secret
  const SECRET = process.env.VITE_GP_APP_SECRET;

  // Hashování
  const toHash = `${TIMESTAMP}.${MERCHANT_ID}.${ORDER_ID}.${AMOUNT}.${CURRENCY}.${RESULT}.${MESSAGE}.${PASREF}.${AUTHCODE}`;
  const firstHash = crypto.createHash("sha1").update(toHash).digest("hex");
  const finalHash = crypto.createHash("sha1").update(`${firstHash}.${SECRET}`).digest("hex");

  // Debug výpis
  console.log("🔐 HPP Response Verification:");
  console.log("→ toHash:", toHash);
  console.log("→ firstHash:", firstHash);
  console.log("→ finalHash:", finalHash);
  console.log("→ SHA1HASH from gateway:", SHA1HASH);

  const isValid = SHA1HASH.toLowerCase() === finalHash.toLowerCase();

  if (!isValid) {
    return {
      statusCode: 400,
      body: "❌ Neplatný podpis. Hash nesouhlasí.",
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
