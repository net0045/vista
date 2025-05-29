export const sendEmail = async (email, code) => {
    try {
        const res = await fetch("https://backend-vista.vercel.app/api/sendEmail", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, code }),
        });
        return res.ok;
    } catch (err) {
        console.error("Chyba při odesílání emailu:", err);
        return false;
    }
};
