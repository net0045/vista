export const sendEmail = async (email, code) => {
  try {
    const res = await fetch('/.netlify/functions/sendEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    return res.status === 201;
  } catch (err) {
    console.error('Chyba při proxy volání:', err);
    return false;
  }
};
