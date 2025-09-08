import React, { useState, useEffect } from 'react';
import './Account.css';
import { useNavigate } from 'react-router-dom';
import { getCookie, verifyToken, getSecretKey, deleteCookie } from './lib/jwtHandler';
import { supabase } from './lib/supabaseClient';

function Account() {
    const navigate = useNavigate();
    const [isUserVerified, setIsUserVerified] = useState(false);
    const [email, setEmail] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    const logout = () => {
        deleteCookie('authToken');
        navigate('/login');
    };

    const navigateToOrders = () => {
        navigate('/myorders');
    };

    const navigateToMenu = () => {
        navigate('/menu');
    };

    const navigateToAdmin = () => {
        navigate('/admin');
    };

    const navigateToMessages = () => {
        navigate('/messages');
    };

    useEffect(() => {
        const checkToken = async () => {
            const token = getCookie('authToken');
            if (!token) return; 

            const payload = await verifyToken(token, getSecretKey());
            if (!payload) {
                console.warn('[JWT] Žádný payload (token neplatný)');
                return;
            }

            if (payload.email && payload.verified) {
                setEmail(payload.email);
                setIsUserVerified(payload.verified);

                // Zjisti, jestli je uživatel admin
                const { data, error } = await supabase
                    .from('User')
                    .select('admin')
                    .eq('email', payload.email)
                    .single();

                if (error) {
                    console.warn('[Supabase] Chyba při kontrole admin:', error);
                } else if (data && data.admin === true) {
                    setIsAdmin(true);
                }
            } else {
                console.warn('[JWT] Payload nemá email nebo verified');
            }
        };

        checkToken();
    }, []);

    return (
        <div className="content">
            <div className="header-bar">
                <button className="logout-button" onClick={logout}>Odhlásit se / Logout</button>
                {isAdmin && (
                    <button className="logout-button" onClick={navigateToAdmin}>ADMIN</button>
                )}
            </div>
            <b className="email-label">{email}</b>
            <div className="logo">
                <img
                    src="/images/account-icon.png"
                    alt="Icon Account"
                    className="account-icon"
                />
            </div>
            <div className="account-options">
                <button className="account-button-menu" onClick={navigateToMenu}>
                    Týdenní Menu <br />
                    <span className='weekly-menu-my-orders'>Weekly Menu</span>
                </button>
                <button className="account-button-orders" onClick={navigateToOrders}>
                    Moje Objednávky <br />
                    <span className='weekly-menu-my-orders'>My Orders</span>
                </button>
                <button className="account-button-messages" onClick={navigateToMessages}>
                    Zprávy <br />
                    <span className='weekly-menu-my-orders'>Messages</span>
                </button>
            </div>
        </div>
    );
}

export default Account;
