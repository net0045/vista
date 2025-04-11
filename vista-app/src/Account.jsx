import React from 'react';
import './App.css';
import './Account.css'; // Import Account-specific styles

function Account() {
    
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
                <button className="account-button-menu">Týdenní Menu / Weekly Menu</button>
                <button className="account-button-orders">Moje Objednávky / My Orders</button>
            </div>
        </div>
    );
}

export default Account;
