// netlify/functions/create-payment.js
import fetch from "node-fetch";

export async function handler(event) {
  const { amount, currency, orderId } = JSON.parse(event.body);

  const appId = "tvůj_APP_ID";
  const appKey = "tvůj_APP_KEY";

  const auth = Buffer.from(`${appId}:${appKey}`).toString("base64");

  try {
    // 1) Access token
    const tokenRes = await fetch(
      "https://apis.sandbox.globalpay.com/ucp/auth/token",
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "X-GP-Version": "2021-03-22"
        },
        body: "grant_type=client_credentials"
      }
    );

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error(`Token error: ${JSON.stringify(tokenData)}`);
    }

    const accessToken = tokenData.access_token;

    // 2) Create order (REST)
    const paymentRes = await fetch(
      "https://apis.sandbox.globalpay.com/ucp/orders",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-GP-Version": "2021-03-22"
        },
        body: JSON.stringify({
          amount: {
            value: amount,
            currency: currency
          },
          merchantTransactionReference: orderId
        })
      }
    );

    const paymentData = await paymentRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify(paymentData)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
