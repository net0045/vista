import React, { useState, useEffect } from 'react';
import './Admin.css'; 
import { useNavigate } from 'react-router-dom';
import bcrypt from 'bcryptjs';
import { getUserByEmail, getUserHashedPassword } from './api/userApi';
import { createToken, getCookie, verifyToken, getSecretKey } from './lib/jwtHandler';

function Admin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [user, setUser] = useState(null);

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
      return;
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
          admin: userData.admin,
          surname: userData.surname,
        };

        if (userData.admin) {
          showMessage('Přihlášení proběhlo úspěšně! Máte práva ADMIN.', 'success');
          setTimeout(() => {
            navigate('/admin/import');
          }, 1500);
        } else {
          showMessage('Nemáte práva ADMIN.', 'error');
          setTimeout(() => {
            navigate('/account');
          }, 1500);
        }

        const token = await createToken(payloadToken);
        document.cookie = `authToken=${token}; path=/; secure; samesite=strict`;
        
      } else {
        showMessage('Nesprávné heslo nebo email. Zkuste to znovu.', 'warning');
      }
    } catch (err) {
      console.error('[HASH] Chyba při hashování hesla:', err.message);
    }
  };

  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        setShowPopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  return (
    <div className="admin-container">
      <div className="admin-navigation">
        <div>
          <button
            className="admin-backToAccButton"
            onClick={() => navigate('/account')}
          >
            ZPĚT NA ÚČET
          </button>
        </div>
      </div>

      <div className="content-row">
        <div className="admin-signin">
          <input
            className="input-bar-signin"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input-bar-signin"
            placeholder="Heslo / Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="submit-button"
            onClick={handleSubmitLogin}
          >
            Potvrdit / Submit
          </button>

          {showPopup && (
            <div className={`message-popup ${messageType}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;
