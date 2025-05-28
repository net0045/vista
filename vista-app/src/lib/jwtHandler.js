import { SignJWT , jwtVerify} from 'jose';



export const getSecretKey = () => {
  const secret = import.meta.env.VITE_JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return new TextEncoder().encode(secret); // ✅ každý volání nový encoder
};


/**
 * Vytvoří JWT token
 * @param {object} payload - data, která budou v tokenu
 */
export const createToken = async (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload for JWT creation.');
  }

  const expiration = import.meta.env.VITE_JWT_EXPIRATION || '2h';

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(getSecretKey());
};

/**
 * Ověří JWT token a vrátí payload
 */
export const verifyToken = async (token, secretKeyBytes) => {
    try {
        const { payload } = await jwtVerify(token, secretKeyBytes);
        return payload;
    } catch (err) {
        console.warn('[verifyToken] Neplatný nebo expirovaný token:', err.message);
        return null;
    }
};

export const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
};
