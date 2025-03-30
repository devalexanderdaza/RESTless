import { StorageAdapter } from './storage/StorageAdapter';
import { LocalStorageAdapter } from './storage/LocalStorageAdapter';
import { IndexedDBAdapter } from './storage/IndexedDBAdapter';
import { PaginatedResult, QueryProcessor } from './query/QueryProcessor';
import { QueryOptions, FilterGroup, ComparisonOperator } from './query/types';

export type StorageType = 'localStorage' | 'indexedDB';

export class Database {
  private storageKey: string;
  private data: Record<string, any[]>;
  private adapter: StorageAdapter;
  private initialized: boolean = false;

  constructor(storageKey: string = 'browser-api-db', storageType: StorageType = 'localStorage') {
    this.storageKey = storageKey;
    this.data = {};
    this.adapter = this.createAdapter(storageType);
  }

  /**
   * Crea el adaptador de almacenamiento adecuado según el tipo
   */
  private createAdapter(type: StorageType): StorageAdapter {
    switch (type) {
      case 'localStorage':
        return new LocalStorageAdapter();
      case 'indexedDB':
        return new IndexedDBAdapter();
      default:
        return new LocalStorageAdapter();
    }
  }

  /**
   * Cambia el adaptador de almacenamiento
   * @param newType Nuevo tipo de almacenamiento
   */
  public async changeStorage(newType: StorageType): Promise<void> {
    // Guarda los datos actuales
    const currentData = this.data;
    
    // Crea el nuevo adaptador
    const newAdapter = this.createAdapter(newType);
    
    // Guarda los datos con el nuevo adaptador
    await newAdapter.save(this.storageKey, currentData);
    
    // Actualiza el adaptador
    this.adapter = newAdapter;
  }

  /**
   * Carga los datos desde el almacenamiento
   */
  private async load(): Promise<Record<string, any[]>> {
    try {
      const stored = await this.adapter.load(this.storageKey);
      return stored || {};
    } catch (error) {
      console.error('Error al cargar datos:', error);
      return {};
    }
  }

  /**
   * Guarda los datos en el almacenamiento
   */
  private async save(): Promise<void> {
    try {
      await this.adapter.save(this.storageKey, this.data);
    } catch (error) {
      console.error('Error al guardar datos:', error);
      throw new Error(`Error al guardar datos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Inicializa la base de datos con datos
   */
  public async initialize(initialData: Record<string, any[]> = {}): Promise<void> {
    if (!this.initialized) {
      this.data = Object.keys(initialData).length > 0 ? initialData : await this.load();
      this.initialized = true;
    } else {
      this.data = initialData;
    }
    await this.save();
  }

  /**
   * Obtiene todas las colecciones
   */
  public getCollections(): string[] {
    return Object.keys(this.data);
  }

  /**
   * Verifica si existe una colección
   */
  public hasCollection(collection: string): boolean {
    return !!this.data[collection];
  }

  /**
   * Crea una colección si no existe
   */
  public async createCollection(collection: string): Promise<void> {
    if (!this.data[collection]) {
      this.data[collection] = [];
      await this.save();
    }
  }

  /**
   * Obtiene todos los elementos de una colección
   */
  public getAll(collection: string): any[] {
    return this.hasCollection(collection) ? [...this.data[collection]] : [];
  }

  /**
   * Obtiene un elemento por ID
   */
  public getById(collection: string, id: string | number): any {
    if (!this.hasCollection(collection)) return null;
    return this.data[collection].find(item => item.id === id);
  }

  /**
   * Añade un elemento a una colección
   */
  public async add(collection: string, item: any): Promise<any> {
    await this.createCollection(collection);
    
    // Asignar ID si no tiene
    if (!item.id) {
      const maxId = this.data[collection].reduce(
        (max, current) => (current.id > max ? current.id : max),
        0
      );
      item.id = maxId + 1;
    }
    
    this.data[collection].push(item);
    await this.save();
    return item;
  }

  /**
   * Actualiza un elemento existente
   */
  public async update(collection: string, id: string | number, updates: any): Promise<any> {
    if (!this.hasCollection(collection)) return null;
    
    const index = this.data[collection].findIndex(item => item.id === id);
    if (index === -1) return null;
    
    const updated = { ...this.data[collection][index], ...updates };
    this.data[collection][index] = updated;
    await this.save();
    return updated;
  }

  /**
   * Elimina un elemento por ID
   */
  public async remove(collection: string, id: string | number): Promise<boolean> {
    if (!this.hasCollection(collection)) return false;
    
    const initialLength = this.data[collection].length;
    this.data[collection] = this.data[collection].filter(item => item.id !== id);
    
    if (initialLength !== this.data[collection].length) {
      await this.save();
      return true;
    }
    return false;
  }

  /**
   * Consulta avanzada con filtros, ordenamiento y paginación
   */
  public query(collection: string, options: QueryOptions): PaginatedResult<any> {
    if (!this.hasCollection(collection)) {
      return {
        data: [],
        pagination: {
          total: 0,
          hasMore: false
        }
      };
    }
    
    return QueryProcessor.process(this.data[collection], options);
  }
  
  /**
   * Consulta simple con filtros de igualdad
   * Mantiene compatibilidad con versiones anteriores
   */
  public queryByFilters(collection: string, filters: Record<string, any>): any[] {
    if (!this.hasCollection(collection)) return [];
    
    // Convertir filtros simples a formato de condición
    const filterGroup: FilterGroup = {
      operator: 'and',
      conditions: Object.entries(filters).map(([field, value]) => ({
        field,
        operator: '=' as ComparisonOperator,
        value
      }))
    };
    
    // Usar el procesador de consultas
    const result = QueryProcessor.process(this.data[collection], { filter: filterGroup });
    return result.data;
  }

  /**
   * Exporta todos los datos
   */
  public async exportData(): Promise<Record<string, any[]>> {
    return { ...this.data };
  }

  /**
   * Importa datos y reemplaza los existentes
   */
  public async importData(data: Record<string, any[]>): Promise<void> {
    this.data = data;
    await this.save();
  }
}