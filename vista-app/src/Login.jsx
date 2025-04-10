import React from 'react';
import './Login.css'; // Import Login-specific styles
import { useNavigate } from 'react-router-dom';
import './App.css'; // Import App styles

function Login() {
    const navigate = useNavigate();
    const handleSubmit = () => {
        // případná validace emailu atd.
        navigate('/account');
    }; 

    return (
        <div className='content'>
            <div className="logo-login">
                <img
                src="./src/assets/logo-vista.png"
                alt="Logo studentské koleje Vista"
                className="logo-image-vista"
                />
            </div>
            <div className='form'>
                <input className="input-bar" type="text" placeholder="Email" />
                <button type="submit" className="submit-button" >Potvrdit</button>
            </div>
        </div>
    );
}

export default Login;