import { supabase } from '../lib/supabaseClient'
import { User } from '../types/User'; 

/**
 * Získá uživatele podle émailu
 * @param email - email uživatele
 * @returns User | null - vrací objekt uživatele nebo null, pokud uživatel neexistuje
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('User') 
        .select('*')
        .eq('email', email)
        .single()
  
      if (error) {
        console.error('Uživatel s tímto emailem neexistuje!', error.message)
        return null
      }
  
      return data as User
    } catch (error) {
      console.error('Nečekaná chyba:', error)
      return null
    }
}

/** * Oveří, zda je uživatel ověřen
 * @param user - objekt uživatele
 * @return boolean - true pokud je uživatel ověřen, jinak false
 * 
 */
export const isUserVerified = (user: User): boolean => {
    return user.verified === true
}
/**
 * Uloží ověřovací kód pro uživatele
 * @param email 
 * @param code 
 * @returns boolean - true pokud bylo uložení úspěšné, jinak false
 * 
 */
export const saveVerifyCode = async (email: string, code: string): Promise<boolean> => {
    const expire_date = new Date(Date.now() + 10 * 60 * 1000); // platnost 10 minut

    const { error } = await supabase
        .from('User')
        .update({ verify_code: code, code_expires: expire_date })
        .eq('email', email);

    if (error) {
        console.error('Chyba při ukládání ověřovacího kódu:', error.message);
        return false;
    }

    return true;
}

export const saveUserPassword = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase 
        .from('User')
        .update({ password })
        .eq('email', email); 
    
    if (error) {
        console.error('Chyba při ukládání hesla:', error.message);
        return false;
    }
    return true;
}

/**
 * Vrací ověřovací kód pro daný email
 * @param email 
 * @returns string | null - vrací ověřovací kód nebo null, pokud kód neexistuje 
 */
export const getVerifyCode = async (email: string): Promise<string | null> => {
    const { data, error } = await supabase
        .from('User')
        .select('verify_code')
        .eq('email', email)
        .single();

    if (error) {
        console.error('Chyba při získávání ověřovacího kódu:', error.message);
        return null;
    }

    return data?.verify_code || null;
}

export const changeVerifiedStatus = async (email: string, status: boolean): Promise<boolean> => {
    const { error } = await supabase
        .from('User')
        .update({ verified: status })
        .eq('email', email);

    if (error) {
        console.error('Chyba při změně ověřovacího stavu:', error.message);
        return false;
    }

    return true;
}

export const sendVerificationEmail = async (email: string, code: string): Promise<boolean> => {
  try {
    const res = await fetch('http://localhost:3000/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    return res.ok;
  } catch (err) {
    console.error('Chyba při odesílání emailu:', err);
    return false;
  }
};
