import crypto from "crypto";

export async function handler(event) {
  const { amount, currency, orderId } = JSON.parse(event.body);

  const merchantId = process.env.VITE_GP_MERCHANT_ID;
  const account = process.env.VITE_GP_ACCOUNT;
  const secret = process.env.VITE_GP_APP_SECRET;

  const testAmount = 12000; // For testing purposes, later use amount but right now its returning 0 for some reason

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

  const dataToSign = `${timestamp}.${merchantId}.${orderId}.${testAmount}.${currency}`; //Change testAmount to amount when ready
  const fullData = `${dataToSign}.${secret}`;
  const sha1hash = crypto.createHash("sha1").update(fullData).digest("hex");

  console.log('HASH DEBUG:', {
  merchantId,
  account,
  orderId,
  amount: testAmount,
  currency,
  timestamp,
  toHash: dataToSign,
  fullHashInput: fullData,
  sha1hash
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      timestamp,
      merchantId,
      account,
      orderId,
      amount: testAmount, // Change to amount when ready
      currency,
      sha1hash,
    }),
  };
}
