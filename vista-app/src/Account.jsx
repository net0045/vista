import React from 'react';
import './Account.css'; // Import Account-specific styles
import { useNavigate } from 'react-router-dom';

function Account() {
    const navigate = useNavigate();
    const navigateToOrders = async () => {
       navigate('/myorders');
    }

    const navigateToMenu = async () => {
        navigate('/menu');
    }
    
    return (
        <div className="content">
           
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
