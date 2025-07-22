const crypto = require('crypto');

exports.handler = async (event) => {
  try {
    const { currency, amount, orderId } = JSON.parse(event.body);

    // Zkontroluj vstup
    if (!currency || !amount || !orderId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Chybí parametry' }),
      };
    }

    const MERCHANT_ID = process.env.VITE_GP_MERCHANT_ID; 
    const SECRET = process.env.VITE_GP_APP_KEY;
    const RETURN_URL = 'https://ephemeral-kleicha-80352a.netlify.app/payment-result'; // přizpůsobit

    const TIMESTAMP = new Date().toISOString().replace(/[-:.TZ]/g, '');

    // Podpis
    const dataToSign = `${TIMESTAMP}.${MERCHANT_ID}.${orderId}.${amount}.${currency}`;
    const sha1hash = crypto
      .createHash('sha1')
      .update(`${dataToSign}.${SECRET}`)
      .digest('hex');

    // Parametry pro HPP
    const paymentParams = {
      TIMESTAMP,
      MERCHANT_ID,
      ORDER_ID: orderId,
      AMOUNT: amount,
      CURRENCY: currency,
      SHA1HASH: sha1hash,
      AUTO_SETTLE_FLAG: 1,
      COMMENT1: 'Objednávka přes Netlify',
      RETURN_URL,
    };

    // Vytvoř URL s parametry
    const queryString = new URLSearchParams(paymentParams).toString();
    const hppUrl = `https://pay.sandbox.realexpayments.com/pay?${queryString}`; // Sandbox URL Needs update 

    return {
      statusCode: 200,
      body: JSON.stringify({ redirectUrl: hppUrl }),
    };

  } catch (error) {
    console.error('Chyba v createPayment:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Chyba na serveru při vytváření platby' }),
    };
  }
};
