import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { email, code } = req.body;
  console.log('Přišel požadavek na odeslání emailu:', email, code); 

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.VITE_SMTP_HOST,
      port: process.env.VITE_SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.VITE_SMTP_USER,
        pass: process.env.VITE_SMTP_PASSWORD,
      },
    });

    const result = await transporter.sendMail({
      from: `"Vista Hotel" <${process.env.VITE_SMTP_USER}>`,
      to: email,
      subject: 'Ověřovací kód',
      html: `<p>Váš kód je: <b>${code}</b></p>`,
    });

    console.log('Email odeslán:', result.accepted); // ✅ Debug
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Chyba při odesílání emailu:', err); // ✅ Zobrazí chybu
    res.status(500).json({ error: err.message });
  }
}
