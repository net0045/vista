import crypto from "crypto";

export async function handler(event) {
  const { amount, currency, orderId } = JSON.parse(event.body);

  const merchantId = "dev579703007626245828";
  const account = "internettest";
  const secret = "xZqk2ejFII";

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

  const toHash = `${timestamp}.${merchantId}.${orderId}.${amount}.${currency}`;
  const sha1hash = crypto
    .createHash("sha1")
    .update(`${toHash}.${secret}`)
    .digest("hex");

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
