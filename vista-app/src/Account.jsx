import React, { useState, useEffect} from 'react';
import './Account.css'; // Import Account-specific styles
import { useNavigate} from 'react-router-dom';
import { getCookie, verifyToken, getSecretKey } from './lib/jwtHandler';

function Account() {
    const navigate = useNavigate();
    const [isUserVerified, setIsUserVerified] = useState(false);
    const [email, setEmail] = useState('');

    const navigateToOrders = async () => {
       navigate('/myorders');
    }

    const navigateToMenu = async () => {
        navigate('/menu');
    }

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
    
                if (payload.email && payload.verified) {
                    setEmail(payload.email);
                    setIsUserVerified(payload.verified);    
                } else {
                    console.warn('[JWT] Payload nemá email nebo verified');
                }
            };
    
            checkToken();
        }, []);
    
    return (
        <div className="content">
             <div className="email-top">
                <b>{email}</b>
            </div>

            <div className="logo">
                <h3>Vítej na stránce účtu!</h3>
                <img
                    src="./src/assets/account-icon.png"
                    alt="Icon Account"
                    className="account-icon"
                />
            </div>
            
            <div className="account-options">
                <button className="account-button-menu" onClick={navigateToMenu}>Týdenní Menu / Weekly Menu</button>
                <button className="account-button-orders" onClick={navigateToOrders}>Moje Objednávky / My Orders</button>
            </div>
        </div>
    );
}

export default Account;
