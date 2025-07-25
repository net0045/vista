import crypto from "crypto";

export async function handler(event) {
  const { amount, currency, orderId } = JSON.parse(event.body);

  const merchantId = process.env.VITE_GP_MERCHANT_ID;
  const account = process.env.VITE_GP_ACCOUNT;
  const secret = process.env.VITE_GP_APP_SECRET;

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

  const dataToSign = `${timestamp}.${merchantId}.${orderId}.${amount}.${currency}`;
  const fullData = `${dataToSign}.${secret}`;
  const sha1hash = crypto.createHash("sha1").update(fullData).digest("hex");

  console.log('HASH DEBUG:', {
  merchantId,
  account,
  orderId,
  amount,
  currency,
  timestamp,
  toHash: `${timestamp}.${merchantId}.${orderId}.${amount}.${currency}`,
  fullHashInput: `${timestamp}.${merchantId}.${orderId}.${amount}.${currency}.${secret}`,
  sha1hash
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      timestamp,
      merchantId,
      account,
      orderId,
      amount,
      currency,
      sha1hash,
    }),
  };
}
