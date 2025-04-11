import React, { useState, useEffect} from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { getUserByEmail, isUserVerified } from './api/userApi';

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
        
        
        //TODO: Vygeneruj ověřovací kód
        const code = generateCode();
        showMessage(`Ověřovací kód: ${code}`, 'success');
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
