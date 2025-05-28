import React, { useState, useEffect } from 'react';
import './Verify.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { getUserByEmail, isUserVerified, getVerifyCode, changeVerifiedStatus } from './api/userApi';
import { createToken } from './lib/jwtHandler';

function Verify() {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const emailFromQuery = queryParams.get('email') || '';;
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showPopup, setShowPopup] = useState(false);

    const showMessage = (text, type = 'info') => {
        setMessage(text);
        setMessageType(type);
        setShowPopup(true);
    };

    const handleSubmit = async () => {
        console.log('Zadaný Ověřovací kód:', code);
        console.log('Email:', email);

        const user = await getUserByEmail(email);
        if (!user) {
            showMessage('Uživatel nenalezen.', 'error');
            return;
        }

        const verifyCode = await getVerifyCode(email);
        const codeExpires = new Date(user.code_expires);
        const now = new Date();

        if (!isUserVerified(user)) {
            if (codeExpires.getTime() < now.getTime()) {
                showMessage('Ověřovací kód vypršel. Vygeneruj nový.', 'error');
                setTimeout(() => navigate('/login'), 2000);
                return;
            }

            if (code !== verifyCode) {
                showMessage('Neplatný ověřovací kód.', 'error');
                return;
            }

            const { error } = await changeVerifiedStatus(email, true);
            if (error) {
                showMessage('Chyba při ověřování uživatele.', 'error');
            } else {
                const payloadToken = {
                    email: user.email,
                    verified: true
                };
                const token = await createToken(payloadToken);
                document.cookie = `authToken=${token}; path=/; secure; samesite=strict`; // Uložení tokenu do cookie
                showMessage('Uživatel byl úspěšně ověřen.', 'success');
                setTimeout(() => navigate('/login'), 1000); //TODO: Přesměrování na vytvoření hesla a pak předělání loginu s JWT atd...Zde se musí vytvořit JWT token s emailem a verification statusem uživatele
            }
        } else {
            showMessage('Uživatel je již ověřen.', 'info');
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

        setEmail(emailFromQuery); // Nastav email z query parametru
    }, [showPopup, emailFromQuery]);

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
                    placeholder="Verification Code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
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

export default Verify;
