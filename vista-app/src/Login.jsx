import React, { useState, useEffect } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import { getUserByEmail, saveVerifyCode, saveUserPassword } from './api/userApi';
import { getCookie, verifyToken, getSecretKey } from './lib/jwtHandler';
import bcrypt from 'bcryptjs';

function Login() {
    const [isUserVerified, setIsUserVerified] = useState(false);
    const [user, setUser] = useState();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


    const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

    const showMessage = (text, type = 'info') => {
        setMessage(text);
        setMessageType(type);
        setShowPopup(true);
    };

    const handleSubmitPassword = async () => {
        if (password !== confirmPassword) {
            showMessage('Hesla se neshodují!', 'error');
            return;
        }

        if (password.length < 6) {
            showMessage('Heslo musí mít alespoň 6 znaků.', 'error');
            return;
        }


        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const success = await saveUserPassword(email, hashedPassword);
            if (success) {
                showMessage('Heslo bylo nastaveno.', 'success');
                setTimeout(() => navigate('/account'), 1500);
            } else {
                showMessage('Nepodařilo se uložit heslo.', 'error');
            }
        } catch (err) {
            console.error('[HASH] Chyba při hashování hesla:', err.message);
            showMessage('Nastala chyba při ukládání hesla.', 'error');
        }
    };

    const handleSubmit = async () => {
        if (!email.includes('@')) {
            showMessage('Neplatný email.', 'error');
            return;
        }

        const user = await getUserByEmail(email);

        if (!user) {
            showMessage('Uživatel s tímto emailem neexistuje.', 'warning');
            return;
        }

        if (user.verified) {
            showMessage('Uživatel je již ověřen.', 'success');
            setTimeout(() => navigate('/account'), 1000);
            return;
        }

        const code = generateCode();
        const success_code = await saveVerifyCode(email, code);

        if (success_code) {
            const sent = true; // simulace odeslání e-mailu
            if (sent) {
                showMessage('Ověřovací kód byl odeslán na tvůj email.', 'success');
                setTimeout(() => navigate(`/verify?email=${email}`), 2000);
            } else {
                showMessage('Nepodařilo se odeslat email.', 'error');
            }
        }
    };

    // Kontrola tokenu při načtení
    useEffect(() => {
        const checkToken = async () => {
            const token = getCookie('authToken');

            if (!token) return;

            const payload = await verifyToken(token, getSecretKey());

            if (!payload) {
                console.warn('[JWT] Žádný payload (token neplatný)');
                return;
            }

            if (payload.email && payload.verified === true) {
                const userData = await getUserByEmail(payload.email);
                if (userData) {
                    setUser(userData);
                    setEmail(payload.email);
                    setIsUserVerified(true);
                }
            } else {
                console.warn('[JWT] Payload nemá email nebo verified !== true');
            }
        };

        checkToken();
    }, []);



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

            {isUserVerified ? (
                <div className="form">
                    <div className="input-wrapper-email">
                        <input
                            className="input-bar"
                            type="email"
                            placeholder="Email"
                            value={email}
                            disabled
                        />
                    </div>

                    <div className="input-wrapper">
                        <input
                            className="input-bar"
                            type={showPassword ? "text" : "password"}
                            placeholder="Vaše heslo"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <span
                            className="eye-icon"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none"
                                stroke="#0071a9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                viewBox="0 0 24 24">
                                <path d="M1 12s4-8 11-8 11 8 11 8
                                -4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg> : <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none"
                                stroke="#0071a9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                viewBox="0 0 24 24">
                                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8
                                a20.86 20.86 0 0 1 5.17-5.88" />
                                <path d="M1 1l22 22" />
                                <path d="M9.53 9.53a3.5 3.5 0 0 0 4.95 4.95" />
                                <path d="M14.12 14.12L9.88 9.88" />
                            </svg>}
                        </span>
                    </div>

                    <div className="input-wrapper">
                        <input
                            className="input-bar"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Potvrďte heslo"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <span
                            className="eye-icon"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none"
                                stroke="#0071a9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                viewBox="0 0 24 24">
                                <path d="M1 12s4-8 11-8 11 8 11 8
                                -4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg> : <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none"
                                stroke="#0071a9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                viewBox="0 0 24 24">
                                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8
                                a20.86 20.86 0 0 1 5.17-5.88" />
                                <path d="M1 1l22 22" />
                                <path d="M9.53 9.53a3.5 3.5 0 0 0 4.95 4.95" />
                                <path d="M14.12 14.12L9.88 9.88" />
                            </svg>}
                        </span>
                    </div>
                    <div className="input-wrapper">
                        <button type="submit" className="submit-button" onClick={handleSubmitPassword}>
                            Vytvořit heslo
                        </button>
                    </div>

                    <p style={{ color: 'white' }}>{message}</p>
                </div>

            ) : (
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
            )}

            {showPopup && (
                <div className={`message-popup ${messageType}`}>
                    {message}
                </div>
            )}
        </div>
    );
}

export default Login;
