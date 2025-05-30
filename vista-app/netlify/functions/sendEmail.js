const axios = require('axios');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  const { email, code } = JSON.parse(event.body || '{}');

  if (!email || !code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing email or code' }),
    };
  }

  const apiKey = process.env.VITE_BREVO_API_KEY;
  const sender = { name: 'Vista App', email: 'netolickystepan@seznam.cz' };

  const data = {
    sender,
    to: [{ email }],
    subject: 'Ověřovací kód',
    htmlContent: `
    <h1>Ověřovací kód pro Vista App</h1>
    <p>Vážený uživateli,</p>
    <p>děkujeme, že jste se zaregistrovali do naší aplikace Vista App. Pro dokončení ověření prosím zadejte následující ověřovací kód:</p>
    <p><strong>${code}</strong></p>
    <p>Kod je platný po dobu 10 minut. Pokud jste se nezaregistrovali, prosím ignorujte tento email.</p>
    <p>S pozdravem,<br>tým Vista App</p>
    `,
  };

  try {
    const res = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('📬 Brevo response:', res.status, res.data); // ← tohle ti ukáže, jestli to prošlo

    return {
      statusCode: res.status,
      body: JSON.stringify({ success: true, brevo: res.data }),
    };
  } catch (err) {
    console.error('❌ Chyba při odesílání emailu:', err.response?.data || err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Chyba při odesílání emailu' }),
    };
  }

};
