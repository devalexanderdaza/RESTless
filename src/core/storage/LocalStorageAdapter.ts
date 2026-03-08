import { StorageAdapter } from './StorageAdapter';

/**
 * Adaptador de almacenamiento que utiliza localStorage
 */
export class LocalStorageAdapter implements StorageAdapter {
  /**
   * Guarda datos en localStorage
   */
  async save(key: string, data: any): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
      throw new Error(`Error al guardar datos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Carga datos desde localStorage
   */
  async load(key: string): Promise<any> {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error al cargar desde localStorage:', error);
      throw new Error(`Error al cargar datos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Elimina datos de localStorage
   */
  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error al eliminar de localStorage:', error);
      throw new Error(`Error al eliminar datos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Limpia todo el localStorage relacionado con la aplicación
   */
  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
      throw new Error(`Error al limpiar almacenamiento: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Verifica si la clave existe en localStorage
   */
  async has(key: string): Promise<boolean> {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error('Error al verificar clave en localStorage:', error);
      throw new Error(`Error al verificar existencia: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}