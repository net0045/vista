import fetch from 'node-fetch';

export async function handler(event, context) {
  try {
    const { amount, currency, orderId } = JSON.parse(event.body);

    const appId = "dh9faaq6uc64GFA027cGdUApXqCfbmDm";
    const appKey = "ostRCFSlSkAfwm1W";
    const base64auth = Buffer.from(`${appId}:${appKey}`).toString('base64');

    // 1. Získání access tokenu
    const tokenRes = await fetch('https://apis.sandbox.globalpay.com/ucp/auth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${base64auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-GP-Version': '2020-12-22'
      },
      body: 'grant_type=client_credentials'
    });

    const tokenData = await tokenRes.json();
    console.log("Token response:", tokenData);

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      throw new Error("Access token chybí: " + JSON.stringify(tokenData));
    }

    // 2. Vytvoření platby (order)
    const paymentRes = await fetch('https://apis.sandbox.globalpay.com/ucp/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-GP-Version': '2020-12-22'
      },
      body: JSON.stringify({
        amount: {
          value: amount,
          currency: currency
        },
        merchantTransactionReference: orderId,
        returnUrl: "http://localhost:5173/"
      })
    });

    const paymentData = await paymentRes.json();
    console.log("Payment response:", paymentData);

    const redirectUrl = paymentData?._links?.redirect?.href;
    if (!redirectUrl) {
      throw new Error("Redirect URL chybí: " + JSON.stringify(paymentData));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ redirectUrl })
    };

  } catch (err) {
    console.error("CHYBA:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
