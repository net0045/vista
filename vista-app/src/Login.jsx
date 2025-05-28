import React, { useState, useEffect } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import { getUserByEmail, isUserVerified, saveVerifyCode, sendVerificationEmail } from './api/userApi';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showPopup, setShowPopup] = useState(false);

    const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

    const showMessage = (text, type = 'info') => {
        setMessage(text);
        setMessageType(type);
        setShowPopup(true);
    };

    const handleSubmit = async () => {
        if (!email.includes('@')) {
            showMessage('Neplatný email.', 'error');
            return;
        }

        const user = await getUserByEmail(email);

        // Zjisti, jestli existuje uživatel
        if (!user) {
            showMessage('Uživatel s tímto emailem neexistuje.', 'warning');
            return;
        }

        if (isUserVerified(user)) {
            showMessage('Uživatel je již ověřen.', 'success');
            setTimeout(() => navigate('/account'), 1000);
            return;
        }

        const code = generateCode();

        if (code) {
            const success_code = await saveVerifyCode(email, code)
            if (success_code) {
                const sent = true; // Simulace odeslání emailu, zde budeme volat potom sendVerificationEmail(email, code);
                //const sent = await sendVerificationEmail(email, code); 
                if (sent) {
                    showMessage('Ověřovací kód byl odeslán na tvůj email.', 'success');
                    setTimeout(() => navigate(`/verify?email=${email}`), 2000);
                } else {
                    showMessage('Nepodařilo se odeslat email.', 'error');  
                }
            }
        }
    };

    // Automatické skrytí popupu
    useEffect(() => {
        if (showPopup) {
            const timer = setTimeout(() => {
                setShowPopup(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showPopup]);

    return (
        <div className="content">
            <div className="logo-login">
                <img
                    src="./src/assets/logo-vista.png"
                    alt="Logo studentské koleje Vista"
                    className="logo-image-vista"
                />
            </div>
            <div className="form">
                <input
                    className="input-bar"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" className="submit-button" onClick={handleSubmit}>
                    Potvrdit
                </button>
                <p style={{ color: 'white' }}>{message}</p>
            </div>
            {showPopup && (
                <div className={`message-popup ${messageType}`} >
                    {message}
                </div>
            )}
        </div>
    );
}

export default Login;
