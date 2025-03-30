/**
 * Utilidades para generación de hashes
 */
export class HashUtils {
    /**
     * Genera un hash SHA-1 a partir de una cadena
     * (Implementación simple para navegadores)
     */
    public static async sha1(message: string): Promise<string> {
      // Usar la API Web Crypto si está disponible
      if (window.crypto && window.crypto.subtle) {
        try {
          const msgUint8 = new TextEncoder().encode(message);
          const hashBuffer = await window.crypto.subtle.digest('SHA-1', msgUint8);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
          // Si falla crypto API, usar fallback
          console.warn('Crypto API failed, using fallback hash:', error);
          return HashUtils.simpleSHA1(message);
        }
      }
      
      // Fallback para navegadores antiguos
      return HashUtils.simpleSHA1(message);
    }
    
    /**
     * Implementación básica de hash para fallback
     * (No es criptográficamente segura)
     */
    private static simpleSHA1(message: string): string {
      let hash = 0;
      if (message.length === 0) return hash.toString(16);
      
      for (let i = 0; i < message.length; i++) {
        const char = message.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      // Convertir a hexadecimal
      const hashHex = (hash >>> 0).toString(16);
      return hashHex.padStart(8, '0');
    }
    
    /**
     * Genera un ID único con timestamp
     */
    public static generateId(): string {
      return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
  }