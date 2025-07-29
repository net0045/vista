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
    AUTHCODE,
    SHA1HASH
  } = result;

  const SECRET = process.env.VITE_GP_APP_SECRET;

  const toHash = `${TIMESTAMP}.${MERCHANT_ID}.${ORDER_ID}.${RESULT}.${MESSAGE}.${PASREF}.${AUTHCODE}`;
  const firstHash = crypto.createHash("sha1").update(toHash).digest("hex");
  const finalHash = crypto.createHash("sha1").update(`${firstHash}.${SECRET}`).digest("hex");

  const isValid = SHA1HASH?.toLowerCase() === finalHash?.toLowerCase();
  console.log("Result:", result);
  if (!isValid) {
    console.error("❌ Invalid hash:", {
      toHash,
      firstHash,
      finalHash,
      receivedHash: SHA1HASH
    });
    return {
      statusCode: 400,
      body: "❌ Neplatný podpis (hash nesouhlasí).",
    };
  }

  const baseUrl = event.headers.origin || 'https://ephemeral-kleicha-80352a.netlify.app';
  const successUrl = `${baseUrl}/payment?id=${ORDER_ID}&status=success`;
  const failUrl = `${baseUrl}/payment?id=${ORDER_ID}&status=fail`;

  const redirectUrl = RESULT === "00" && isValid ? successUrl : failUrl;

  console.log(" Redirecting to:", redirectUrl);

  return {
  statusCode: 200,
  headers: {
    'Content-Type': 'text/html',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
  },
  body: `
    <html>
      <head>
        <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
        <title>Redirecting...</title>
      </head>
      <body>
        <p>Redirecting to <a href="${redirectUrl}">${redirectUrl}</a></p>
      </body>
    </html>
  `
};
}
