import crypto from "crypto";

export async function handler(event) {
  const { amount, currency, orderId } = JSON.parse(event.body);

  const merchantId = process.env.VITE_GP_MERCHANT_ID;
  const account = process.env.VITE_GP_ACCOUNT;
  const secret = process.env.VITE_GP_APP_SECRET;

  console.log('Creating hash for payment:', {
    merchantId,
    account,
    orderId,
    amount,
    currency,
  });

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

  const dataToSign = `${timestamp}.${merchantId}.${orderId}.${amount}.${currency}`; //Change testAmount and orderId to amount when ready
  const firstHash = crypto.createHash("sha1").update(dataToSign).digest("hex");
  const sha1hash = crypto.createHash("sha1").update(`${firstHash}.${secret}`).digest("hex");

  console.log('HASH DEBUG:', {
  merchantId,
  account,
  orderId,
  amount,
  currency,
  timestamp,
  dataToSign,
  firstHash,
  fullHashInput: `${firstHash}.${secret}`,
  sha1hash,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      timestamp,
      merchantId,
      account,
      orderId,
      amount, // Change to amount when ready
      currency,
      sha1hash,
    }),
  };
}
