import { StorageAdapter } from './StorageAdapter';

/**
 * Adaptador de almacenamiento que utiliza IndexedDB
 */
export class IndexedDBAdapter implements StorageAdapter {
  private dbName: string;
  private storeName: string;
  private dbVersion: number;
  private db: IDBDatabase | null = null;

  /**
   * Constructor del adaptador IndexedDB
   * @param dbName Nombre de la base de datos
   * @param storeName Nombre del almacén de objetos
   * @param dbVersion Versión de la base de datos
   */
  constructor(dbName: string = 'restlessDB', storeName: string = 'collections', dbVersion: number = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.dbVersion = dbVersion;
  }

  /**
   * Inicializa la conexión a IndexedDB
   */
  private async connectDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('Error al abrir IndexedDB:', event);
        reject(new Error('No se pudo abrir la base de datos IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Crear el almacén de objetos si no existe
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  /**
   * Guarda datos en IndexedDB
   */
  async save(key: string, data: any): Promise<void> {
    try {
      const db = await this.connectDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const request = store.put(data, key);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => {
          console.error('Error al guardar en IndexedDB:', event);
          reject(new Error('Error al guardar datos en IndexedDB'));
        };
      });
    } catch (error) {
      console.error('Error en operación de IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Carga datos desde IndexedDB
   */
  async load(key: string): Promise<any> {
    try {
      const db = await this.connectDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = (event) => {
          console.error('Error al cargar desde IndexedDB:', event);
          reject(new Error('Error al cargar datos desde IndexedDB'));
        };
      });
    } catch (error) {
      console.error('Error en operación de IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Elimina datos de IndexedDB
   */
  async remove(key: string): Promise<void> {
    try {
      const db = await this.connectDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const request = store.delete(key);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => {
          console.error('Error al eliminar de IndexedDB:', event);
          reject(new Error('Error al eliminar datos de IndexedDB'));
        };
      });
    } catch (error) {
      console.error('Error en operación de IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Limpia todo el almacén de objetos
   */
  async clear(): Promise<void> {
    try {
      const db = await this.connectDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => {
          console.error('Error al limpiar IndexedDB:', event);
          reject(new Error('Error al limpiar IndexedDB'));
        };
      });
    } catch (error) {
      console.error('Error en operación de IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Verifica si la clave existe en IndexedDB
   */
  async has(key: string): Promise<boolean> {
    try {
      const result = await this.load(key);
      return result !== null;
    } catch (error) {
      console.error('Error al verificar clave en IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Cierra la conexión a la base de datos
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}