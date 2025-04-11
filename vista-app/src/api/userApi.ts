import { supabase } from '../lib/supabaseClient'
import { User } from '../types/User'; 

/**
 * Získá uživatele podle emailu
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

/**
 * Zjistí, zda je uživatel ověřený
 */
export const isUserVerified = (user: User): boolean => {
    return user.verified === true
  }