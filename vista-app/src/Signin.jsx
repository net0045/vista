import React, { useState, useEffect } from 'react';
import './Signin.css';
import { useNavigate } from 'react-router-dom';
import { getUserByEmail, getUserHashedPassword } from './api/userApi';
import bcrypt from 'bcryptjs';
import { createToken, getCookie, verifyToken, getSecretKey } from './lib/jwtHandler';

function Signin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [user, setUser] = useState('');

    const showMessage = (text, type = 'info') => {
        setMessage(text);
        setMessageType(type);
        setShowPopup(true);
    };

    const handleSubmitLogin = async () => {
        if (!email || !password) {
            showMessage('Vyplňte prosím všechny údaje.', 'warning');
            return;
        }

        if (!email.includes('@')) {
            showMessage('Zadejte platný email.', 'warning');
        }

        const storedUserHashedPassword = await getUserHashedPassword(email);
        if (!storedUserHashedPassword) {
            showMessage('Nastala neočekávaná chyba při kontrole hesel. Zkontrolujte své údaje.', 'error');
            return;
        }

        try {
            const isMatch = await bcrypt.compare(password, storedUserHashedPassword);
            const userData = await getUserByEmail(email);
            if (userData) {
                setUser(userData);
            }

            if (isMatch) {
                const payloadToken = {
                    userId: userData.id,
                    email: email,
                    verified: true, 
                    isPassword: true,
                    surname: userData.surname, 
                };
                const token = await createToken(payloadToken);
                document.cookie = `authToken=${token}; path=/; secure; samesite=strict`;
                showMessage('Přihlášení proběhlo úspěšně! Budete přesměrováni na váš účet.', 'success');

                setTimeout(() => {
                    navigate('/account');
                }, 1500);
            } else {
                showMessage('Nesprávné heslo nebo email. Zkuste to znovu.', 'warning');
            }
        } catch (err) {
            console.error('[HASH] Chyba při hashování hesla:', err.message);
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
    
                if (payload.email && payload.isPassword && payload.verified === true) {
                        showMessage('Jste již přihlášeni. Přesměrování na váš účet.', 'info');
                        setTimeout(() => {
                            navigate('/account');
                        }, 1500);
                   
                } else {
                    console.warn('[JWT] Payload nemá platné údaje, vyžaduje přihlášení.');
                }
            };
    
            checkToken();
        }, []);

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
            <div className="logo">
                <h3>Vítej na stránce účtu! <br /> Welcome to the account page!</h3>
                <img src="/images/account-icon.png" alt="Icon Account" className="account-icon"/>
            </div>
            <div className="form-signin">
                <div className='inputs-signin'>
                    <input className="input-bar-signin" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}/>
                    <div className="input-wrapper-signin">
                        <input
                            className="input-bar-signin"
                            type={showPassword ? "text" : "password"}
                            placeholder="Heslo / Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <span
                            className="eye-icon-signin"
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
                </div>
                

                <button type="submit" className="submit-button" onClick={handleSubmitLogin} >
                    Potvrdit / Submit
                </button>

                <p style={{ color: 'white' }}>{message}</p>
            </div>
            {showPopup && (
                <div className={`message-popup ${messageType}`}>
                    {message}
                </div>
            )}
        </div>
    );
}

export default Signin;
