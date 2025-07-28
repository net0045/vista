// netlify/functions/payment-response.js
import crypto from 'crypto';

export async function handler(event) {
  console.log("📥 Request body:", event.body);

  if (event.httpMethod !== 'POST') {
    console.warn("❌ Invalid HTTP method:", event.httpMethod);
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let result = {};
  try {
    const formData = new URLSearchParams(event.body);
    result = Object.fromEntries(formData.entries());
    console.log("🧾 Parsed Result:", result);
  } catch (err) {
    console.error("❌ Failed to parse form data:", err);
    return { statusCode: 400, body: 'Invalid form data' };
  }

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
  console.log("🔐 Loaded secret:", !!secret); // Will log true if present

  const toHash = `${TIMESTAMP}.${MERCHANT_ID}.${ORDER_ID}.${AMOUNT}.${CURRENCY}.${RESULT}.${MESSAGE}.${PASREF}.${AUTHCODE}`;
  const firstHash = crypto.createHash("sha1").update(toHash).digest("hex");
  const finalHash = crypto.createHash("sha1").update(`${firstHash}.${secret}`).digest("hex");

  console.log("🧮 Hashing debug:");
  console.log("→ toHash:", toHash);
  console.log("→ firstHash:", firstHash);
  console.log("→ finalHash:", finalHash);
  console.log("→ SHA1HASH from gateway:", SHA1HASH);

  const isValid = SHA1HASH === finalHash;
  console.log("✅ Hash match:", isValid);

  if (!isValid) {
    return {
      statusCode: 400,
      body: "❌ Neplatný SHA1 hash. Podpis nelze ověřit.",
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
