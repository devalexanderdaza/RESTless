/**
 * Interfaz para adaptadores de almacenamiento
 * Permite intercambiar entre diferentes mecanismos (localStorage, IndexedDB, etc.)
 */
export interface StorageAdapter {
    /**
     * Guarda datos en el almacenamiento
     * @param key Clave para identificar los datos
     * @param data Datos a almacenar
     */
    save(key: string, data: any): Promise<void>;
  
    /**
     * Carga datos desde el almacenamiento
     * @param key Clave de los datos a cargar
     * @returns Datos almacenados o null si no existen
     */
    load(key: string): Promise<any>;
  
    /**
     * Elimina datos del almacenamiento
     * @param key Clave de los datos a eliminar
     */
    remove(key: string): Promise<void>;
  
    /**
     * Limpia todo el almacenamiento
     */
    clear(): Promise<void>;
  
    /**
     * Verifica si la clave existe en el almacenamiento
     * @param key Clave a verificar
     */
    has(key: string): Promise<boolean>;
  }