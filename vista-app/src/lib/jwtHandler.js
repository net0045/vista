import { SignJWT , jwtVerify} from 'jose';

const encoder = new TextEncoder();


const getSecretKey = () => {
  const secret = import.meta.env.VITE_JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return encoder.encode(secret);
}

/**
 * Vytvoří JWT token
 * @param {object} payload - data, která budou v tokenu
 */
export const createToken = async (payload) => {
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
export const verifyToken = async (token) => {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
};