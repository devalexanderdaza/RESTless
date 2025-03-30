import { SchemaDefinition } from './types';
import { RelationManager } from './RelationManager';
import { Database } from '../db';

/**
 * Registro central de esquemas para la aplicación
 */
export class SchemaRegistry {
  private static instance: SchemaRegistry;
  private relationManager?: RelationManager;
  private schemas: Map<string, SchemaDefinition>;
  
  private constructor() {
    this.schemas = new Map();
  }
  
  /**
   * Obtiene la instancia del registry (singleton)
   */
  public static getInstance(): SchemaRegistry {
    if (!SchemaRegistry.instance) {
      SchemaRegistry.instance = new SchemaRegistry();
    }
    return SchemaRegistry.instance;
  }
  
  /**
   * Inicializa el registro con una base de datos
   */
  public initialize(db: Database): void {
    this.relationManager = new RelationManager(db);
    
    // Registrar esquemas existentes en el gestor de relaciones
    this.schemas.forEach(schema => {
      this.relationManager!.registerSchema(schema);
    });
  }
  
  /**
   * Registra un esquema
   */
  public registerSchema(schema: SchemaDefinition): void {
    this.schemas.set(schema.name, schema);
    
    // Si el gestor de relaciones ya está inicializado, registrar también allí
    if (this.relationManager) {
      this.relationManager.registerSchema(schema);
    }
  }
  
  /**
   * Obtiene un esquema registrado
   */
  public getSchema(collectionName: string): SchemaDefinition | undefined {
    return this.schemas.get(collectionName);
  }
  
  /**
   * Obtiene todos los esquemas registrados
   */
  public getAllSchemas(): SchemaDefinition[] {
    return Array.from(this.schemas.values());
  }
  
  /**
   * Obtiene el gestor de relaciones
   */
  public getRelationManager(): RelationManager | undefined {
    return this.relationManager;
  }
}