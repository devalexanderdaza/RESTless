import { Database, StorageType } from './db';
import { Router } from './router';
import { SchemaDefinition, SchemaRegistry } from './schema';
import { HttpMethod, Response } from './types';

export interface ServerConfig {
  baseUrl?: string;
  storageType?: StorageType;
  storageKey?: string;
}

export class Server {
  private router: Router;
  private db: Database;
  private baseUrl: string;

  constructor(config: ServerConfig = {}) {
    const { baseUrl = '/api', storageType = 'localStorage', storageKey = 'browser-api-db' } = config;
    
    this.router = new Router();
    this.db = new Database(storageKey, storageType);
    this.baseUrl = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
  }

  /**
   * Obtiene la instancia del router
   */
  public getRouter(): Router {
    return this.router;
  }

  /**
   * Obtiene la instancia de la base de datos
   */
  public getDb(): Database {
    return this.db;
  }

  /**
   * Establece la URL base para todas las rutas
   */
  public setBaseUrl(url: string): void {
    this.baseUrl = url.startsWith('/') ? url : `/${url}`;
  }

  /**
   * Cambia el tipo de almacenamiento
   */
  public async changeStorage(newType: StorageType): Promise<void> {
    await this.db.changeStorage(newType);
  }

  /**
   * Inicializa el servidor con datos
   */
  public async initialize(initialData: Record<string, any[]> = {}): Promise<void> {
    await this.db.initialize(initialData);
    
    // Inicializar el registro de esquemas
    SchemaRegistry.getInstance().initialize(this.db);
  }

  /**
   * Procesa una solicitud al servidor
   */
  public async handleRequest(
    method: HttpMethod,
    url: string,
    headers: Record<string, string> = {},
    body: any = null
  ): Promise<Response> {
    // Si la URL no comienza con la URL base, no es para esta API
    if (!url.startsWith(this.baseUrl)) {
      return {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Not Found' }
      };
    }

    // Eliminar la URL base del path
    const apiPath = url.substring(this.baseUrl.length);
    
    // Procesar la solicitud a través del router
    return this.router.handleRequest(method, apiPath, headers, body);
  }

  /**
   * Exporta todos los datos
   */
  public async exportData(): Promise<Record<string, any[]>> {
    return this.db.exportData();
  }

  /**
   * Importa datos y reemplaza los existentes
   */
  public async importData(data: Record<string, any[]>): Promise<void> {
    await this.db.importData(data);
  }

  /**
   * Registra un esquema
   */
  public registerSchema(schema: SchemaDefinition): void {
    SchemaRegistry.getInstance().registerSchema(schema);
  }
}